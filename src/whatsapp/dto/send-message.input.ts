import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsPhoneNumber, IsArray, ArrayMaxSize, IsOptional, ValidateNested, IsUrl } from 'class-validator';
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

  @Field(() => MediaType, { nullable: true })
  @IsOptional()
  mediaType?: MediaType;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false })
  mediaUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mediaCaption?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mediaFilename?: string;
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

export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  STICKER = 'sticker',
}

registerEnumType(MediaType, { name: 'MediaType' });