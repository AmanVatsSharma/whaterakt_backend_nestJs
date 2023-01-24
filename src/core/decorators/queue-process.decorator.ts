import { SetMetadata } from '@nestjs/common';

export const QUEUE_PROCESSOR = Symbol('QUEUE_PROCESSOR');
export const Process = (name?: string) => SetMetadata(QUEUE_PROCESSOR, name || 'default'); 