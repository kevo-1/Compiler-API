import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableShutdownHooks();

    process.on('SIGINT', async () => {
        console.log('Received SIGINT, shutting down gracefully...');
        await app.close();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        await app.close();
        process.exit(0);
    });

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
