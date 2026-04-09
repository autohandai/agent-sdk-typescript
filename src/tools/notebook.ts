/**
 * Jupyter notebook operations.
 */

import { ToolDefinition } from "./base";
import { Tool, ToolResult } from "../types";
import * as fs from "fs/promises";
import * as path from "path";

export class NotebookReadTool extends ToolDefinition {
  getName(): string {
    return "notebook_read";
  }

  getDescription(): string {
    return "Read a Jupyter notebook file.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the notebook file",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["file_path"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const filePath = params.file_path as string;

    const fullPath = path.resolve(workDir, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const notebook = JSON.parse(content);
      
      // Format notebook cells for display
      let output = "";
      for (const cell of notebook.cells || []) {
        output += `Cell Type: ${cell.cell_type}\n`;
        if (cell.source) {
          output += `Source: ${Array.isArray(cell.source) ? cell.source.join("") : cell.source}\n`;
        }
        if (cell.outputs) {
          output += `Outputs: ${JSON.stringify(cell.outputs)}\n`;
        }
        output += "---\n";
      }
      
      return { data: output };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot read notebook: ${error.message}` : "Cannot read notebook",
      };
    }
  }
}

export class NotebookEditTool extends ToolDefinition {
  getName(): string {
    return "notebook_edit";
  }

  getDescription(): string {
    return "Edit a cell in a Jupyter notebook.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the notebook file",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
        cell_index: {
          type: "number",
          description: "Index of the cell to edit",
        },
        new_source: {
          type: "string",
          description: "New source content for the cell",
        },
      },
      required: ["file_path", "cell_index", "new_source"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const filePath = params.file_path as string;
    const cellIndex = params.cell_index as number;
    const newSource = params.new_source as string;

    const fullPath = path.resolve(workDir, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const notebook = JSON.parse(content);
      
      if (!notebook.cells || !notebook.cells[cellIndex]) {
        return { error: `Cell index ${cellIndex} not found in notebook` };
      }
      
      notebook.cells[cellIndex].source = newSource;
      
      await fs.writeFile(fullPath, JSON.stringify(notebook, null, 2), "utf-8");
      return { data: `Edited cell ${cellIndex} in ${fullPath}` };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot edit notebook: ${error.message}` : "Cannot edit notebook",
      };
    }
  }
}
