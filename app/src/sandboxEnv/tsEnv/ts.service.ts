import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';

@Injectable()
export class TSCompilerService {
    async compileTS(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                'ts-runner',
                'ts-node', // explicitly calling ts-node, though it is CMD
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
                10 * 1000, // 10 seconds timeout
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

            child.stdin.write(code);
            child.stdin.end();
        });
    }
}
