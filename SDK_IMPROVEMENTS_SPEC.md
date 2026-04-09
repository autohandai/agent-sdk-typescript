# Autohand Code TypeScript SDK - Improvement Specification

**Document Version:** 1.0  
**Author:** Staff Engineer  
**Date:** April 9, 2026  
**Status:** Draft  

---

## Executive Summary

This specification outlines critical improvements required to make the Autohand Code TypeScript SDK production-ready. The current implementation demonstrates solid TypeScript fundamentals but lacks essential robustness features including timeout handling, retry logic, proper resource management, and comprehensive testing. This document provides a phased approach to address these gaps while maintaining backward compatibility where feasible.

**Key Metrics:**
- Current test coverage: ~60%
- Target test coverage: >80%
- Current type coverage: ~95%
- Target type coverage: 100%
- Current P95 latency: Unknown
- Target P95 latency: <2s for typical agent runs

---

## 1. Background

### 1.1 Current State

The Autohand Code TypeScript SDK provides a comprehensive agent framework with:
- 8 LLM provider implementations (OpenRouter, OpenAI, Azure, Zai, Ollama, LlamaCpp, MLX, LLMGateway)
- 30+ tool implementations for filesystem, git, web, notebook, dependencies, formatting, and linting
- Branded types and discriminated unions for type safety
- Runtime validation using Zod
- Tool registry pattern for extensible tool management

### 1.2 Problem Statement

While the SDK is functional, it lacks production-grade robustness:

1. **No timeout handling** - HTTP requests can hang indefinitely
2. **No retry logic** - Transient failures cause immediate errors
3. **Unsafe type assertions** - Runtime type errors possible if API responses change
4. **No resource cleanup** - Memory leaks in long-running processes
5. **Limited testing** - No integration tests, edge cases untested
6. **Code duplication** - Provider utilities duplicated across 8 implementations
7. **No observability** - No logging or metrics for debugging
8. **Broken documentation** - Examples use deprecated Tool enum

### 1.3 Success Criteria

- SDK handles network timeouts gracefully with configurable timeouts
- Transient failures (rate limits, temporary network issues) are retried with exponential backoff
- All type assertions replaced with runtime validation
- Sessions and connections are properly cleaned up
- Integration tests cover error scenarios and edge cases
- Code duplication eliminated through shared utilities
- Structured logging provides visibility into execution
- Documentation is accurate and examples compile

---

## 2. Requirements

### 2.1 Functional Requirements

#### FR-1: Timeout Handling
- All provider HTTP requests must support configurable timeouts
- Default timeout: 30 seconds
- Timeout must throw a specific `TimeoutError` with context
- Timeout configuration must be available via Provider interface

#### FR-2: Retry Logic
- Transient failures must be retried with exponential backoff
- Retry configuration: max retries (default 3), initial backoff (default 100ms), max backoff (default 10s)
- Retryable errors: 408 (timeout), 429 (rate limit), 500+ (server errors), network errors
- Non-retryable errors: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found)

#### FR-3: Runtime Type Validation
- All provider responses must be validated against Zod schemas before use
- Type assertions must be replaced with schema validation
- Validation errors must throw `ValidationError` with detailed context

#### FR-4: Resource Cleanup
- Sessions must have a cleanup mechanism
- HTTP connections must be properly closed
- Tool instances must be disposable
- Cleanup must be called on agent completion or error

#### FR-5: Error Handling Standardization
- All providers must use custom error classes
- Error classes must include: error code, message, context, cause
- Error codes must be programmatic for handling
- Error messages must not expose sensitive data

#### FR-6: Code Deduplication
- Shared provider utilities must be extracted
- Utilities: `buildMessagesArray`, `buildToolsArray`, `parseToolCalls`
- All providers must use shared implementations
- Provider-specific logic must remain in provider classes

#### FR-7: Observability
- Structured logging interface must be provided
- Log levels: debug, info, warn, error
- Log context: timestamps, correlation IDs, request IDs
- Metrics interface for performance monitoring

#### FR-8: Enhanced Validation
- Tool parameters must be validated using Zod schemas
- Validation must include: type checking, range validation, required fields
- Validation errors must be returned as `ToolResultError`

#### FR-9: Integration Testing
- Integration tests must cover error scenarios
- Tests must use mocked providers for reliability
- Edge cases: malformed responses, network failures, timeouts
- Concurrent operations must be tested

#### FR-10: Performance Optimization
- Message building must be optimized to avoid O(n²) operations
- Tool schemas must be cached
- Registry instantiation must be optimized
- Memory usage must be stable over time

#### FR-11: Documentation Accuracy
- README examples must compile
- All public APIs must have JSDoc
- Migration guide must be provided for breaking changes
- API reference must be complete

#### FR-12: Dependency Stability
- All dependencies must use stable versions
- Beta dependencies must be removed
- Security vulnerabilities must be addressed

### 2.2 Non-Functional Requirements

