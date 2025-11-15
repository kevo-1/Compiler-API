import {
    Controller,
    Post,
    Param,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { CompilerService } from './compiler.service';
import { CompileCodeDto } from './dto/code.dto';
import { CompilationResult } from './interfaces/compilationResult.interface';

@Controller('compiler')
export class CompilerController {
    constructor(private readonly compilerService: CompilerService) {}

    @Post(':language')
    async compileCode(
        @Param('language') language: string,
        @Body() compileCodeDto: CompileCodeDto,
    ): Promise<CompilationResult> {
        return this.compilerService.routeToCompiler(
            language,
            compileCodeDto.code,
        );
    }
}
