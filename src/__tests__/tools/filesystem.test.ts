/**
 * Unit tests for filesystem tools
 */

import { ReadFileTool, WriteFileTool, EditFileTool } from "../../index";
import * as fs from "fs/promises";
import * as path from "path";
import { mkdtemp, rmdir } from "fs/promises";
import { tmpdir } from "os";

describe("ReadFileTool", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "test_read_"));
  });

  afterEach(async () => {
    await rmdir(tempDir);
  });

  test("has correct name", () => {
    const tool = new ReadFileTool();
    expect(tool.getName()).toBe("read_file");
  });

  test("has description", () => {
    const tool = new ReadFileTool();
    expect(tool.getDescription()).toBe("Read the contents of a file.");
  });

  test("has parameters", () => {
    const tool = new ReadFileTool();
    const params = tool.getParameters();
    expect(params).toHaveProperty("type", "object");
    expect(params).toHaveProperty("properties");
    expect(params).toHaveProperty("required");
  });

  test("reads file successfully", async () => {
    const tool = new ReadFileTool();
    const testFile = path.join(tempDir, "test.txt");
    await fs.writeFile(testFile, "Test content", "utf-8");

    const result = await tool.execute({
      file_path: "test.txt",
      work_dir: tempDir,
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toBe("Test content");
  });

  test("returns error for nonexistent file", async () => {
    const tool = new ReadFileTool();
    const result = await tool.execute({
      file_path: "nonexistent.txt",
      work_dir: tempDir,
    });

    expect(result.error).toBeDefined();
    expect(result.error).toContain("Cannot read file");
  });
});

describe("WriteFileTool", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "test_write_"));
  });

  afterEach(async () => {
    await rmdir(tempDir, { recursive: true });
  });

  test("has correct name", () => {
    const tool = new WriteFileTool();
    expect(tool.getName()).toBe("write_file");
  });

  test("has description", () => {
    const tool = new WriteFileTool();
    expect(tool.getDescription()).toBe("Write content to a file.");
  });

  test("writes file successfully", async () => {
    const tool = new WriteFileTool();
    const result = await tool.execute({
      file_path: "test.txt",
      content: "Test write content",
      work_dir: tempDir,
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toContain("Wrote");

    const testFile = path.join(tempDir, "test.txt");
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("Test write content");
  });

  test("creates parent directories", async () => {
    const tool = new WriteFileTool();
    const result = await tool.execute({
      file_path: path.join("subdir", "test.txt"),
      content: "Test content",
      work_dir: tempDir,
    });

    expect(result.error).toBeUndefined();

    const testFile = path.join(tempDir, "subdir", "test.txt");
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("Test content");
  });
});

describe("EditFileTool", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "test_edit_"));
  });

  afterEach(async () => {
    await rmdir(tempDir, { recursive: true });
  });

  test("has correct name", () => {
    const tool = new EditFileTool();
    expect(tool.getName()).toBe("edit_file");
  });

  test("has description", () => {
    const tool = new EditFileTool();
    expect(tool.getDescription()).toBe("Apply a find-and-replace edit to a file.");
  });

  test("edits file successfully", async () => {
    const tool = new EditFileTool();
    const testFile = path.join(tempDir, "test.txt");
    await fs.writeFile(testFile, "Hello World", "utf-8");

    const result = await tool.execute({
      file_path: "test.txt",
      old_string: "World",
      new_string: "TypeScript",
      work_dir: tempDir,
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toContain("Edited");

    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("Hello TypeScript");
  });

  test("returns error if old string not found", async () => {
    const tool = new EditFileTool();
    const testFile = path.join(tempDir, "test.txt");
    await fs.writeFile(testFile, "Hello World", "utf-8");

    const result = await tool.execute({
      file_path: "test.txt",
      old_string: "NotFound",
      new_string: "Replacement",
      work_dir: tempDir,
    });

    expect(result.error).toBe("Old string not found in file");
  });
});