#### NFR-1: Performance
- P95 latency for typical agent runs: <2s
- Memory usage: <100MB for typical agent run
- CPU usage: <50% during typical agent run

#### NFR-2: Reliability
- Error rate for provider calls: <1%
- Retry success rate: >90% for transient failures
- Resource leak rate: 0%

#### NFR-3: Maintainability
- Code duplication: <5%
- Test coverage: >80%
- Type coverage: 100%
- Documentation coverage: >90%

#### NFR-4: Compatibility
- Node.js version: >=16.0.0
- TypeScript version: >=5.0.0
- Backward compatibility: Maintain where feasible

---

## 3. Design

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Runner                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Retry Logic  │  │ Timeout      │  │ Validation   │  │
│  │ Middleware   │  │ Handler      │  │ Middleware   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Provider Interface                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Provider 1  │    │  Provider 2  │    │  Provider N  │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Provider Utilities (Shared)                 │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Message Builder  │  │ Response Parser  │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Design

#### 3.2.1 Retry Middleware

```typescript
interface RetryOptions {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  retryableErrors: (error: Error) => boolean;
}

class RetryMiddleware {
  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    // Exponential backoff implementation
  }
}
```

#### 3.2.2 Timeout Handler

```typescript
interface TimeoutOptions {
  timeoutMs: number;
  onTimeout: () => Error;
}

class TimeoutHandler {
  static async execute<T>(
    fn: () => Promise<T>,
    options: TimeoutOptions
  ): Promise<T> {
    // AbortController implementation
  }
}
```

#### 3.2.3 Response Validation

```typescript
class ResponseValidator {
  static validate<T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): T {
    // Zod validation with detailed error context
  }
}
```

#### 3.2.4 Session Manager

```typescript
interface SessionManager {
  create(prompt: string): Session;
  get(sessionId: SessionId): Session | undefined;
  cleanup(sessionId: SessionId): Promise<void>;
  cleanupOldSessions(maxAge: number): Promise<void>;
}
```

#### 3.2.5 Logger Interface

```typescript
interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

class ConsoleLogger implements Logger {
  // Console-based implementation
}

class NoOpLogger implements Logger {
  // No-op implementation for production
}
```

#### 3.2.6 Provider Utilities

```typescript
class ProviderUtils {
  static buildMessagesArray(messages: Message[]): unknown[];
  static buildToolsArray(tools: ToolSchema[]): unknown[];
  static parseToolCalls(data: unknown): ToolCall[];
  static isRetryableError(error: Error): boolean;
}
```

### 3.3 Error Hierarchy

```typescript
abstract class SDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class TimeoutError extends SDKError {
  code = 'TIMEOUT';
}

class RetryExhaustedError extends SDKError {
  code = 'RETRY_EXHAUSTED';
}

class ValidationError extends SDKError {
  code = 'VALIDATION';
}

class ProviderError extends SDKError {
  code = 'PROVIDER_ERROR';
  constructor(
    message: string,
    public readonly providerName: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, 'PROVIDER_ERROR', context, cause);
  }
}
```

### 3.4 Provider Interface Updates

```typescript
interface ProviderOptions {
  timeout?: number;
  maxRetries?: number;
  logger?: Logger;
}

interface Provider {
  modelName(model: string): string;
  chat(
    messages: Message[],
    model: string,
    tools?: ToolSchema[],
    options?: ProviderOptions
  ): Promise<ChatResponse>;
}
```

---

## 4. Implementation Plan

### 4.1 Phase 1: Critical Infrastructure (Week 1)

**Goal:** Add foundational robustness features

#### Tasks:
1. Create error hierarchy in `src/errors/`
2. Implement timeout handler with AbortController
3. Implement retry middleware with exponential backoff
4. Create provider utilities module
5. Update Provider interface with options parameter
6. Add logger interface and console implementation
7. Update all providers to use new infrastructure

**Deliverables:**
- Error classes in `src/errors/index.ts`
- Timeout handler in `src/utils/timeout.ts`
- Retry middleware in `src/utils/retry.ts`
- Provider utilities in `src/providers/utils.ts`
- Logger in `src/utils/logger.ts`
- Updated provider implementations

**Acceptance Criteria:**
- All providers support configurable timeouts
- All providers retry transient failures
- Error handling is consistent across providers
- Logging is available throughout

### 4.2 Phase 2: Type Safety & Validation (Week 2)

**Goal:** Eliminate unsafe type assertions

#### Tasks:
1. Create Zod schemas for all provider responses
2. Replace type assertions with schema validation
3. Add response validation to all providers
4. Enhance tool parameter validation with Zod
5. Add validation middleware

**Deliverables:**
- Response schemas in `src/providers/schemas.ts`
- Updated provider parseResponse methods
- Enhanced tool validation in `tools/base.ts`

**Acceptance Criteria:**
- Zero unsafe type assertions in providers
- All responses validated before use
- Tool parameters validated with Zod

### 4.3 Phase 3: Resource Management (Week 2)

