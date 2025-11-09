import { AnthropicAdapter } from "../../../src/adapters/llm/anthropic";
import { Anthropic } from "@anthropic-ai/sdk";

// Mock the Anthropic SDK
jest.mock("@anthropic-ai/sdk");

describe("AnthropicAdapter", () => {
  let adapter: AnthropicAdapter;
  let mockCreate: jest.Mock;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    jest.resetAllMocks();
    mockCreate = jest.fn();
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
      () =>
        ({
          messages: { create: mockCreate },
        } as any)
    );

    adapter = new AnthropicAdapter({
      apiKey: mockApiKey,
      defaultModel: "claude-2.1",
    });
  });

  describe("generate", () => {
    it("should generate a response with default options", async () => {
      const mockResponse = {
        id: "msg_123",
        model: "claude-2.1",
        content: [{ type: "text", text: "Test response" }],
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
        stop_reason: "end_turn",
        stop_sequence: null,
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.generate("Test prompt");

      expect(mockCreate).toHaveBeenCalledWith({
        model: "claude-2.1",
        messages: [{ role: "user", content: "Test prompt" }],
        max_tokens: 1024,
        temperature: undefined,
        system: undefined,
        stop_sequences: undefined,
      });

      expect(result).toEqual({
        content: "Test response",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        metadata: {
          model: "claude-2.1",
          stopReason: "end_turn",
          stopSequence: null,
        },
      });
    });

    it("should generate a response with custom options", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "Custom response" }],
        usage: {
          input_tokens: 15,
          output_tokens: 25,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.generate("Test prompt", {
        temperature: 0.7,
        maxTokens: 100,
        systemPrompt: "You are a helpful assistant",
        stopSequences: ["\n###\n"],
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: "claude-2.1",
        messages: [{ role: "user", content: "Test prompt" }],
        max_tokens: 100,
        temperature: 0.7,
        system: "You are a helpful assistant",
        stop_sequences: ["\n###\n"],
      });

      expect(result.content).toBe("Custom response");
    });
  });

  describe("streamGenerate", () => {
    it("should stream response chunks", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "Hello" },
          };
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: " world" },
          };
        },
      };

      mockCreate.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of await adapter.streamGenerate("Test prompt")) {
        if (!chunk.done) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks).toEqual(["Hello", " world"]);
      expect(mockCreate).toHaveBeenCalledWith({
        model: "claude-2.1",
        messages: [{ role: "user", content: "Test prompt" }],
        max_tokens: 1024,
        temperature: undefined,
        system: undefined,
        stop_sequences: undefined,
        stream: true,
      });
    });

    it("should handle empty or non-text chunks", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "" },
          };
          yield {
            type: "content_block_delta",
            delta: { type: "thinking_delta" },
          };
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: "Valid response" },
          };
        },
      };

      mockCreate.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of await adapter.streamGenerate("Test prompt")) {
        if (!chunk.done && chunk.content) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks).toEqual(["Valid response"]);
    });
  });
});
