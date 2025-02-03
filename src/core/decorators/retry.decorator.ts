import { applyDecorators, CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from "@nestjs/common";
import { delay, retryWhen, take } from "rxjs";

export function Retry(retries = 3, delay = 1000) {
  return applyDecorators(
    UseInterceptors(new RetryInterceptor(retries, delay))
  );
}

class RetryInterceptor implements NestInterceptor {
  constructor(private retries: number, private delay: number) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      retryWhen(errors => errors.pipe(
        delay(this.delay),
        take(this.retries)
      ))
    );
  }
} 