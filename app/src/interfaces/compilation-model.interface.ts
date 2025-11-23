import { CompilationResult } from './compilationResult.interface';

export enum CompilationStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface CompilationRequest {
    id: string;
    language: string;
    code: string;
    status: CompilationStatus;
    result?: CompilationResult;
    createdAt: Date;
    updatedAt: Date;
}
