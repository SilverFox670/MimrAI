import { LLMFactory } from "../../../src/adapters/llm/factory";
import { AnthropicAdapter } from "../../../src/adapters/llm/anthropic";
import { OllamaAdapter } from "../../../src/adapters/llm/ollama";

jest.mock("../../../src/adapters/llm/anthropic");
jest.mock("../../../src/adapters/llm/ollama");

describe("LLMFactory", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should create Ollama adapter", () => {
    const factory = new LLMFactory({
      provider: "ollama",
      ollama: {
        endpoints: ["http://localhost:11434"],
        model: "llama2",
      },
    });

    const adapter = factory.createAdapter();
    expect(adapter).toBeInstanceOf(OllamaAdapter);
    expect(OllamaAdapter).toHaveBeenCalledWith({
      endpoints: ["http://localhost:11434"],
      model: "llama2",
    });
  });

  it("should create Anthropic adapter", () => {
    const factory = new LLMFactory({
      provider: "anthropic",
      anthropic: {
        apiKey: "test-key",
        defaultModel: "claude-2",
      },
    });

    const adapter = factory.createAdapter();
    expect(adapter).toBeInstanceOf(AnthropicAdapter);
    expect(AnthropicAdapter).toHaveBeenCalledWith({
      apiKey: "test-key",
      defaultModel: "claude-2",
    });
  });

  it("should throw error for missing Ollama config", () => {
    const factory = new LLMFactory({
      provider: "ollama",
    });

    expect(() => factory.createAdapter()).toThrow(
      "Ollama configuration is required"
    );
  });

  it("should throw error for missing Anthropic config", () => {
    const factory = new LLMFactory({
      provider: "anthropic",
    });

    expect(() => factory.createAdapter()).toThrow(
      "Anthropic configuration is required"
    );
  });

  it("should throw error for unknown provider", () => {
    const factory = new LLMFactory({
      provider: "unknown" as any,
    });

    expect(() => factory.createAdapter()).toThrow("Unknown LLM provider");
  });

  describe("fromConfig", () => {
    it("should create factory from config object", () => {
      const config = {
        llm: {
          provider: "ollama",
          ollama: {
            endpoint: "http://localhost:11434",
            model: "llama2",
          },
        },
      };

      const factory = LLMFactory.fromConfig(config);
      const adapter = factory.createAdapter();
      expect(adapter).toBeInstanceOf(OllamaAdapter);
    });
  });
});
