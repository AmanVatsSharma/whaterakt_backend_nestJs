import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsPhoneNumber, IsArray, ArrayMaxSize, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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


  @Field(() => [String], { nullable: true })
  @IsArray()
  @ArrayMaxSize(3)
  quickReplies?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  templateName?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  templateParams?: string[];

  @Field(() => [ListSectionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ListSectionInput)
  listSections?: ListSectionInput[];
} 

@InputType()
export class ListSectionInput {
  @Field()
  @IsString()
  title: string;

  @Field(() => [ListRowInput])
  @ValidateNested({ each: true })
  @Type(() => ListRowInput)
  rows: ListRowInput[];
}

@InputType()
export class ListRowInput {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}