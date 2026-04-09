# Environment Variables

This document describes the environment variables used by the Autohand Code Agent SDK for TypeScript.

## Building the Library

### Required for Building

No environment variables are strictly required for building the library. The build process uses standard npm and TypeScript tooling:

```bash
npm install
npm run build
```

### Required for Testing

When running tests that use actual providers, you may need to set provider-specific environment variables (see [Provider Configuration](#provider-configuration) below).

## Publishing to npm

### Required for Publishing

To publish the package to npm, you need to set the following environment variable:

#### `NPM_TOKEN`

The npm authentication token with publish permissions for the `@autohandai/agent-sdk` package.

**How to get it:**
1. Go to [npmjs.com](https://www.npmjs.com/)
2. Log in to your account
3. Go to Account → Access Tokens
4. Create a new token with "Automation" or "Publish" permissions
6. Copy the token

**How to set it:**

**In GitHub Secrets (for CI/CD):**
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Your npm authentication token
6. Click "Add secret"

**Locally:**
```bash
export NPM_TOKEN=your_npm_token_here
npm publish
```

## Provider Configuration

When using the SDK with different LLM providers, you can configure them via environment variables:

### Common Provider Variables

#### `AUTOHAND_PROVIDER`

The provider to use. Options: `openrouter`, `ollama`, `openai`, `llamacpp`, `mlx`, `llmgateway`, `azure`, `zai`

**Default:** `openrouter`

```bash
export AUTOHAND_PROVIDER=openai
```

#### `AUTOHAND_API_KEY`

The API key for the selected provider.

```bash
export AUTOHAND_API_KEY=your_api_key_here
```

#### `AUTOHAND_MODEL`

The model name to use.

```bash
export AUTOHAND_MODEL=gpt-4
```

#### `AUTOHAND_BASE_URL`

Custom base URL for the provider API (optional).

```bash
export AUTOHAND_BASE_URL=https://api.example.com
```

### Provider-Specific Variables

#### OpenRouter

```bash
export AUTOHAND_PROVIDER=openrouter
export AUTOHAND_API_KEY=your_openrouter_key
export AUTOHAND_MODEL=z-ai/glm-5.1
```

#### OpenAI

```bash
export AUTOHAND_PROVIDER=openai
export AUTOHAND_API_KEY=sk-...
export AUTOHAND_MODEL=gpt-4
```

#### Azure OpenAI

```bash
export AUTOHAND_PROVIDER=azure
export AUTOHAND_API_KEY=your_azure_key
export AUTOHAND_AZURE_RESOURCE_NAME=your-resource-name
export AUTOHAND_AZURE_DEPLOYMENT_NAME=your-deployment-name
export AUTOHAND_MODEL=gpt-4
```

#### Ollama

```bash
export AUTOHAND_PROVIDER=ollama
export AUTOHAND_OLLAMA_BASE_URL=http://localhost:11434
export AUTOHAND_MODEL=llama2
```

#### Llama.cpp

```bash
export AUTOHAND_PROVIDER=llamacpp
export AUTOHAND_LLAMACPP_BASE_URL=http://localhost:8080
export AUTOHAND_MODEL=llama-3-8b-instruct
```

#### MLX

```bash
export AUTOHAND_PROVIDER=mlx
export AUTOHAND_MLX_BASE_URL=http://localhost:8080
export AUTOHAND_MODEL=mlx-lm
```

#### LLM Gateway

```bash
export AUTOHAND_PROVIDER=llmgateway
export AUTOHAND_API_KEY=your_gateway_key
export AUTOHAND_MODEL=llama-3.1-8b
```

#### Z-AI

```bash
export AUTOHAND_PROVIDER=zai
export AUTOHAND_API_KEY=your_zai_key
export AUTOHAND_MODEL=glm-5.1
```

## Development Environment Variables

### Optional Development Variables

#### `NODE_ENV`

Set to `development` or `production` to control build behavior.

```bash
export NODE_ENV=development
```

#### `DEBUG`

Enable debug logging in the SDK.

```bash
export DEBUG=autohand:*
```

## CI/CD Environment Variables

### GitHub Actions

The publish workflow (`.github/workflows/publish.yml`) uses the following:

- `NPM_TOKEN` (from GitHub Secrets): Required for publishing to npm
- `GITHUB_TOKEN` (provided automatically): Required for creating GitHub releases

### Local Development

For local development and testing, you can use a `.env` file:

```bash
# Provider configuration
AUTOHAND_PROVIDER=openai
AUTOHAND_API_KEY=your_api_key_here
AUTOHAND_MODEL=gpt-4

# Development
NODE_ENV=development
DEBUG=autohand:*
```

**Important:** Make sure `.env` is in your `.gitignore` file to prevent committing sensitive data.

## Security Best Practices

1. **Never commit API keys or tokens** to version control
2. **Use environment-specific secrets** for different environments (dev, staging, prod)
3. **Rotate tokens regularly** for better security
4. **Use scoped tokens** with minimal required permissions
5. **Audit token usage** regularly in npm and GitHub

## Troubleshooting

### Publishing Issues

**Error: "401 Unauthorized"**
- Check that `NPM_TOKEN` is set correctly
- Verify the token has publish permissions for the `@autohandai` scope

**Error: "403 Forbidden"**
- Ensure you have publish rights for the `@autohandai/agent-sdk` package
- Check that the package name in `package.json` matches the scope

### Provider Connection Issues

**Error: "Provider not configured"**
- Ensure `AUTOHAND_PROVIDER` is set
- Verify `AUTOHAND_API_KEY` is set for the selected provider

**Error: "Network timeout"**
- Check your network connection
- Increase timeout in provider options if needed

## See Also

- [README](../README.md) - Getting started guide
- [Migration Guide](../MIGRATION.md) - Migration guide for breaking changes
- [API Reference](API.md) - Complete API documentation
