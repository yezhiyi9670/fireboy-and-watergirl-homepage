import { Transform, plainToInstance, type TransformFnParams } from 'class-transformer';

/**
 * Custom transformer for Record<string, T> to deeply hydrate nested class instances.
 * Use this instead of @Type() for Record/Dictionary types.
 * 
 * This returns a null-prototype object which serves the purpose of a dict.
 */
export function TransformNPDict<T>(classType: new () => T) {
  return Transform(({ value }: TransformFnParams) => {
    // If the value is missing, null, or not a plain object, leave it alone
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }
    
    const result: Record<string, T> = Object.create(null);
    for (const [key, rawValue] of Object.entries(value)) {
      // Recursively hydrate each value. 
      // plainToInstance will respect any @Type decorators inside T as well.
      result[key] = plainToInstance(classType, rawValue);
    }
    return result;
  }, { toClassOnly: true });
}
