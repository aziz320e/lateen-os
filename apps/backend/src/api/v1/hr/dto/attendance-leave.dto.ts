import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const LEAVE_TYPES = ['annual', 'sick', 'unpaid', 'maternity_paternity', 'emergency'] as const;
const LEAVE_STATUSES = ['requested', 'approved', 'rejected', 'cancelled', 'completed'] as const;

export class ClockInDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() at?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() scheduledStartAt?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() at?: string;
}

export class RecordAbsenceDto {
  @ApiProperty() @IsISO8601() date!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class RegisterHolidayDto {
  @ApiProperty() @IsISO8601() date!: string;
  @ApiProperty() @IsString() name!: string;
}

export class ListAttendanceDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() employeeId?: string;
}

export class RequestLeaveDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty({ enum: LEAVE_TYPES }) @IsIn(LEAVE_TYPES) leaveType!: (typeof LEAVE_TYPES)[number];
  @ApiProperty() @IsISO8601() startDate!: string;
  @ApiProperty() @IsISO8601() endDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ListLeaveRequestsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() employeeId?: string;
  @ApiPropertyOptional({ enum: LEAVE_STATUSES })
  @IsOptional()
  @IsIn(LEAVE_STATUSES)
  status?: (typeof LEAVE_STATUSES)[number];
}

export class UpsertLeaveBalanceDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty({ enum: LEAVE_TYPES }) @IsIn(LEAVE_TYPES) leaveType!: (typeof LEAVE_TYPES)[number];
  @ApiProperty() @IsNumber() year!: number;
  @ApiProperty() @IsNumber() allocatedDays!: number;
}
