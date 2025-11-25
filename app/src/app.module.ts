import { Module } from '@nestjs/common';
import { CompilerController } from './compiler.controller';
import { CompilerService } from './compiler.service';
import { JSCompilerService } from './sandboxEnv/jsEnv/js.service';
import { TSCompilerService } from './sandboxEnv/tsEnv/ts.service';
import { PyCompilerService } from './sandboxEnv/pyEnv/py.service';
import { GoCompilerService } from './sandboxEnv/goEnv/go.service';
import { CCompilerService } from './sandboxEnv/cEnv/c.service';
import { CompilationQueueService } from './compilation-queue.service';
import { DockerCleanupService } from './docker-cleanup.service';

@Module({
    imports: [],
    controllers: [CompilerController],
    providers: [
        CompilerService,
        JSCompilerService,
        TSCompilerService,
        PyCompilerService,
        GoCompilerService,
        CCompilerService,
        CompilationQueueService,
        DockerCleanupService,
    ],
})
export class AppModule {}
