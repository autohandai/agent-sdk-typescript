/**
 * 20 Custom Tool Definition - Building a custom tool via ToolDefinition.
 *
 * Demonstrates creating a custom tool by subclassing ToolDefinition and
 * implementing the required properties and execute method.
 *
 * Usage:
 *   cd examples/20-tool-custom-definition
 *   bun run index.ts
 */

import { ToolDefinition, ToolResult, ToolRegistry } from "@autohandai/agent-sdk";

class WeatherTool extends ToolDefinition {
  /** A mock weather tool that returns simulated weather data. */

  getName(): string {
    return "weather";
  }

  getDescription(): string {
    return "Get the current weather for a given city.";
  }

  getParameters(): Record<string, any> {
    return {
      type: "object",
      properties: {
        city: { type: "string", description: "The city name" },
        unit: {
          type: "string",
          description: "Temperature unit (celsius or fahrenheit)",
          default: "celsius",
        },
      },
      required: ["city"],
    };
  }

  async executeInternal(params: Record<string, any>): Promise<ToolResult> {
    const city = params.city || "Unknown";
    const unit = params.unit || "celsius";
    // Simulated weather data (no real API call needed for demo)
    const tempC = 22;
    const tempF = tempC * 9 / 5 + 32;
    const temp = unit === "celsius" ? tempC : tempF;
    return {
      data: `The current weather in ${city} is ${temp}°${unit[0]}. Partly cloudy with a gentle breeze.`,
    };
  }
}

class CalculatorTool extends ToolDefinition {
  /** A safe calculator tool that evaluates simple math expressions. */

  getName(): string {
    return "calculator";
  }

  getDescription(): string {
    return "Evaluate a simple mathematical expression safely.";
  }

  getParameters(): Record<string, any> {
    return {
      type: "object",
      properties: {
        expression: { type: "string", description: "Math expression like '2 + 3 * 4'" },
      },
      required: ["expression"],
    };
  }

  async executeInternal(params: Record<string, any>): Promise<ToolResult> {
    const expr = params.expression || "";
    // Only allow safe characters
    if (!/^[0-9+\-*/().\s]*$/.test(expr)) {
      return {
        error: "Invalid characters in expression. Only numbers and + - * / ( ) . are allowed.",
      };
    }
    try {
      // Safe evaluation with no builtins
      const result = Function(`"use strict"; return (${expr})`)();
      return { data: `${expr} = ${result}` };
    } catch (error) {
      return { error: String(error) };
    }
  }
}

/**
 * Main function that demonstrates custom tool definition
 */
async function main(): Promise<void> {
  try {
    const registry = new ToolRegistry();

    // Register our custom tools
    const calc = new CalculatorTool();
    registry.register(calc);

    console.log("=== CalculatorTool ===");
    console.log(`Description: ${calc.getDescription()}`);
    console.log(`Parameters: ${JSON.stringify(calc.getParameters())}`);

    const result1 = await registry.execute("calculator", { expression: "2 + 3 * 4" });
    console.log(`Result: ${result1.data}`);

    const result2 = await registry.execute("calculator", { expression: "100 / 7" });
    console.log(`Result: ${result2.data}`);

    const result3 = await registry.execute("calculator", { expression: "rm -rf /" });
    console.log(`Result: ${result3.data}`);

    // Also show the Weather tool (demonstration of the pattern)
    const weather = new WeatherTool();
    console.log(`\n=== WeatherTool ===`);
    console.log(`Description: ${weather.getDescription()}`);
    console.log(`Parameters: ${JSON.stringify(weather.getParameters())}`);
    const weatherResult = await weather.executeInternal({ city: "San Francisco", unit: "fahrenheit" });
    console.log(`Result: ${weatherResult.data}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
