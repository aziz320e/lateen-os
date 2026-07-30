import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsISO8601, IsNumber, IsString, ValidateNested } from 'class-validator';

export class ScheduleTaskDto {
  @ApiProperty() @IsString() taskId!: string;
  @ApiProperty() @IsNumber() durationDays!: number;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) dependsOnTaskIds!: string[];
}

export class ComputeScheduleDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiProperty() @IsISO8601() projectStartDate!: string;
  @ApiProperty({ type: [ScheduleTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleTaskDto)
  tasks!: ScheduleTaskDto[];
}
