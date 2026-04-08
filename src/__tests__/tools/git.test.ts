/**
 * Tests for git tools.
 */

import {
  GitStatusTool,
  GitDiffTool,
  GitLogTool,
  GitCommitTool,
  GitAddTool,
  GitResetTool,
  GitPushTool,
  GitPullTool,
  GitFetchTool,
  GitCheckoutTool,
  GitBranchTool,
  GitMergeTool,
  GitRebaseTool,
  GitStashTool,
} from "../../tools/git";
import { Tool } from "../../types";

describe("Git Tools", () => {
  describe("GitStatusTool", () => {
    it("should have correct name", () => {
      const tool = new GitStatusTool();
      expect(tool.getName()).toBe(Tool.GIT_STATUS);
    });

    it("should have description", () => {
      const tool = new GitStatusTool();
      expect(tool.getDescription()).toBe("Show the working tree status.");
    });

    it("should have parameters schema", () => {
      const tool = new GitStatusTool();
      const params = tool.getParameters();
      expect(params).toHaveProperty("type", "object");
      expect(params).toHaveProperty("properties");
    });
  });

  describe("GitDiffTool", () => {
    it("should have correct name", () => {
      const tool = new GitDiffTool();
      expect(tool.getName()).toBe(Tool.GIT_DIFF);
    });

    it("should have description", () => {
      const tool = new GitDiffTool();
      expect(tool.getDescription()).toBe("Show changes between commits, commit and working tree, etc.");
    });
  });

  describe("GitLogTool", () => {
    it("should have correct name", () => {
      const tool = new GitLogTool();
      expect(tool.getName()).toBe(Tool.GIT_LOG);
    });

    it("should have description", () => {
      const tool = new GitLogTool();
      expect(tool.getDescription()).toBe("Show commit logs.");
    });
  });

  describe("GitCommitTool", () => {
    it("should have correct name", () => {
      const tool = new GitCommitTool();
      expect(tool.getName()).toBe(Tool.GIT_COMMIT);
    });

    it("should have description", () => {
      const tool = new GitCommitTool();
      expect(tool.getDescription()).toBe("Record changes to the repository.");
    });

    it("should require message parameter", () => {
      const tool = new GitCommitTool();
      const params = tool.getParameters();
      expect(params.required).toContain("message");
    });
  });

  describe("GitAddTool", () => {
    it("should have correct name", () => {
      const tool = new GitAddTool();
      expect(tool.getName()).toBe(Tool.GIT_ADD);
    });

    it("should have description", () => {
      const tool = new GitAddTool();
      expect(tool.getDescription()).toBe("Add file contents to the index.");
    });
  });

  describe("GitResetTool", () => {
    it("should have correct name", () => {
      const tool = new GitResetTool();
      expect(tool.getName()).toBe(Tool.GIT_RESET);
    });

    it("should have description", () => {
      const tool = new GitResetTool();
      expect(tool.getDescription()).toBe("Reset current HEAD to the specified state.");
    });
  });

  describe("GitPushTool", () => {
    it("should have correct name", () => {
      const tool = new GitPushTool();
      expect(tool.getName()).toBe(Tool.GIT_PUSH);
    });

    it("should have description", () => {
      const tool = new GitPushTool();
      expect(tool.getDescription()).toBe("Update remote refs along with associated objects.");
    });
  });

  describe("GitPullTool", () => {
    it("should have correct name", () => {
      const tool = new GitPullTool();
      expect(tool.getName()).toBe(Tool.GIT_PULL);
    });

    it("should have description", () => {
      const tool = new GitPullTool();
      expect(tool.getDescription()).toBe("Fetch from and integrate with another repository or a local branch.");
    });
  });

  describe("GitFetchTool", () => {
    it("should have correct name", () => {
      const tool = new GitFetchTool();
      expect(tool.getName()).toBe(Tool.GIT_FETCH);
    });

    it("should have description", () => {
      const tool = new GitFetchTool();
      expect(tool.getDescription()).toBe("Download objects and refs from another repository.");
    });
  });

  describe("GitCheckoutTool", () => {
    it("should have correct name", () => {
      const tool = new GitCheckoutTool();
      expect(tool.getName()).toBe(Tool.GIT_CHECKOUT);
    });

    it("should have description", () => {
      const tool = new GitCheckoutTool();
      expect(tool.getDescription()).toBe("Switch branches or restore working tree files.");
    });
  });

  describe("GitBranchTool", () => {
    it("should have correct name", () => {
      const tool = new GitBranchTool();
      expect(tool.getName()).toBe(Tool.GIT_BRANCH);
    });

    it("should have description", () => {
      const tool = new GitBranchTool();
      expect(tool.getDescription()).toBe("List, create, or delete branches.");
    });
  });

  describe("GitMergeTool", () => {
    it("should have correct name", () => {
      const tool = new GitMergeTool();
      expect(tool.getName()).toBe(Tool.GIT_MERGE);
    });

    it("should have description", () => {
      const tool = new GitMergeTool();
      expect(tool.getDescription()).toBe("Join two or more development histories together.");
    });
  });

  describe("GitRebaseTool", () => {
    it("should have correct name", () => {
      const tool = new GitRebaseTool();
      expect(tool.getName()).toBe(Tool.GIT_REBASE);
    });

    it("should have description", () => {
      const tool = new GitRebaseTool();
      expect(tool.getDescription()).toBe("Reapply commits on top of another base tip.");
    });
  });

  describe("GitStashTool", () => {
    it("should have correct name", () => {
      const tool = new GitStashTool();
      expect(tool.getName()).toBe(Tool.GIT_STASH);
    });

    it("should have description", () => {
      const tool = new GitStashTool();
      expect(tool.getDescription()).toBe("Stash the changes in a dirty working directory away.");
    });
  });
});
