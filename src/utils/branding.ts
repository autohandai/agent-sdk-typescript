/**
 * Utility functions for creating branded types and const assertions.
 * Follows TypeScript best practices for type safety.
 */

/**
 * Create a branded type for preventing mixing with other strings.
 */
export function createBrand<T extends string>() {
  return <T extends string>(value: T): T & { readonly __brand: T } => {
    return value as T & { readonly __brand: T };
  };
}

/**
 * Create a const assertion for literal types.
 */
export function createConstAssertion<T extends readonly unknown[]>(values: T) {
  return values as T;
}

/**
 * Helper to create branded IDs.
 */
export const createId = {
  toolCall: createBrand<'ToolCallId'>(),
  session: createBrand<'SessionId'>(),
  model: createBrand<'ModelId'>(),
};

/**
 * Common branded type creators.
 */
export type BrandedString<T extends string> = string & { readonly __brand: T };

/**
 * Helper to check if a value is a branded type.
 */
export function isBranded<T extends string>(
  value: unknown,
  brand: T
): value is BrandedString<T> {
  if (typeof value !== 'string') return false;
  return '__brand' in (value as unknown as Record<string, unknown>);
}
