import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';
import { DockerCleanupService } from '../../docker-cleanup.service';

@Injectable()
export class PyCompilerService {
    private readonly MAX_OUTPUT_SIZE = 1024 * 1024;

    constructor(private readonly cleanupService: DockerCleanupService) {}

    async compilePy(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '--memory=128m',
                '--cpus=0.5',
                '--network=none',
                'python:alpine',
                'python3',
                '-c',
                code,
            ]);

            this.cleanupService.registerProcess(child);

            let output = '';
            let error = '';
            let outputSize = 0;
            let errorSize = 0;
            const startTime = Date.now();
            let isResolved = false;
            let outputLimitReached = false;

            const timeout = setTimeout(() => {
                if (isResolved) return;
                isResolved = true;
                child.kill('SIGKILL');
                const endTime = Date.now();
                resolve({
                    success: false,
                    output: output,
                    error: 'Execution timed out (10 seconds limit)',
                    exitCode: -1,
                    executionTime: endTime - startTime,
                    language: 'Python',
                    timestamp: new Date(),
                });
            }, 10 * 1000);

            child.stdout.on('data', (data) => {
                if (outputLimitReached) return;

                const dataStr = data.toString();
                outputSize += dataStr.length;

                if (outputSize > this.MAX_OUTPUT_SIZE) {
                    outputLimitReached = true;
                    output += '\n... [Output truncated - exceeded 1MB limit]';
                    child.kill('SIGKILL');

                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(timeout);
                        const endTime = Date.now();
                        resolve({
                            success: false,
                            output: output,
                            error: 'Output limit exceeded (1MB maximum)',
                            exitCode: -1,
                            executionTime: endTime - startTime,
                            language: 'Python',
                            timestamp: new Date(),
                        });
                    }
                    return;
                }

                output += dataStr;
            });

            child.stderr.on('data', (data) => {
                const dataStr = data.toString();
                errorSize += dataStr.length;

                if (errorSize > this.MAX_OUTPUT_SIZE) {
                    error +=
                        '\n... [Error output truncated - exceeded 1MB limit]';
                    return;
                }

                error += dataStr;
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
                    language: 'Python',
                    timestamp: new Date(),
                });
            });

            child.on('close', (code) => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeout);
                const endTime = Date.now();
                resolve({
                    success: code === 0 && !outputLimitReached,
                    output: output,
                    error: error,
                    exitCode: code || 0,
                    executionTime: endTime - startTime,
                    language: 'Python',
                    timestamp: new Date(),
                });
            });

            child.stdin.end();
        });
    }
}
