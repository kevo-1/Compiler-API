import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';

@Injectable()
export class TSCompilerService {
    async compileTS(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { transpileModule } = require('typescript');
            const { spawn } = require('child_process');

            let transpiledCode = '';
            try {
                const result = transpileModule(code, {
                    compilerOptions: { module: 1 },
                });
                transpiledCode = result.outputText;
            } catch (err) {
                return resolve({
                    success: false,
                    output: '',
                    error: `Transpilation Error: ${err.message}`,
                    exitCode: 1,
                    executionTime: 0,
                    language: 'TypeScript',
                    timestamp: new Date(),
                });
            }

            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                'node:alpine',
                'node',
            ]);

            let output = '';
            let error = '';
            const startTime = Date.now();
            let isResolved = false;

            const timeout = setTimeout(
                () => {
                    if (isResolved) return;
                    isResolved = true;
                    child.kill();
                    const endTime = Date.now();
                    resolve({
                        success: false,
                        output: output,
                        error: 'Execution timed out',
                        exitCode: -1,
                        executionTime: endTime - startTime,
                        language: 'TypeScript',
                        timestamp: new Date(),
                    });
                },
                2 * 60 * 1000,
            );

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('error', (err) => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeout);
                const endTime = Date.now();
                resolve({
                    success: false,
                    output: output,
                    error: err.message,
                    exitCode: -1,
                    executionTime: endTime - startTime,
                    language: 'TypeScript',
                    timestamp: new Date(),
                });
            });

            child.on('close', (code) => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeout);
                const endTime = Date.now();
                resolve({
                    success: code === 0,
                    output: output,
                    error: error,
                    exitCode: code || 0,
                    executionTime: endTime - startTime,
                    language: 'TypeScript',
                    timestamp: new Date(),
                });
            });

            child.stdin.write(transpiledCode);
            child.stdin.end();
        });
    }
}
