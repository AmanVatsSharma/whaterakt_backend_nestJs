import { Query, Mutation, Resolver, ArgsType, InputType, Args } from '@nestjs/graphql';

type ClassType<T = any> = new (...args: any[]) => T;

export function createResolver<T extends ClassType, K extends ClassType>(
  suffix: string,
  returnType: T,
  inputType: K,
) {
  @InputType()
  abstract class Input extends inputType {}

  @Resolver()
  abstract class BaseResolver {
    @Mutation(() => returnType, { name: `create${suffix}` })
    async create(@Args('data', { type: () => inputType }) data: Input) {
      return data;
    }

    @Query(() => [returnType], { name: `getAll${suffix}s` })
    async findAll() {
      return [];
    }
  }

  return BaseResolver;
} 