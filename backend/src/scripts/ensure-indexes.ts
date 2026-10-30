import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../app.module';

// Add declared indexes without dropping existing indexes or modifying application data.
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const connection = app.get<Connection>(getConnectionToken());
    for (const name of connection.modelNames()) {
      await connection.model(name).createIndexes();
      console.log(`Indexes ensured: ${name}`);
    }
  } finally {
    await app.close();
  }
}

void run().catch(() => {
  console.error('Index initialization failed. Check configuration, connectivity, permissions and duplicate data. No indexes were dropped.');
  process.exitCode = 1;
});
