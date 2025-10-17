import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsPhoneNumber, IsArray, ArrayMaxSize, IsOptional, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

@InputType({ description: 'Send a WhatsApp message. Supports text, media, templates, quick replies, and lists.' })
export class SendMessageInput {
  @Field({ description: 'Recipient phone in E.164 format (e.g., +15551234567)' })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  to: string;

  @Field({ description: 'Plain text message body (ignored if template/media is used)' })
  @IsString()
  @IsNotEmpty()
  message: string;


  @Field(() => [String], { nullable: true, description: 'Up to 3 quick reply buttons (titles)' })
  @IsArray()
  @ArrayMaxSize(3)
  quickReplies?: string[];

  @Field({ nullable: true, description: 'Approved template name for HSM messages' })
  @IsOptional()
  @IsString()
  templateName?: string;

  @Field(() => [String], { nullable: true, description: 'Template parameters to substitute into body' })
  @IsOptional()
  @IsArray()
  templateParams?: string[];

  @Field(() => [ListSectionInput], { nullable: true, description: 'Interactive list sections with rows' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ListSectionInput)
  listSections?: ListSectionInput[];

  @Field(() => MediaType, { nullable: true, description: 'Media type when sending media (image, document, video, audio, sticker)' })
  @IsOptional()
  mediaType?: MediaType;

  @Field({ nullable: true, description: 'Media URL (publicly accessible) for media messages' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  mediaUrl?: string;

  @Field({ nullable: true, description: 'Optional caption for media' })
  @IsOptional()
  @IsString()
  mediaCaption?: string;

  @Field({ nullable: true, description: 'Optional filename for document media' })
  @IsOptional()
  @IsString()
  mediaFilename?: string;
} 

@InputType({ description: 'A list section containing one or more rows' })
export class ListSectionInput {
  @Field({ description: 'Section title' })
  @IsString()
  title: string;

  @Field(() => [ListRowInput], { description: 'Rows displayed inside this section' })
  @ValidateNested({ each: true })
  @Type(() => ListRowInput)
  rows: ListRowInput[];
}

@InputType({ description: 'A single row item inside a list section' })
export class ListRowInput {
  @Field({ description: 'Unique row identifier' })
  @IsString()
  id: string;

  @Field({ description: 'Row title visible to the user' })
  @IsString()
  title: string;

  @Field({ nullable: true, description: 'Optional row description' })
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

registerEnumType(MediaType, { name: 'MediaType', description: 'Supported media types for WhatsApp messages' });