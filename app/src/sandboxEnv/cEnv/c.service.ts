import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';
import { DockerCleanupService } from '../../docker-cleanup.service';

@Injectable()
export class CCompilerService {
    private readonly MAX_OUTPUT_SIZE = 1024 * 1024;

    constructor(private readonly cleanupService: DockerCleanupService) {}

    async compileC(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const child = spawn('docker', [
                'run',
                '--rm',
                '-i',
                '--memory=256m',
                '--memory-swap=256m',
                '--cpus=0.5',
                '--pids-limit=50',
                '--ulimit',
                'cpu=10:10',
                '--ulimit',
                'nofile=64:64',
                '--network=none',
                'c-runner',
                'sh',
                '-c',
                'cat > /tmp/code.c && gcc -Wall -Wextra -o /tmp/code.out /tmp/code.c 2>&1 && timeout 8s /tmp/code.out',
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
                    error: 'Execution timed out (15 seconds limit)',
                    exitCode: -1,
                    executionTime: endTime - startTime,
                    language: 'C',
                    timestamp: new Date(),
                });
            }, 15 * 1000);

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
                            language: 'C',
                            timestamp: new Date(),
                        });
                    }
                    return;
                }

                output += dataStr;
            });

            child.stderr.on('data', (data) => {
                const dataStr = data.toString();

                if (
                    dataStr.includes('Unable to find image') ||
                    dataStr.includes('Pulling from library') ||
                    dataStr.includes('Pulling fs layer') ||
                    dataStr.includes('Downloading') ||
                    dataStr.includes('Download complete') ||
                    dataStr.includes('Extracting') ||
                    dataStr.includes('Pull complete') ||
                    dataStr.includes('Digest: sha256') ||
                    dataStr.includes('Status: Downloaded newer image') ||
                    dataStr.includes('Verifying Checksum')
                ) {
                    return;
                }

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
                    language: 'C',
                    timestamp: new Date(),
                });
            });

            child.on('close', (code) => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeout);
                const endTime = Date.now();

                let finalError = error;

                if (code === 137 || (code === 1 && error.includes('Killed'))) {
                    finalError =
                        'Memory limit exceeded (256MB maximum)\n' + error;
                } else if (error.includes('Segmentation fault')) {
                    finalError =
                        'Runtime Error: Segmentation fault (invalid memory access)\n' +
                        error;
                } else if (error.includes('/tmp/code.c:')) {
                    finalError = error.replace(/\/tmp\/code\.c:/g, 'Line ');
                }

                resolve({
                    success: code === 0 && !outputLimitReached,
                    output: output,
                    error: finalError,
                    exitCode: code || 0,
                    executionTime: endTime - startTime,
                    language: 'C',
                    timestamp: new Date(),
                });
            });

            child.stdin.write(code);
            child.stdin.end();
        });
    }
}
