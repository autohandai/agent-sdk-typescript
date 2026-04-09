/**
 * 25 API Testing - Automated API testing and validation.
 *
 * A real-world example of an agent that performs comprehensive API testing:
 * - Generates test cases from API documentation
 * - Executes HTTP requests and validates responses
 * - Creates test reports and coverage analysis
 * - Identifies edge cases and error conditions
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/25-api-testing
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Agent, Runner, SDKError } from "@autohandai/agent-sdk";
import { OpenRouterProvider } from "@autohandai/agent-sdk";

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const apiKey = process.env.AUTOHAND_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error(
      "AUTOHAND_API_KEY environment variable is required. " +
      "Please set it with: export AUTOHAND_API_KEY=your-api-key"
    );
  }
}

/**
 * Create a sample API project with documentation
 */
function createApiProject(tmpdir: string): void {

  // API implementation (simplified Express-like API)
  fs.writeFileSync(
    path.join(tmpdir, "app.ts"),
    `import express from 'express';

const app = express();
app.use(express.json());

// Simple in-memory storage
const usersDb: Record<string, any> = {};
let nextId = 1;

app.get('/api/users', (req, res) => {
  /** Get all users with optional filtering. */
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const users = Object.values(usersDb).slice(offset, offset + limit);
  res.json({
    users,
    total: Object.keys(usersDb).length,
    limit,
    offset
  });
});

app.get('/api/users/:id', (req, res) => {
  /** Get a specific user by ID. */
  const userId = req.params.id;
  if (!(userId in usersDb)) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(usersDb[userId]);
});

app.post('/api/users', (req, res) => {
  /** Create a new user. */
  const data = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  // Validate required fields
  const requiredFields = ['name', 'email'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      return res.status(400).json({ error: \`Missing required field: \${field}\` });
    }
  }
  
  // Basic email validation
  const email = data.email;
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  const userId = String(nextId);
  const user = {
    id: nextId,
    name: data.name,
    email,
    age: data.age,
    created_at: '2024-01-01T00:00:00Z'
  };
  
  usersDb[userId] = user;
  nextId += 1;
  
  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  /** Update an existing user. */
  const userId = req.params.id;
  if (!(userId in usersDb)) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const data = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  const user = usersDb[userId];
  
  // Update fields
  if ('name' in data) {
    user.name = data.name;
  }
  if ('email' in data) {
    const email = data.email;
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    user.email = email;
  }
  if ('age' in data) {
    user.age = data.age;
  }
  
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  /** Delete a user. */
  const userId = req.params.id;
  if (!(userId in usersDb)) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  delete usersDb[userId];
  res.json({ message: 'User deleted successfully' });
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
`
  );

  // API documentation
  fs.writeFileSync(
    path.join(tmpdir, "API_DOCS.md"),
    `# User Management API Documentation

## Base URL
\`http://localhost:3000\`

## Endpoints

### GET /api/users
Get all users with pagination.

**Query Parameters:**
- \`limit\` (number, optional): Number of users to return (default: 10)
- \`offset\` (number, optional): Number of users to skip (default: 0)

**Response:**
\`\`\`json
{
  "users": [...],
  "total": 100,
  "limit": 10,
  "offset": 0
}
\`\`\`

### GET /api/users/{id}
Get a specific user by ID.

**Path Parameters:**
- \`id\` (number): User ID

**Response:**
\`\`\`json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "created_at": "2024-01-01T00:00:00Z"
}
\`\`\`

### POST /api/users
Create a new user.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
\`\`\`

**Required Fields:** name, email

### PUT /api/users/{id}
Update an existing user.

**Request Body:**
\`\`\`json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 25
}
\`\`\`

### DELETE /api/users/{id}
Delete a user.

**Response:**
\`\`\`json
{
  "message": "User deleted successfully"
}
\`\`\`

## Error Responses
- 400: Bad Request (invalid input)
- 404: Not Found (user doesn't exist)
- 500: Internal Server Error
`
  );

  // Test configuration
  fs.writeFileSync(
    path.join(tmpdir, "test_config.json"),
    JSON.stringify(
      {
        base_url: "http://localhost:3000",
        timeout: 10,
        test_data: {
          valid_user: {
            name: "Test User",
            email: "test@example.com",
            age: 25,
          },
          invalid_user: {
            name: "Invalid User",
            email: "invalid-email",
          },
        },
      },
      null,
      2
    )
  );
}

/**
 * Main function that demonstrates API testing
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "api-testing-"));

  try {
    validateEnvironment();

    // Create API project
    createApiProject(tmpdir);
    console.log(`Created API project in: ${tmpdir}`);

    // API testing agent
    const apiTester = new Agent(
      "API Testing Specialist",
      `You are an API testing expert. Your task:

1. Analyze the API documentation and implementation:
   - Read the API docs to understand all endpoints and parameters
   - Examine the Express app code to understand the actual implementation
   - Identify validation rules, error conditions, and edge cases

2. Generate comprehensive test cases:
   - Happy path tests for each endpoint
   - Error condition tests (invalid inputs, missing fields)
   - Edge case tests (boundary values, empty data)
   - Integration tests (create -> read -> update -> delete workflow)

3. Create test scripts that:
   - Use curl or fetch to make HTTP calls
   - Validate response status codes and content
   - Check for proper error handling
   - Test API contracts thoroughly

4. Generate test reports:
   - Test coverage analysis
   - Pass/fail results
   - Performance metrics (response times)
   - Bug findings and recommendations

Use read_file to examine code and docs, write_file to create test scripts,
and bash to execute tests. Focus on practical, comprehensive testing.`,
      ["read_file", "write_file", "edit_file", "bash", "web_search"],
      30
    );

    apiTester.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Run API testing
    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const result = await Runner.run(
        apiTester,
        `Perform comprehensive API testing for this Express application:

1. First, read and analyze the API documentation (API_DOCS.md) and implementation (app.ts)
2. Create a comprehensive test suite that covers:
   - All endpoints with valid inputs (happy path)
   - Error conditions (invalid emails, missing fields, bad IDs)
   - Edge cases (empty requests, large data, special characters)
   - Full CRUD workflow testing
3. Generate test scripts using curl or fetch
4. Execute the tests and create a detailed test report
5. Identify any bugs, missing validations, or improvements needed

Focus on thorough testing that would catch real-world API issues.
Note: Since we can't actually run the Express server, create test scripts that would work
if the server were running and document what each test validates.`
      );
      console.log("\n" + "=".repeat(60));
      console.log("API TESTING RESULTS");
      console.log("=".repeat(60));
      console.log(result.finalOutput);

      // Show created test files
      console.log("\n" + "=".repeat(60));
      console.log("TEST FILES CREATED");
      console.log("=".repeat(60));
      const files = fs.readdirSync(tmpdir);
      for (const file of files) {
        if (file.includes("test")) {
          console.log(`  ${file}`);
        }
      }
    } finally {
      process.chdir(oldCwd);
    }
  } catch (error) {
    if (error instanceof SDKError) {
      console.error(`SDK Error: ${error.message}`);
      if (error.context) {
        console.error(`Context: ${JSON.stringify(error.context)}`);
      }
    } else {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  } finally {
    // Cleanup
    fs.rmSync(tmpdir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
