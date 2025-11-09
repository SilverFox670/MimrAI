import { OllamaAdapter } from "../../../src/adapters/llm/ollama";
import { OllamaGenerateResponse } from "../../../src/adapters/llm/types";
import { OllamaLoadBalancer } from "../../../src/adapters/llm/load-balancer";

jest.mock("../../../src/adapters/llm/load-balancer", () => {
  return {
    OllamaLoadBalancer: jest
      .fn()
      .mockImplementation(function (
        this: any,
        urls: string[],
        strategy = "round-robin",
        healthCheckPeriod = 30000
      ) {
        const endpoints = urls.map((url) => ({
          url,
          health: { lastCheck: new Date(), status: "healthy" },
        }));

        this.getNextEndpoint = jest.fn();
        this.stopHealthChecks = jest.fn();
        this.getEndpoints = jest.fn().mockReturnValue(endpoints);
      }),
  };
});

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("OllamaAdapter with Load Balancing", () => {
  let adapter: OllamaAdapter;
  let fetchMock: jest.Mock;
  const mockEndpoints = ["http://ollama-1:11434", "http://ollama-2:11434"];

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    adapter = new OllamaAdapter({
      endpoints: mockEndpoints,
      model: "llama2",
      loadBalancing: "round-robin",
      defaults: {
        maxTokens: 1024,
        temperature: 0.7,
      },
    });
  });

  afterEach(() => {
    if (adapter["loadBalancer"]) {
      adapter["loadBalancer"].stopHealthChecks();
    }
  });

  describe("generate", () => {
    it("should use load balancer to select endpoint", async () => {
      const mockEndpoint = mockEndpoints[0];
      const lb = (adapter as any).loadBalancer;
      lb.getNextEndpoint.mockResolvedValue(mockEndpoint);

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

      expect(lb.getNextEndpoint).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockEndpoint}/api/generate`,
        expect.any(Object)
      );
      expect(result.metadata?.endpoint).toBe(mockEndpoint);
    });

    it("should handle endpoint failures", async () => {
      // First endpoint fails
      const mockEndpoint1 = mockEndpoints[0];
      const mockEndpoint2 = mockEndpoints[1];
      const lb = (adapter as any).loadBalancer;

      lb.getNextEndpoint
        .mockResolvedValueOnce(mockEndpoint1)
        .mockResolvedValueOnce(mockEndpoint2);

      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          text: () => Promise.resolve("Service unavailable"),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              model: "llama2",
              response: "Backup response",
              done: true,
              context: [],
              total_duration: 1234567890,
              load_duration: 123456,
              prompt_eval_count: 10,
              prompt_eval_duration: 123456,
              eval_count: 20,
              eval_duration: 234567,
            }),
        });

      const result = await adapter.generate("Test prompt");

      expect(lb.getNextEndpoint).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `${mockEndpoint1}/api/generate`,
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        `${mockEndpoint2}/api/generate`,
        expect.any(Object)
      );
      expect(result.metadata?.endpoint).toBe(mockEndpoint2);
    });
  });

  describe("streamGenerate", () => {
    it("should use load balancer for streaming", async () => {
      const mockEndpoint = mockEndpoints[0];
      const lb = (adapter as any).loadBalancer;
      lb.getNextEndpoint.mockResolvedValue(mockEndpoint);

      // Mock a ReadableStream for the response body
      const { Readable } = require("stream");
      const mockStream = new Readable({
        read() {
          this.push(
            Buffer.from(
              JSON.stringify({
                model: "llama2",
                response: "Hello",
                done: false,
              }) + "\n"
            )
          );
          this.push(
            Buffer.from(
              JSON.stringify({
                model: "llama2",
                response: " world",
                done: false,
              }) + "\n"
            )
          );
          this.push(null); // End of stream
        },
      });

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

      expect(lb.getNextEndpoint).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith(
        `${mockEndpoint}/api/generate`,
        expect.any(Object)
      );
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("should handle streaming endpoint failures", async () => {
      const mockEndpoint1 = mockEndpoints[0];
      const mockEndpoint2 = mockEndpoints[1];
      const lb = (adapter as any).loadBalancer;

      lb.getNextEndpoint
        .mockResolvedValueOnce(mockEndpoint1)
        .mockResolvedValueOnce(mockEndpoint2);

      // Use Node.js stream.Readable to mock the streaming response
      const { Readable } = require("stream");
      const mockStream = new Readable({
        read() {
          this.push(
            Buffer.from(
              JSON.stringify({
                model: "llama2",
                response: "Backup",
                done: false,
              }) + "\n"
            )
          );
          this.push(null); // End of stream
        },
      });

      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          text: () => Promise.resolve("Service unavailable"),
        })
        .mockResolvedValueOnce({
          ok: true,
          body: mockStream,
        });

      const chunks: string[] = [];
      for await (const chunk of adapter.streamGenerate("Test prompt")) {
        if (!chunk.done) {
          chunks.push(chunk.content);
        }
      }

      expect(lb.getNextEndpoint).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `${mockEndpoint1}/api/generate`,
        expect.any(Object)
      );
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        `${mockEndpoint2}/api/generate`,
        expect.any(Object)
      );
      expect(chunks).toEqual(["Backup"]);
    });
  });
});
