import { Anthropic } from "@anthropic-ai/sdk";
import {
  LLMAdapter,
  LLMRequestOptions,
  LLMResponse,
  LLMResponseChunk,
} from "@core/types/llm";

export interface AnthropicConfig {
  apiKey: string;
  defaultModel?: string;
  maxRetries?: number;
}

export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries ?? 3,
    });
    this.defaultModel = config.defaultModel ?? "claude-2.1";
  }

  async generate(
    prompt: string,
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: (options?.modelParams?.model as string) ?? this.defaultModel,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature,
      system: options?.systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stop_sequences: options?.stopSequences,
    });

    return {
      content: response.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join(""),
      usage: {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens:
          (response.usage?.input_tokens ?? 0) +
          (response.usage?.output_tokens ?? 0),
      },
      metadata: {
        model: response.model,
        stopReason: response.stop_reason,
        stopSequence: response.stop_sequence,
      },
    };
  }

  async *streamGenerate(
    prompt: string,
    options?: LLMRequestOptions
  ): AsyncGenerator<LLMResponseChunk> {
    const stream = await this.client.messages.create({
      model: (options?.modelParams?.model as string) ?? this.defaultModel,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature,
      system: options?.systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stop_sequences: options?.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield {
          content: chunk.delta.text ?? "",
          done: false,
        };
      }
    }

    yield {
      content: "",
      done: true,
    };
  }
}
