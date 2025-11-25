import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';
import { DockerCleanupService } from '../../docker-cleanup.service';

@Injectable()
export class JSCompilerService {
    private readonly MAX_OUTPUT_SIZE = 1024 * 1024;

    constructor(private readonly cleanupService: DockerCleanupService) {}

    async compileJS(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '--memory=64m',
                '--cpus=0.25',
                '--pids-limit=20',
                '--ulimit',
                'cpu=2:2',
                '--ulimit',
                'nofile=64:64',
                '--network=none',
                '--network=none',
                'node:alpine',
                'node',
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
                    error: 'Execution timed out (5 seconds limit)',
                    exitCode: -1,
                    executionTime: endTime - startTime,
                    language: 'JavaScript',
                    timestamp: new Date(),
                });
            }, 5 * 1000);

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
                            language: 'JavaScript',
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
                    success: code === 0 && !outputLimitReached,
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
