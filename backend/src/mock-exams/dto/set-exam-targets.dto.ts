import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class SetExamTargetsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  examCodes: string[]; // ['TYT', 'AYT_SAY']
}
