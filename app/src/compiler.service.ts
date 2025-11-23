import { Injectable, BadRequestException } from '@nestjs/common';
import { JSCompilerService } from './sandboxEnv/jsEnv/js.service';
import { TSCompilerService } from './sandboxEnv/tsEnv/ts.service';
import { CompilationResult } from './interfaces/compilationResult.interface';

@Injectable()
export class CompilerService {
    constructor(
        private readonly jsCompiler: JSCompilerService,
        private readonly tsCompiler: TSCompilerService,
    ) {}

    private readonly SUPPORTED_LANGUAGES = [
        'javascript',
        'typescript',
        'python',
        'c',
        'go',
    ] as const;

    async routeToCompiler(language: string, code: string): Promise<CompilationResult> {
        const normalizedLanguage = language.toLowerCase().trim();

        if (!this.SUPPORTED_LANGUAGES.includes(normalizedLanguage as any)) {
            throw new BadRequestException(
                `Language '${language}' is not supported. Supported languages: ${this.SUPPORTED_LANGUAGES.join(', ')}`,
            );
        }

        switch (normalizedLanguage) {
            case 'javascript':
                return await this.jsCompiler.compileJS(code);

            case 'typescript':
                return await this.tsCompiler.compileTS(code);

            default:
                throw new BadRequestException(
                    `Compiler for '${language}' not implemented`,
                );
        }
    }
}
