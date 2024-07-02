import { z, ZodSchema } from 'zod';
import { getArgs } from './arg.js';

export interface CommandExecutor {
  (): void | Promise<void>;
}

export interface CommandAction<Schema extends ZodSchema = ZodSchema> {
  (args: z.output<Schema>): void | Promise<void>;
}

export class Command<Schema extends ZodSchema> {
  constructor(
    public readonly name: string,
    private readonly schema?: Schema,
  ) {}

  private readonly actions: Array<CommandAction<Schema>> = [];

  withSchema<T extends ZodSchema>(schema: T): Command<T> {
    return new Command<T>(this.name, schema);
  }

  withAction(action: CommandAction<Schema>): this {
    this.actions.push(action);
    return this;
  }

  build(): CommandExecutor {
    if (!this.actions.length) {
      console.warn(`No actions were defined in the command ${this.name}`);
    }
    return async () => {
      const args = getArgs(this.schema);
      for (const action of this.actions) {
        await action(args);
      }
    };
  }
}
