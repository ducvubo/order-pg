import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateShiftAssignmentDto {
  @IsNotEmpty({ message: 'Nhân viên không được để trống' })
  @IsMongoId({ message: 'Nhân viên không hợp lệ' })
  sasm_epl_id: string

  @IsNotEmpty({ message: 'Ca làm việc không được để trống' })
  @IsUUID('4', { message: 'Ca làm việc không hợp lê' })
  sasm_wks_id: string

  @IsOptional()
  @IsString({ message: 'Công việc phải là chuỗi' })
  sasm_todo_tasks: string

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  sasm_note: string
}
