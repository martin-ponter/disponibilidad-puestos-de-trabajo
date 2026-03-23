import type { BitrixContext, BitrixPlacementInfo, BitrixSdk } from '../types/bitrix';

function logBitrix(scope: string, error: unknown, extra?: unknown): void {
  console.error(`[bitrix:${scope}]`, error, extra ?? '');
}

export class BitrixService {
  private readonly sdk?: BitrixSdk;
  private context: BitrixContext = {
    embedded: false,
    placement: null,
    auth: null,
  };

  constructor(sdk = typeof window !== 'undefined' ? window.BX24 : undefined) {
    this.sdk = sdk;
  }

  isReady(): boolean {
    return Boolean(this.sdk);
  }

  isEmbedded(): boolean {
    return this.context.embedded;
  }

  getContext(): BitrixContext {
    return this.context;
  }

  async init(): Promise<BitrixContext> {
    if (!this.sdk) {
      this.context = {
        embedded: false,
        placement: null,
        auth: null,
      };

      return this.context;
    }

    try {
      await new Promise<void>((resolve) => this.sdk?.init(resolve));

      const placement = await new Promise<BitrixPlacementInfo>((resolve) => {
        this.sdk?.placementInfo(resolve);
      });

      this.context = {
        embedded: true,
        placement,
        auth: this.sdk.getAuth?.() ?? null,
      };

      return this.context;
    } catch (error) {
      logBitrix('init', error);
      this.context = {
        embedded: false,
        placement: null,
        auth: null,
      };
      return this.context;
    }
  }

  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.sdk) {
      throw new Error('BX24 no disponible en este contexto.');
    }

    return new Promise<T>((resolve, reject) => {
      this.sdk?.callMethod<T>(method, params, (response) => {
        const error = response.answer?.error;

        if (error) {
          const normalizedError = new Error(response.answer?.error_description ?? error);
          logBitrix(method, normalizedError, params);
          reject(normalizedError);
          return;
        }

        resolve(response.answer?.result as T);
      });
    });
  }
}

export const bitrixService = new BitrixService();
