import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CloudflareAdapter } from '@mridang/nestjs-platform-cloudflare';
import { AppModule } from './app.module';

const adapter = new CloudflareAdapter();
const app = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn'] });
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
await app.init();

export default {
  fetch: (request: Request): Promise<Response> => adapter.handle(request),
};
