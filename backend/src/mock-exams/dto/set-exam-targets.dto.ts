import { IsArray, IsString, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class SetExamTargetsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  examCodes: string[]; // ['TYT', 'AYT_SAY']
}
