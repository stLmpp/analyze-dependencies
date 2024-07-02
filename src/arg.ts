import { z, ZodObject, ZodSchema } from 'zod';
import arg from 'arg';
import { camelCase, snakeCase } from 'case-anything';

export const MAIN_ARGS = arg(
  {},
  {
    permissive: true,
  },
);

export function getArgs<T extends ZodSchema>(
  schema?: T,
): { _: string[] } & z.output<T> {
  const nschema = schema ?? z.object({});
  if (!(nschema instanceof ZodObject)) {
    throw new TypeError('Schema should be a ZodObject');
  }
  const keys = Object.fromEntries(
    Object.keys(nschema.shape).map((key) => [`--${snakeCase(key)}`, String]),
  );
  const rawArgs = arg(keys);
  console.log('raw args', rawArgs);
  const argsCamelCase = Object.fromEntries(
    Object.entries(rawArgs).map(([key, value]) => [
      camelCase(key.replace(/^--/, '')),
      value,
    ]),
  );
  return Object.assign(nschema.parse(argsCamelCase), { _: rawArgs._ });
}
