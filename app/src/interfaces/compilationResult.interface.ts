export interface CompilationResult {
    success: boolean;
    output: string;
    error?: string;
    exitCode: number;
    executionTime: number;
    language: string;
    timestamp: Date;
}
