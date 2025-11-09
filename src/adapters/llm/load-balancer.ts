export interface OllamaHealthMetrics {
  queueLength: number;
  activeRequests: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface OllamaEndpoint {
  url: string;
  health: {
    lastCheck: Date;
    status: "healthy" | "unhealthy";
    loadMetrics?: OllamaHealthMetrics;
  };
}

export interface OllamaLoadBalancingStrategy {
  selectEndpoint(endpoints: OllamaEndpoint[]): Promise<string>;
  updateHealth(endpoint: OllamaEndpoint, metrics?: OllamaHealthMetrics): void;
}

export class RoundRobinStrategy implements OllamaLoadBalancingStrategy {
  private currentIndex = 0;

  async selectEndpoint(endpoints: OllamaEndpoint[]): Promise<string> {
    const healthyEndpoints = endpoints.filter(
      (e) => e.health.status === "healthy"
    );
    if (healthyEndpoints.length === 0) {
      throw new Error("No healthy endpoints available");
    }

    this.currentIndex = (this.currentIndex + 1) % healthyEndpoints.length;
    return healthyEndpoints[this.currentIndex].url;
  }

  updateHealth(endpoint: OllamaEndpoint, metrics?: OllamaHealthMetrics): void {
    endpoint.health = {
      lastCheck: new Date(),
      status: "healthy",
      loadMetrics: metrics,
    };
  }
}

export class LeastLoadedStrategy implements OllamaLoadBalancingStrategy {
  async selectEndpoint(endpoints: OllamaEndpoint[]): Promise<string> {
    const healthyEndpoints = endpoints.filter(
      (e) => e.health.status === "healthy"
    );
    if (healthyEndpoints.length === 0) {
      throw new Error("No healthy endpoints available");
    }

    // Sort by load (active requests + queue length)
    const sorted = healthyEndpoints.sort((a, b) => {
      const loadA = a.health.loadMetrics
        ? a.health.loadMetrics.activeRequests + a.health.loadMetrics.queueLength
        : 0;
      const loadB = b.health.loadMetrics
        ? b.health.loadMetrics.activeRequests + b.health.loadMetrics.queueLength
        : 0;
      return loadA - loadB;
    });

    return sorted[0].url;
  }

  updateHealth(endpoint: OllamaEndpoint, metrics?: OllamaHealthMetrics): void {
    endpoint.health = {
      lastCheck: new Date(),
      status: "healthy",
      loadMetrics: metrics,
    };
  }
}

export class OllamaLoadBalancer {
  private endpoints: OllamaEndpoint[];
  private strategy: OllamaLoadBalancingStrategy;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    urls: string[],
    strategy: "round-robin" | "least-loaded" = "round-robin",
    private healthCheckPeriod: number = 30000 // 30 seconds
  ) {
    this.endpoints = urls.map((url) => ({
      url,
      health: {
        lastCheck: new Date(),
        status: "healthy",
      },
    }));

    this.strategy =
      strategy === "round-robin"
        ? new RoundRobinStrategy()
        : new LeastLoadedStrategy();

    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(
      () => this.checkAllEndpoints(),
      this.healthCheckPeriod
    );
  }

  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private async checkAllEndpoints(): Promise<void> {
    await Promise.all(
      this.endpoints.map((endpoint) => this.checkHealth(endpoint))
    );
  }

  private async checkHealth(endpoint: OllamaEndpoint): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${endpoint.url}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Health check failed");
      }

      const metrics = (await response.json()) as OllamaHealthMetrics;
      this.strategy.updateHealth(endpoint, metrics);
    } catch (error) {
      endpoint.health = {
        lastCheck: new Date(),
        status: "unhealthy",
      };
    }
  }

  public async getNextEndpoint(): Promise<string> {
    return this.strategy.selectEndpoint(this.endpoints);
  }

  public getEndpoints(): OllamaEndpoint[] {
    return [...this.endpoints];
  }
}