**Goal:** Prevent memory leaks

#### Tasks:
1. Create Disposable interface
2. Implement SessionManager
3. Add cleanup to Runner
4. Add dispose pattern to tools
5. Implement connection pooling for HTTP

**Deliverables:**
- Disposable interface in `src/types/disposable.ts`
- SessionManager in `src/session/manager.ts`
- Updated Runner with cleanup
- Dispose pattern in tools

**Acceptance Criteria:**
- Sessions are cleaned up after completion
- No memory leaks in long-running processes
- Connections are properly closed

### 4.4 Phase 4: Code Deduplication (Week 3)

**Goal:** Eliminate duplicate code

#### Tasks:
1. Extract shared provider utilities
2. Update all providers to use utilities
3. Add tool schema caching
4. Optimize message building in Runner

**Deliverables:**
- Provider utilities in `src/providers/utils.ts`
- Updated provider implementations
- Schema cache in `tools/registry.ts`
- Optimized Runner

**Acceptance Criteria:**
- Code duplication <5%
- Tool schemas cached
- Message building optimized

### 4.5 Phase 5: Testing (Week 3)

**Goal:** Comprehensive test coverage

#### Tasks:
1. Create integration test framework
2. Add provider integration tests with mocks
3. Add error scenario tests
4. Add edge case tests
5. Add concurrent operation tests

**Deliverables:**
- Integration test suite in `src/__tests__/integration/`
- Mock provider implementations
- Test utilities

**Acceptance Criteria:**
- Test coverage >80%
- All error scenarios tested
- Edge cases covered

### 4.6 Phase 6: Documentation (Week 3)

**Goal:** Accurate, comprehensive documentation

#### Tasks:
1. Update README.md with correct examples
2. Add JSDoc to all public APIs
3. Create migration guide
4. Add API reference documentation
5. Update package.json dependencies

**Deliverables:**
- Updated README.md
- JSDoc on all exports
- Migration guide in `docs/MIGRATION.md`
- API reference in `docs/API.md`
- Updated package.json

**Acceptance Criteria:**
- All examples compile
- All public APIs documented
- Migration guide complete

---

## 5. Risk Assessment

### 5.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking changes to Provider interface | Medium | High | Maintain backward compatibility with optional parameters |
| Performance regression from validation | Low | Medium | Benchmark before/after, optimize validation |
| Test flakiness from network tests | Medium | Medium | Use mocks for integration tests |
| Dependency conflicts | Low | Medium | Test in isolated environment |

### 5.2 Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Phase overrun | Medium | Medium | Prioritize critical path, defer nice-to-haves |
| Resource constraints | Low | Medium | Adjust scope, focus on P0/P1 items |

---

## 6. Success Metrics

### 6.1 Quality Metrics

- Test coverage: >80% (current: ~60%)
- Type coverage: 100% (current: ~95%)
- Code duplication: <5% (current: ~15%)
- Documentation coverage: >90% (current: ~40%)

### 6.2 Performance Metrics

- P95 latency: <2s for typical agent runs
- Memory usage: <100MB for typical agent run
- CPU usage: <50% during typical agent run
- Error rate: <1% for provider calls

### 6.3 Reliability Metrics

- Retry success rate: >90% for transient failures
- Resource leak rate: 0%
- Timeout handling: 100% of requests have timeout

---

## 7. Migration Guide

### 7.1 Breaking Changes

#### Provider Interface
```typescript
// Before
provider.chat(messages, model, tools, maxTokens, temperature);

// After (backward compatible)
provider.chat(messages, model, tools, {
  maxTokens,
  temperature,
  timeout: 30000,
  maxRetries: 3,
  logger: consoleLogger
});
```

#### Error Handling
```typescript
// Before
try {
  await provider.chat(...);
} catch (error) {
  // Generic Error
}

// After
try {
  await provider.chat(...);
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout
  } else if (error instanceof RetryExhaustedError) {
    // Handle retry exhaustion
  }
}
```

### 7.2 New Features

```typescript
// Logging
const logger = new ConsoleLogger();
agent.setLogger(logger);

// Custom timeout
provider.chat(messages, model, tools, { timeout: 60000 });

// Retry configuration
provider.chat(messages, model, tools, { 
  maxRetries: 5,
  initialBackoffMs: 200 
});

// Session cleanup
await runner.cleanupSession(sessionId);
```

---

## 8. Appendix

### 8.1 Glossary

- **Branded Type**: TypeScript type with a nominal brand for type safety
- **Discriminated Union**: TypeScript pattern for type-safe variant handling
- **Exponential Backoff**: Retry strategy with increasing delays
- **Integration Test**: Test that verifies components work together
- **Unit Test**: Test that verifies individual components in isolation

### 8.2 References

- TypeScript Best Practices: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html
- Zod Documentation: https://zod.dev/
- Node.js Fetch API: https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch
- Retry Strategies: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/

### 8.3 Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-09 | Initial specification |
