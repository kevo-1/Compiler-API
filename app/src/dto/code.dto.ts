import { IsString, IsNotEmpty } from 'class-validator';

export class CompileCodeDto {
    @IsString()
    @IsNotEmpty()
    code: string;
}
