import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  readonly name: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be atleast 6 characters long' })
  readonly password: string;
}
