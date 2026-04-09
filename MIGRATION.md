# Migration Guide

This guide helps you migrate to the latest version of the Autohand Code Agent SDK for TypeScript.

## Version 0.2.0

### Breaking Changes

#### Tool Parameter Validation

**Before:**
```typescript
// Manual validation in ToolDefinition
protected validateParameters(params: Record<string, unknown>): string | null {
  // Manual type checking
}
```

**After:**
```typescript
// Zod-based validation
getParameterSchema(): z.ZodSchema<Record<string, unknown>> {
  // Override to provide custom validation
  // Default converts JSON Schema to Zod
}
```

**Migration:** If you have custom tool implementations that override `validateParameters`, you should now override `getParameterSchema` instead to provide Zod validation schemas.

#### Resource Management

**Before:**
```typescript
// No automatic cleanup
await Runner.run(agent, prompt);
```

**After:**
```typescript
// Automatic resource cleanup via SessionManager
await Runner.run(agent, prompt);
// Resources are automatically cleaned up on completion or error
```

**Migration:** No action required. Resource cleanup is now automatic. If you have custom tool implementations, you can implement the `Disposable` interface to clean up tool-specific resources.

#### Provider Interface

**Before:**
```typescript
provider.chat(messages, model, tools, maxTokens, temperature);
```

**After:**
```typescript
provider.chat(messages, model, tools, {
  maxTokens,
  temperature,
  timeout: 30000,
  maxRetries: 3,
  logger: consoleLogger
});
```

**Migration:** The `chat` method now accepts an options object instead of individual parameters. The old signature is still supported for backward compatibility, but we recommend migrating to the new options object for access to timeout, retry, and logging features.

#### Error Handling

**Before:**
```typescript
try {
  await provider.chat(...);
} catch (error) {
  // Generic Error
}
```

**After:**
```typescript
import { TimeoutError, RetryExhaustedError, ValidationError, ProviderError } from "@autohandai/agent-sdk";

try {
  await provider.chat(...);
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout
  } else if (error instanceof RetryExhaustedError) {
    // Handle retry exhaustion
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof ProviderError) {
    // Handle provider errors
  }
}
```

**Migration:** Update error handling to use the new error classes for better error classification and handling.

#### Dependency Changes

**Before:**
```json
{
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

**Migration:** Update your `package.json` to use the stable Zod 3.x version instead of the beta 4.x version.

### New Features

#### Timeout Handling
```typescript
provider.chat(messages, model, tools, { timeout: 60000 });
```

#### Retry Logic
```typescript
provider.chat(messages, model, tools, {
  maxRetries: 5,
  initialBackoffMs: 200,
  maxBackoffMs: 30000
});
```

#### Logging
```typescript
import { ConsoleLogger } from "@autohandai/agent-sdk";

const logger = new ConsoleLogger();
provider.chat(messages, model, tools, { logger });
```

#### Tool Schema Caching
Tool schemas are now automatically cached for better performance.

#### Resource Cleanup
Automatic resource cleanup via SessionManager prevents memory leaks.

### Deprecated Features

The following features are deprecated but still supported:

- Legacy configuration fields (`apiKey`, `model`, `baseUrl` at top level of Config)
- Individual parameters in `provider.chat()` (use options object instead)

These will be removed in a future major version.

### Upgrade Steps

1. Update dependencies:
   ```bash
   npm install @autohandai/agent-sdk@latest
   ```

2. Update error handling to use new error classes

3. Update custom tool implementations to use Zod validation

4. Test your application thoroughly

5. Review logs for any deprecation warnings

### Need Help?

If you encounter issues during migration:
- Check the [README](README.md) for usage examples
- Review the [API documentation](docs/API.md)
- Open an issue on GitHub

## Version 0.1.0

Initial release of the Autohand Code Agent SDK for TypeScript.
