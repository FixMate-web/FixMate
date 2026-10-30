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
          // Await explicitly so retry logging receives only a sanitized error.
          lazyConnection: true,
          autoIndex: nodeEnv !== 'production',
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          retryAttempts: 3,
          retryDelay: 1000,
          verboseRetryLog: false,
          connectionErrorFactory: () => new Error(
            'MongoDB connection failed. Check MONGODB_URI, DNS, TLS, database credentials and Atlas Network Access.',
          ),
          connectionFactory: async (connection: Connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connection established');
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB connection disconnected');
            });
            connection.on('error', () => {
              logger.error('MongoDB connection error; check connectivity and database configuration.');
            });
            try {
              await connection.asPromise();
              return connection;
            } catch {
              await connection.close().catch(() => undefined);
              throw new Error('MongoDB connection failed. Check URI, DNS, TLS, credentials and Network Access.');
            }
          },
        };
      },
    }),
    ...DOMAIN_PERSISTENCE_MODULES,
  ],
  exports: [MongooseModule, ...DOMAIN_PERSISTENCE_MODULES],
})
export class DatabaseModule {}
