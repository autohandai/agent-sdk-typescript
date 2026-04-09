/**
 * 26 Database Migration - Automated database schema migration.
 *
 * A real-world example of an agent that handles database migrations:
 * - Analyzes existing database schema
 * - Generates migration scripts for schema changes
 * - Validates migration safety and rollback procedures
 * - Creates documentation for database changes
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/26-database-migration
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
 * Create a sample database project with schema and migrations
 */
function createDatabaseProject(tmpdir: string): void {

  // Current database schema
  fs.writeFileSync(
    path.join(tmpdir, "schema.sql"),
    `-- Current database schema
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_comments_post_id ON comments(post_id);
`
  );

  // Desired new schema
  fs.writeFileSync(
    path.join(tmpdir, "new_schema.sql"),
    `-- New database schema with improvements
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    content TEXT,
    excerpt VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft',
    featured_image VARCHAR(255),
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES comments(id)
);

-- New table: categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: post_categories (many-to-many)
CREATE TABLE post_categories (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
`
  );

  // Create migrations directory
  fs.mkdirSync(path.join(tmpdir, "migrations"));

  // Existing migrations
  fs.writeFileSync(
    path.join(tmpdir, "migrations", "001_initial_schema.sql"),
    `-- Initial schema migration
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`
  );

  // Migration configuration
  fs.writeFileSync(
    path.join(tmpdir, "migration_config.json"),
    JSON.stringify(
      {
        database: {
          type: "sqlite",
          connection_string: "sqlite:///app.db",
        },
        migration_settings: {
          backup_before_migration: true,
          validate_foreign_keys: true,
          dry_run_mode: false,
          rollback_enabled: true,
        },
        data_migration: {
          preserve_user_data: true,
          migrate_post_slugs: true,
          set_default_categories: true,
        },
      },
      null,
      2
    )
  );
}

/**
 * Main function that demonstrates database migration
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-example-"));

  try {
    validateEnvironment();

    // Create database project
    createDatabaseProject(tmpdir);
    console.log(`Created database project in: ${tmpdir}`);

    // Database migration agent
    const migrationAgent = new Agent(
      "Database Migration Specialist",
      `You are a database migration expert. Your task:

1. Analyze current and target schemas:
   - Compare schema.sql (current) with new_schema.sql (target)
   - Identify all changes: new columns, new tables, removed columns, constraints
   - Determine migration complexity and potential risks

2. Generate safe migration scripts:
   - Create forward migration SQL that transforms current schema to target
   - Include data migration for existing records
   - Add proper constraints and indexes
   - Handle default values for new columns

3. Create rollback migration:
   - Generate reverse migration to undo changes
   - Ensure data can be safely rolled back
   - Document rollback procedures

4. Migration safety checks:
   - Identify potential data loss scenarios
   - Check for foreign key constraint issues
   - Validate that migrations are reversible
   - Document any manual steps required

5. Create migration documentation:
   - Migration overview and purpose
   - Step-by-step migration process
   - Risk assessment and mitigation
   - Testing procedures

Use read_file to examine schemas, write_file to create migration scripts,
and edit_file to make adjustments. Focus on safe, reversible migrations.`,
      ["read_file", "write_file", "edit_file", "glob", "bash"],
      25
    );

    migrationAgent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Run migration generation
    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const result = await Runner.run(
        migrationAgent,
        `Generate a comprehensive database migration from current to new schema:

1. First, read and compare schema.sql (current) with new_schema.sql (target)
2. Create a new migration file (002_add_features.sql) that:
   - Adds new columns to existing tables (first_name, last_name, etc. to users)
   - Creates new tables (categories, post_categories)
   - Adds new columns to posts and comments tables
   - Includes proper data migration for existing records
   - Adds necessary indexes and constraints
3. Create a rollback migration (002_add_features_rollback.sql)
4. Generate MIGRATION_PLAN.md with:
   - Detailed overview of all changes
   - Step-by-step migration process
   - Risk assessment and safety measures
   - Testing procedures
   - Rollback instructions
5. Validate that migrations are safe and reversible

Focus on production-ready, safe migrations with minimal downtime.`
      );
      console.log("\n" + "=".repeat(60));
      console.log("DATABASE MIGRATION RESULTS");
      console.log("=".repeat(60));
      console.log(result.finalOutput);

      // Show created migration files
      console.log("\n" + "=".repeat(60));
      console.log("MIGRATION FILES CREATED");
      console.log("=".repeat(60));
      const files = fs.readdirSync(tmpdir);
      for (const file of files) {
        if (file.endsWith(".sql") || file.endsWith(".md")) {
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
