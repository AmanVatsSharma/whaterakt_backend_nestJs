import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsPhoneNumber, IsArray, ArrayMaxSize } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  to: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  message: string;

  @Field({ nullable: true })
  @IsString()
  templateName?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayMaxSize(3)
  quickReplies?: string[];
} 