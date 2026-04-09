/**
 * 24 Documentation Maintenance - Keep docs in sync with code.
 *
 * A real-world example of an agent that maintains documentation by:
 * - Scanning code for API changes
 * - Updating README files with new features
 * - Generating API documentation from docstrings
 * - Checking for outdated examples
 * - Creating changelogs
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/24-documentation-maintenance
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
 * Create a sample project with code and documentation
 */
function createSampleProject(tmpdir: string): void {

  // Main module with various functions and classes
  fs.writeFileSync(
    path.join(tmpdir, "data-processor.ts"),
    `import * as fs from "fs";
import type { DataRecord, ProcessingStats } from "./types";

export class DataProcessor {
  /** Processes data records with various transformations. */

  private processedCount = 0;

  constructor(private batchSize: number = 100) {}

  processRecords(records: DataRecord[]): DataRecord[] {
    /** Process a batch of data records.
    
    Args:
      records: List of DataRecord objects to process
      
    Returns:
      List of processed DataRecord objects
    */
    const processed: DataRecord[] = [];
    for (const record of records) {
      // Apply some transformation
      const processedRecord: DataRecord = {
        ...record,
        value: record.value * 1.1, // 10% increase
      };
      processed.push(processedRecord);
      this.processedCount += 1;
    }
    
    return processed;
  }

  exportToJson(records: DataRecord[], filepath: string): void {
    /** Export records to JSON file.
    
    Args:
      records: List of DataRecord objects to export
      filepath: Path to output JSON file
    */
    const data = records.map(record => ({
      id: record.id,
      value: record.value,
      timestamp: record.timestamp,
      metadata: record.metadata,
    }));
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  getStats(): ProcessingStats {
    /** Get processing statistics.
    
    Returns:
      Dictionary with processing stats
    */
    return {
      processedCount: this.processedCount,
      batchSize: this.batchSize,
    };
  }
}

export function loadDataFromFile(filepath: string): DataRecord[] {
  /** Load data records from JSON file.
  
  Args:
    filepath: Path to input JSON file
    
  Returns:
    List of DataRecord objects
    
  Raises:
    Error: If file doesn't exist or contains invalid JSON
  */
  const content = fs.readFileSync(filepath, 'utf-8');
  const data = JSON.parse(content);
  
  return data as DataRecord[];
}
`
  );

  // Types file
  fs.writeFileSync(
    path.join(tmpdir, "types.ts"),
    `export interface DataRecord {
  id: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ProcessingStats {
  processedCount: number;
  batchSize: number;
}
`
  );

  // Outdated README
  fs.writeFileSync(
    path.join(tmpdir, "README.md"),
    `# Data Processor

A simple data processing library.

## Installation

\`\`\`bash
npm install data-processor
\`\`\`

## Usage

\`\`\`typescript
import { DataProcessor } from "./data-processor";

const processor = new DataProcessor();
// Process some data
\`\`\`

## Features

- Process data
- Export to JSON

That's it!
`
  );

  // API docs that need updating
  fs.writeFileSync(
    path.join(tmpdir, "API.md"),
    `# API Documentation

## DataProcessor

### Methods

- \`processRecords()\`: Process records
- \`exportToJson()\`: Export to JSON

## Functions

- \`loadDataFromFile()\`: Load data from file
`
  );

  // Old changelog
  fs.writeFileSync(
    path.join(tmpdir, "CHANGELOG.md"),
    `# Changelog

## v0.1.0
- Initial release
`
  );
}

/**
 * Main function that demonstrates documentation maintenance
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-maintenance-"));

  try {
    validateEnvironment();

    // Create sample project
    createSampleProject(tmpdir);
    console.log(`Created sample project in: ${tmpdir}`);

    // Documentation maintenance agent
    const docMaintainer = new Agent(
      "Documentation Maintainer",
      `You are a documentation maintenance expert. Your task:

1. Analyze the codebase to understand current APIs and features:
   - Read all TypeScript files to extract classes, functions, and their docstrings
   - Identify public APIs vs internal implementation
   - Note any parameters, return types, and exceptions

2. Update documentation to match current code:
   - Enhance README.md with proper installation, usage examples, and feature list
   - Expand API.md with complete method signatures, parameters, and examples
   - Add type hints information where relevant

3. Create comprehensive examples:
   - Add practical usage examples in README
   - Include error handling examples
   - Show common workflows

4. Update CHANGELOG.md:
   - Add recent changes based on current code state
   - Include version information and feature highlights

5. Check for consistency:
   - Ensure all documented features actually exist in code
   - Verify examples are syntactically correct
   - Check that parameter names match between docs and code

Use read_file to examine files, write_file to create updated versions,
and edit_file to make targeted improvements. Be thorough and practical.`,
      ["read_file", "write_file", "edit_file", "glob", "search_in_files"],
      25
    );

    docMaintainer.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Run documentation maintenance
    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const result = await Runner.run(
        docMaintainer,
        `Maintain and update this project's documentation:

1. First, glob for all TypeScript files and read them to understand the current API
2. Read all existing documentation files (README.md, API.md, CHANGELOG.md)
3. Update the documentation to accurately reflect the current code state:
   - Enhance README with proper installation, usage, and features
   - Expand API documentation with complete method signatures and examples
   - Update CHANGELOG with current version information
4. Ensure all examples are syntactically correct and actually work
5. Make sure documentation is comprehensive and user-friendly

Focus on making the documentation valuable for users who want to use this library.`
      );
      console.log("\n" + "=".repeat(60));
      console.log("DOCUMENTATION MAINTENANCE RESULTS");
      console.log("=".repeat(60));
      console.log(result.finalOutput);

      // Show updated files
      console.log("\n" + "=".repeat(60));
      console.log("UPDATED DOCUMENTATION FILES");
      console.log("=".repeat(60));
      const files = fs.readdirSync(tmpdir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          console.log(`\n--- ${file} ---`);
          const content = fs.readFileSync(path.join(tmpdir, file), "utf-8");
          console.log(content.length > 500 ? content.substring(0, 500) + "..." : content);
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
