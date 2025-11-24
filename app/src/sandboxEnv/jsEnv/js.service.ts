import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';

@Injectable()
export class JSCompilerService {
    async compileJS(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
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
                        language: 'JavaScript',
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
                    language: 'JavaScript',
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
                    language: 'JavaScript',
                    timestamp: new Date(),
                });
            });

            child.stdin.write(code);
            child.stdin.end();
        });
    }
}
