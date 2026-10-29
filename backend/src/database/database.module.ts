import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DOMAIN_PERSISTENCE_MODULES } from './models/domain-persistence.modules';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const uri = configService.getOrThrow<string>('MONGODB_URI');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');

        return {
          uri,
          autoIndex: nodeEnv !== 'production',
          serverSelectionTimeoutMS: 5000,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connection established');
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB connection disconnected');
            });
            connection.on('error', (err: Error) => {
              logger.error(`MongoDB connection error: ${err.message}`);
            });
            return connection;
          },
        };
      },
    }),
    ...DOMAIN_PERSISTENCE_MODULES,
  ],
  exports: [MongooseModule, ...DOMAIN_PERSISTENCE_MODULES],
})
export class DatabaseModule {}
