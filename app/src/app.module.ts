import { Module } from '@nestjs/common';
import { CompilerController } from './compiler.controller';
import { CompilerService } from './compiler.service';
import { JSCompilerService } from './sandboxEnv/jsEnv/js.service';
import { TSCompilerService } from './sandboxEnv/tsEnv/ts.service';
import { CompilationQueueService } from './compilation-queue.service';

@Module({
    imports: [],
    controllers: [CompilerController],
    providers: [
        CompilerService,
        JSCompilerService,
        TSCompilerService,
        CompilationQueueService,
    ],
})
export class AppModule {}
