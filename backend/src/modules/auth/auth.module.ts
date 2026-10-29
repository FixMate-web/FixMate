import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CsrfOriginGuard, JwtAuthGuard, RolesGuard } from '../../common/auth';
import {
  ProvidersPersistenceModule,
  UsersPersistenceModule,
} from '../../database/models/domain-persistence.modules';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersPersistenceModule,
    ProvidersPersistenceModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_ACCESS_TTL_SECONDS', 900),
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, CsrfOriginGuard],
  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard, RolesGuard, CsrfOriginGuard],
})
export class AuthModule {}
