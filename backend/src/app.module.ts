import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { BooksModule } from './modules/books/books.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuthModule } from './modules/auth/auth.module';
import { LibraryModule } from './modules/library/library.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '../.env', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(4000),
        CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().min(24).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        PAYOS_CLIENT_ID: Joi.string().required(),
        PAYOS_API_KEY: Joi.string().required(),
        PAYOS_CHECKSUM_KEY: Joi.string().required(),
        PAYOS_RETURN_URL: Joi.string().uri().required(),
        PAYOS_CANCEL_URL: Joi.string().uri().required(),
        PAYOS_PAYMENT_EXPIRES_MINUTES: Joi.number().positive().default(15),
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('DATABASE_URL'),
      }),
    }),
    AuthModule,
    BooksModule,
    LibraryModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
