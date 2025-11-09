import { OllamaAdapter } from "../../../src/adapters/llm/ollama";
import { OllamaGenerateResponse } from "../../../src/adapters/llm/types";

describe("OllamaAdapter", () => {
  let adapter: OllamaAdapter;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    adapter = new OllamaAdapter({
      endpoints: ["http://localhost:11434"],
      model: "llama2",
      defaults: {
        maxTokens: 1024,
        temperature: 0.7,
      },
    });
  });

  describe("generate", () => {
    it("should generate a response with default options", async () => {
      const mockResponse: OllamaGenerateResponse = {
        model: "llama2",
        response: "Test response",
        done: true,
        context: [],
        total_duration: 1234567890,
        load_duration: 123456,
        prompt_eval_count: 10,
        prompt_eval_duration: 123456,
        eval_count: 20,
        eval_duration: 234567,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await adapter.generate("Test prompt");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:11434/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama2",
            prompt: "Test prompt",
            temperature: 0.7,
            max_tokens: 1024,
            system: undefined,
            stop: undefined,
            raw: true,
          }),
        }
      );

      expect(result).toEqual({
        content: "Test response",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        metadata: {
          endpoint: "http://localhost:11434",
          model: "llama2",
          totalDuration: 1234567890,
          loadDuration: 123456,
          promptEvalDuration: 123456,
          evalDuration: 234567,
        },
      });
    });

    it("should generate a response with custom options", async () => {
      const mockResponse: OllamaGenerateResponse = {
        model: "llama2",
        response: "Custom response",
        done: true,
        context: [],
        total_duration: 1234567890,
        load_duration: 123456,
        prompt_eval_count: 15,
        prompt_eval_duration: 123456,
        eval_count: 25,
        eval_duration: 234567,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await adapter.generate("Test prompt", {
        temperature: 0.5,
        maxTokens: 100,
        systemPrompt: "You are a helpful assistant",
        stopSequences: ["\n###\n"],
        modelParams: {
          repeat_penalty: 1.1,
        },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:11434/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"model":"llama2"'),
        }
      );

      expect(result.content).toBe("Custom response");
    });

    it("should handle API errors", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Model not found"),
      });

      await expect(adapter.generate("Test prompt")).rejects.toThrow(
        "Ollama API error: Model not found"
      );
    });
  });

  describe("streamGenerate", () => {
    it("should stream response chunks", async () => {
      const mockStream = {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                JSON.stringify({
                  model: "llama2",
                  response: "Hello",
                  done: false,
                }) + "\n"
              ),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                JSON.stringify({
                  model: "llama2",
                  response: " world",
                  done: false,
                }) + "\n"
              ),
            })
            .mockResolvedValueOnce({ done: true }),
          releaseLock: jest.fn(),
        }),
      };

      fetchMock.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const chunks: string[] = [];
      for await (const chunk of adapter.streamGenerate("Test prompt")) {
        if (!chunk.done) {
          chunks.push(chunk.content);
        }
      }

      expect(chunks).toEqual(["Hello", " world"]);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:11434/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama2",
            prompt: "Test prompt",
            temperature: 0.7,
            max_tokens: 1024,
            system: undefined,
            stop: undefined,
            stream: true,
            raw: true,
          }),
        }
      );
    });

    it("should handle streaming API errors", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Model not found"),
      });

      await expect(async () => {
        for await (const _ of adapter.streamGenerate("Test prompt")) {
          // consume stream
        }
      }).rejects.toThrow("Ollama API error: Model not found");
    });
  });
});
