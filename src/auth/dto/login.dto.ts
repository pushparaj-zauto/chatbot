import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
