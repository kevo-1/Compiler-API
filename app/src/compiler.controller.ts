import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { CompilationQueueService } from './compilation-queue.service';
import { CompileCodeDto } from './dto/code.dto';
import { CompilationRequest } from './interfaces/compilation-model.interface';

@Controller('compiler')
export class CompilerController {
    constructor(private readonly queueService: CompilationQueueService) {}

    @Post(':language')
    async compileCode(
        @Param('language') language: string,
        @Body() compileCodeDto: CompileCodeDto,
    ): Promise<{ id: string; status: string }> {
        const id = this.queueService.enqueue(language, compileCodeDto.code);
        return { id, status: 'PENDING' };
    }

    @Get(':id')
    async getCompilationStatus(
        @Param('id') id: string,
    ): Promise<CompilationRequest> {
        return this.queueService.get(id);
    }
}
