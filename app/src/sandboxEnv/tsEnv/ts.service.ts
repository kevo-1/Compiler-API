import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';
import { JSCompilerService } from '../jsEnv/js.service';
import * as ts from 'typescript';

@Injectable()
export class TSCompilerService {
    constructor(private readonly jsCompilerService: JSCompilerService) {}

    async compileTS(code: string): Promise<CompilationResult> {
        const startTime = Date.now();

        try {
            const typeCheckResult = this.checkTypeErrors(code);

            if (!typeCheckResult.success) {
                return {
                    success: false,
                    output: '',
                    error: typeCheckResult.error,
                    exitCode: 1,
                    executionTime: Date.now() - startTime,
                    language: 'TypeScript',
                    timestamp: new Date(),
                };
            }

            const transpiledCode = this.transpileCode(code);

            const jsResult =
                await this.jsCompilerService.compileJS(transpiledCode);

            return {
                ...jsResult,
                language: 'TypeScript',
                executionTime: Date.now() - startTime,
            };
        } catch (err) {
            return {
                success: false,
                output: '',
                error: `Compilation Error: ${err.message}`,
                exitCode: 1,
                executionTime: Date.now() - startTime,
                language: 'TypeScript',
                timestamp: new Date(),
            };
        }
    }

    private checkTypeErrors(code: string): {
        success: boolean;
        error?: string;
    } {
        const fileName = 'input.ts';

        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            lib: ['ES2020'],

            strict: true,
            noImplicitAny: true,
            strictNullChecks: true,
            strictFunctionTypes: true,
            strictBindCallApply: true,

            noUnusedLocals: true,
            noUnusedParameters: true,
            noImplicitReturns: true,
            noFallthroughCasesInSwitch: true,
            allowUnreachableCode: false,

            skipLibCheck: true,
            noEmit: true,

            isolatedModules: false,
        };

        const compilerHost = ts.createCompilerHost(compilerOptions);

        const originalGetSourceFile = compilerHost.getSourceFile;
        compilerHost.getSourceFile = (
            filename,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
        ) => {
            if (filename === fileName) {
                return ts.createSourceFile(
                    filename,
                    code,
                    languageVersion,
                    true,
                );
            }
            return originalGetSourceFile.call(
                compilerHost,
                filename,
                languageVersion,
                onError,
                shouldCreateNewSourceFile,
            );
        };

        const program = ts.createProgram(
            [fileName],
            compilerOptions,
            compilerHost,
        );

        const allDiagnostics = [
            ...program.getSyntacticDiagnostics(),
            ...program.getSemanticDiagnostics(),
        ];

        const diagnostics = allDiagnostics.filter((d) => {
            if (d.file?.fileName !== fileName) {
                return false;
            }

            const message = ts.flattenDiagnosticMessageText(
                d.messageText,
                '\n',
            );
            if (message.includes('Duplicate identifier') && d.code === 2300) {
                const identifierMatch = message.match(
                    /Duplicate identifier '(\w+)'/,
                );
                if (identifierMatch) {
                    const identifier = identifierMatch[1];
                    const commonLibNames = [
                        'test',
                        'name',
                        'length',
                        'toString',
                        'constructor',
                    ];
                    const occurrences = (
                        code.match(new RegExp(`\\b${identifier}\\b`, 'g')) || []
                    ).length;
                    if (occurrences <= 1) {
                        return false;
                    }
                }
            }

            return true;
        });

        const errors = diagnostics.filter(
            (d) => d.category === ts.DiagnosticCategory.Error,
        );

        if (errors.length > 0) {
            const formatted = errors
                .map((d) => {
                    const message = ts.flattenDiagnosticMessageText(
                        d.messageText,
                        '\n',
                    );
                    if (d.file && d.start !== undefined) {
                        const { line, character } =
                            d.file.getLineAndCharacterOfPosition(d.start);
                        return `Line ${line + 1}, Column ${character + 1}: ${message}`;
                    }
                    return message;
                })
                .join('\n');

            return {
                success: false,
                error: `TypeScript Error:\n${formatted}`,
            };
        }

        return { success: true };
    }

    private transpileCode(code: string): string {
        const result = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.CommonJS,
            },
        });

        return result.outputText;
    }
}
