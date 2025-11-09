import {
  LLMAdapter,
  LLMOptions,
  LLMResponse,
  LLMResponseChunk,
} from "@core/types/llm";
import { OllamaGenerateResponse } from "./types";
import { OllamaLoadBalancer } from "./load-balancer";

export interface OllamaConfig {
  endpoints: string[];
  model: string;
  loadBalancing?: "round-robin" | "least-loaded";
  defaults?: {
    maxTokens?: number;
    temperature?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval?: number;
  };
}
export class OllamaAdapter implements LLMAdapter {
  private loadBalancer: OllamaLoadBalancer;
  private model: string;
  private readonly defaults: Required<NonNullable<OllamaConfig["defaults"]>>;

  constructor(config: OllamaConfig) {
    this.loadBalancer = new OllamaLoadBalancer(
      config.endpoints,
      config.loadBalancing,
      config.healthCheck?.enabled ? config.healthCheck.interval : undefined
    );
    this.model = config.model;
    this.defaults = {
      maxTokens: config.defaults?.maxTokens ?? 1024,
      temperature: config.defaults?.temperature ?? 0.7,
    };
  }

  async generate(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    let lastError: string | undefined;
    let retryCount = 0;
    const MAX_RETRIES = this.loadBalancer.getEndpoints().length;

    while (retryCount < MAX_RETRIES) {
      const endpoint = await this.loadBalancer.getNextEndpoint();
      retryCount++;

      try {
        const response = await fetch(`${endpoint}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            prompt,
            system: options?.systemPrompt,
            temperature: options?.temperature ?? this.defaults.temperature,
            max_tokens: options?.maxTokens ?? this.defaults.maxTokens,
            stop: options?.stopSequences,
            raw: true, // Get token counts
            ...options?.modelParams,
          }),
        });

        if (!response.ok) {
          lastError = await response.text();
          throw new Error(`Ollama API error: ${lastError}`);
        }

        const result = (await response.json()) as OllamaGenerateResponse;

        return {
          content: result.response,
          usage: {
            promptTokens: result.prompt_eval_count,
            completionTokens: result.eval_count,
            totalTokens: result.prompt_eval_count + result.eval_count,
          },
          metadata: {
            model: result.model,
            totalDuration: result.total_duration,
            loadDuration: result.load_duration,
            promptEvalDuration: result.prompt_eval_duration,
            evalDuration: result.eval_duration,
            endpoint,
          },
        };
      } catch (err) {
        // Continue to next endpoint
      }
    }

    // If we exhausted all endpoints without success
    if (lastError) {
      throw new Error(`Ollama API error: ${lastError}`);
    }
    throw new Error("No healthy endpoints available");
  }

  async *streamGenerate(
    prompt: string,
    options?: LLMOptions
  ): AsyncGenerator<LLMResponseChunk> {
    let lastError: string | undefined;
    let retryCount = 0;
    const MAX_RETRIES = this.loadBalancer.getEndpoints().length;

    while (retryCount < MAX_RETRIES) {
      const endpoint = await this.loadBalancer.getNextEndpoint();

      try {
        const response = await fetch(`${endpoint}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            prompt,
            system: options?.systemPrompt,
            temperature: options?.temperature ?? this.defaults.temperature,
            max_tokens: options?.maxTokens ?? this.defaults.maxTokens,
            stop: options?.stopSequences,
            stream: true,
            raw: true,
            ...options?.modelParams,
          }),
        });

        if (!response.ok) {
          lastError = await response.text();
          throw new Error(`Ollama API error: ${lastError}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        // Detect environment: Web ReadableStream vs Node.js ReadableStream
        if (typeof response.body.getReader === "function") {
          // Browser or node-fetch v3
          const reader = response.body.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.trim()) {
                  const chunk = JSON.parse(line);
                  yield {
                    content: chunk.response,
                    done: false,
                    metadata: { endpoint },
                  };
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        } else {
          // Node.js built-in fetch — async iterator fallback
          for await (const chunk of response.body as any) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                const chunk = JSON.parse(line);
                yield {
                  content: chunk.response,
                  done: false,
                  metadata: { endpoint },
                };
              }
            }
          }
        }

        // Process any remaining partial buffer
        if (buffer.trim()) {
          const chunk = JSON.parse(buffer);
          yield {
            content: chunk.response,
            done: false,
            metadata: { endpoint },
          };
        }

        // Mark stream completion
        yield { content: "", done: true, metadata: { endpoint } };
        return;
      } catch (err) {
        retryCount++;
        if (retryCount === MAX_RETRIES && lastError) {
          throw new Error(`Ollama API error: ${lastError}`);
        }
        // Try next endpoint
      }
    }

    // Exhausted all endpoints
    if (lastError) {
      throw new Error(`Ollama API error: ${lastError}`);
    }
    throw new Error("No healthy endpoints available");
  }
}
