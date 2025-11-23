import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    CompilationRequest,
    CompilationStatus,
} from './interfaces/compilation-model.interface';
import { CompilerService } from './compiler.service';

@Injectable()
export class CompilationQueueService {
    private queue: CompilationRequest[] = [];
    private requests: Map<string, CompilationRequest> = new Map();
    private isProcessing = false;

    constructor(private readonly compilerService: CompilerService) {}

    enqueue(language: string, code: string): string {
        const id = uuidv4();
        const request: CompilationRequest = {
            id,
            language,
            code,
            status: CompilationStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.requests.set(id, request);
        this.queue.push(request);
        this.processQueue();

        return id;
    }

    get(id: string): CompilationRequest {
        const request = this.requests.get(id);
        if (!request) {
            throw new NotFoundException(
                `Compilation request with ID ${id} not found`,
            );
        }
        return request;
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const request = this.queue.shift();
            if (!request) break;

            request.status = CompilationStatus.PROCESSING;
            request.updatedAt = new Date();

            try {
                const result = await this.compilerService.routeToCompiler(
                    request.language,
                    request.code,
                );
                request.result = result;
                request.status = CompilationStatus.COMPLETED;
            } catch (error) {
                request.status = CompilationStatus.FAILED;
                request.result = {
                    success: false,
                    output: '',
                    error: error.message || 'Unknown error',
                    exitCode: -1,
                    executionTime: 0,
                    language: request.language,
                    timestamp: new Date(),
                };
            } finally {
                request.updatedAt = new Date();
            }
        }

        this.isProcessing = false;
    }
}
