export interface LLMAdapter {
  /**
   * Generate a response from the LLM model
   * @param prompt The prompt to send to the model
   * @param options Configuration options for the request
   */
  generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;

  /**
   * Stream a response from the LLM model
   * @param prompt The prompt to send to the model
   * @param options Configuration options for the request
   */
  streamGenerate?(
    prompt: string,
    options?: LLMRequestOptions
  ): AsyncGenerator<LLMResponseChunk>;
}

export interface LLMRequestOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response generation (0-1) */
  temperature?: number;
  /** Stop sequences that will halt generation */
  stopSequences?: string[];
  /** System prompt to set the context/behavior */
  systemPrompt?: string;
  /** Additional model-specific parameters */
  modelParams?: Record<string, unknown>;
}

export interface LLMOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response generation (0-1) */
  temperature?: number;
  /** System prompt to set the context/behavior */
  systemPrompt?: string;
  /** Stop sequences that will halt generation */
  stopSequences?: string[];
  /** Additional model-specific parameters */
  modelParams?: Record<string, unknown>;
}

export interface LLMResponse {
  /** The generated text response */
  content: string;
  /** Number of tokens used in the request */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Additional model-specific metadata */
  metadata?: Record<string, unknown>;
}

export interface LLMResponseChunk {
  /** The chunk of generated text */
  content: string;
  /** Whether this is the last chunk */
  done: boolean;
  /** Additional model-specific metadata */
  metadata?: Record<string, unknown>;
}

export interface LLMAdapter {
  /**
   * Generate a response from the LLM model
   * @param prompt The prompt to send to the model
   * @param options Configuration options for the request
   */
  generate(prompt: string, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * Stream a response from the LLM model
   * @param prompt The prompt to send to the model
   * @param options Configuration options for the request
   */
  streamGenerate?(
    prompt: string,
    options?: LLMOptions
  ): AsyncGenerator<LLMResponseChunk>;
}
