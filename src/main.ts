import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Enable cors 
  app.enableCors({
    origin: ' http://localhost:5173',
    credentials: true
  });

  // Global validation pipeline
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  await app.listen(process.env.PORT ?? 3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();
