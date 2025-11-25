import { Module } from '@nestjs/common';
import { CompilerController } from './compiler.controller';
import { CompilerService } from './compiler.service';
import { JSCompilerService } from './sandboxEnv/jsEnv/js.service';
import { TSCompilerService } from './sandboxEnv/tsEnv/ts.service';
import { CompilationQueueService } from './compilation-queue.service';
import { DockerCleanupService } from './docker-cleanup.service';

@Module({
    imports: [],
    controllers: [CompilerController],
    providers: [
        CompilerService,
        JSCompilerService,
        TSCompilerService,
        CompilationQueueService,
        DockerCleanupService,
    ],
})
export class AppModule {}
