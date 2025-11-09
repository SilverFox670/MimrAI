import { LLMAdapter } from "@core/types/llm";
import { AnthropicAdapter, AnthropicConfig } from "./anthropic";
import { OllamaAdapter, OllamaConfig } from "./ollama";

export type LLMProvider = "anthropic" | "ollama";

export interface LLMFactoryConfig {
  provider: LLMProvider;
  anthropic?: AnthropicConfig;
  ollama?: OllamaConfig;
}

export class LLMFactory {
  constructor(private config: LLMFactoryConfig) {}

  createAdapter(): LLMAdapter {
    switch (this.config.provider) {
      case "ollama":
        if (!this.config.ollama) {
          throw new Error(
            "Ollama configuration is required when using Ollama provider"
          );
        }
        return new OllamaAdapter(this.config.ollama);

      case "anthropic":
        if (!this.config.anthropic) {
          throw new Error(
            "Anthropic configuration is required when using Anthropic provider"
          );
        }
        return new AnthropicAdapter(this.config.anthropic);

      default:
        throw new Error(`Unknown LLM provider: ${this.config.provider}`);
    }
  }

  static fromConfig(config: Record<string, any>): LLMFactory {
    return new LLMFactory({
      provider: config.llm.provider,
      anthropic: config.llm.anthropic,
      ollama: config.llm.ollama,
    });
  }
}
