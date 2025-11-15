import { Injectable } from '@nestjs/common';
import { CompilationResult } from '../../interfaces/compilationResult.interface';

@Injectable()
export class TSCompilerService {
    //TODO: Implement the execution env
    compileTS(code: string): CompilationResult {
        return {
            success: true,
            output: '',
            error: '',
            exitCode: 0,
            executionTime: Date.now(),
            language: 'JavaScript',
            timestamp: new Date(),
        };
    }
}
