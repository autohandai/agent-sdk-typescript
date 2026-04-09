/**
 * Unit tests for Config
 */

import { loadConfig } from "../config";

describe("Config", () => {
  test("loads config with defaults", () => {
    const config = loadConfig();
    expect(config.provider).toBe("openrouter");
    expect(config.model).toBeUndefined();
    expect(config.apiKey).toBeUndefined();
  });

  test("can load from environment", () => {
    process.env.AUTOHAND_PROVIDER = "openai";
    process.env.AUTOHAND_API_KEY = "sk-test";
    process.env.AUTOHAND_MODEL = "gpt-4";

    const config = loadConfig();

    expect(config.provider).toBe("openai");
    expect(config.apiKey).toBe("sk-test");
    expect(config.model).toBe("gpt-4");

    // Cleanup
    delete process.env.AUTOHAND_PROVIDER;
    delete process.env.AUTOHAND_API_KEY;
    delete process.env.AUTOHAND_MODEL;
  });
});
