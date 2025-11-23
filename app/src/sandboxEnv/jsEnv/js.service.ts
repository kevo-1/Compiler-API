import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';

@Injectable()
export class JSCompilerService {
    async compileJS(code: string): Promise<CompilationResult> {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const child = spawn('docker', ['run', '--rm', '-i', 'node:alpine', 'node']);

            let output = '';
            let error = '';
            const startTime = Date.now();

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('close', (code) => {
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
