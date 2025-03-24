import * as http from 'http';

type EnvConfig = {
  SCUTTLE_LOGGING?: string;
  ALWAYS_KILL_ENVOY?: string;
  ENVOY_ADMIN_API?: string;
  ISTIO_QUIT_API?: string;
};

class Scuttle {
  private logging: boolean;
  private alwaysKillEnvoy: boolean;
  private envoyAdminApi: string;
  private istioQuitApi: string;

  constructor() {
    const envConfig = this.loadEnvConfig();
    this.logging = envConfig.SCUTTLE_LOGGING === 'true';
    this.alwaysKillEnvoy = envConfig.ALWAYS_KILL_ENVOY === 'true';
    this.envoyAdminApi = envConfig.ENVOY_ADMIN_API || 'http://127.0.0.1:15000';
    this.istioQuitApi = envConfig.ISTIO_QUIT_API || 'http://127.0.0.1:15000';

    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Cleaning up...');
      this.cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Cleaning up...');
      this.cleanup();
      process.exit(0);
    });
  }

  private loadEnvConfig(): EnvConfig {
    return {
      SCUTTLE_LOGGING: process.env.SCUTTLE_LOGGING,
      ALWAYS_KILL_ENVOY: process.env.ALWAYS_KILL_ENVOY,
      ENVOY_ADMIN_API: process.env.ENVOY_ADMIN_API,
      ISTIO_QUIT_API: process.env.ISTIO_QUIT_API,
    };
  }

  private cleanup(): void {
    if (this.alwaysKillEnvoy) {
      this.stopEnvoy();
    }
  }

  public async stopEnvoy(): Promise<void> {
    if (this.logging) console.log(`[${new Date().toISOString()}] Stopping Envoy via:`, this.istioQuitApi);
    this.makeHttpRequest(this.istioQuitApi, 'POST');
  }

  public async ensureEnvoyRunning(): Promise<void> {
    if (this.logging) console.log(`[${new Date().toISOString()}] Ensuring Envoy is running:`, this.envoyAdminApi);
    this.makeHttpRequest(this.envoyAdminApi, 'GET');
  }

  private makeHttpRequest(url: string, method: string): void {
    const request = http.request(url, { method }, (res: http.IncomingMessage) => {
      if (this.logging) console.log(`[${new Date().toISOString()}] Response from ${url}: ${res.statusCode}`);
      res.on('end', () => request.end());
    });
    request.on('error', (err: NodeJS.ErrnoException) => {
      console.error(`[${new Date().toISOString()}] Error making request to ${url}:`, err);
    });
    request.end();
  }
}

export default Scuttle;