import { Module } from '@nestjs/common';
import { CompilerController } from './compiler.controller';
import { CompilerService } from './compiler.service';
import { JSCompilerService } from './sandboxEnv/jsEnv/js.service';
import { TSCompilerService } from './sandboxEnv/tsEnv/ts.service';

@Module({
    imports: [],
    controllers: [CompilerController],
    providers: [CompilerService, JSCompilerService, TSCompilerService],
})
export class AppModule {}
