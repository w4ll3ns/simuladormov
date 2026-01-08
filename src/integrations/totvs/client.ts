/**
 * Cliente REST para integração com TOTVS RM
 * Baseado na documentação DOCUMENTACAO_TOTVS_REST.md
 */

import type {
  TotvsConfig,
  TotvsConsultaParams,
  TotvsColaboradorResponse,
  TotvsError,
  TotvsAuthError,
  TotvsConnectionError,
  TotvsTimeoutError,
} from './types';

export class TotvsRestClient {
  private config: TotvsConfig;

  constructor(config: TotvsConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  /**
   * Executa uma consulta SQL no TOTVS usando a API RealizaConsulta
   */
  async realizaConsulta<T = TotvsColaboradorResponse>(
    params?: TotvsConsultaParams
  ): Promise<T[]> {
    const {
      baseUrl,
      username,
      password,
      codigoConsulta,
      coligada,
      sistema,
      timeout = 30000,
      retries = 3,
    } = this.config;

    // Construir URL
    const baseUrlClean = baseUrl.replace(/\/+$/, '');
    const consultaPath = '/api/framework/v1/consultaSQLServer/RealizaConsulta';
    const basePath = `${codigoConsulta}/${coligada}/${sistema}`;

    let url = `${baseUrlClean}${consultaPath}/${basePath}`;

    // Adicionar parâmetros se fornecidos
    if (params && Object.keys(params).length > 0) {
      const queryParams = Object.keys(params)
        .map((key) => `${key}=${String(params[key])}`)
        .join(';');
      url += `?parameters=${queryParams}`;
      console.log('[TOTVS] Parâmetros incluídos na URL:', queryParams);
      console.log('[TOTVS] URL completa:', url);
    } else {
      console.log('[TOTVS] Nenhum parâmetro fornecido ou parâmetros vazios');
      console.log('[TOTVS] params:', params);
    }

    // Autenticação HTTP Basic
    const auth = btoa(`${username}:${password}`);

    // Executar com retry
    return this.executeWithRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Tratar erros de autenticação
          if (response.status === 401 || response.status === 403) {
            throw new TotvsAuthError(
              `Autenticação falhou: ${response.status} ${response.statusText}`
            );
          }

          if (!response.ok) {
            throw new TotvsError(
              `HTTP ${response.status}: ${response.statusText}`,
              response.status
            );
          }

          const data = await response.json();

          // Extrair registros da resposta (suporta diferentes formatos)
          return this.extractRecords<T>(data);
        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new TotvsTimeoutError(timeout);
          }

          if (error instanceof TotvsError) {
            throw error;
          }

          throw new TotvsConnectionError(
            error instanceof Error ? error.message : 'Erro desconhecido'
          );
        }
      },
      retries
    );
  }

  /**
   * Extrai registros da resposta do TOTVS (suporta diferentes formatos)
   */
  private extractRecords<T>(data: unknown): T[] {
    // 1. Array direto
    if (Array.isArray(data)) {
      return data as T[];
    }

    // 2. Objeto com propriedade 'dados'
    if (data && typeof data === 'object' && 'dados' in data) {
      const dados = (data as { dados: unknown }).dados;
      if (Array.isArray(dados)) {
        return dados as T[];
      }
    }

    // 3. Objeto com propriedade 'data'
    if (data && typeof data === 'object' && 'data' in data) {
      const dataProp = (data as { data: unknown }).data;
      if (Array.isArray(dataProp)) {
        return dataProp as T[];
      }
    }

    // 4. Objeto com propriedade 'records'
    if (data && typeof data === 'object' && 'records' in data) {
      const records = (data as { records: unknown }).records;
      if (Array.isArray(records)) {
        return records as T[];
      }
    }

    // 5. Objeto único (envolver em array)
    if (data && typeof data === 'object' && data !== null) {
      return [data as T];
    }

    // 6. Nenhum dado
    return [];
  }

  /**
   * Executa uma função com retry e backoff exponencial
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Não retentar erros de autenticação
        if (error instanceof TotvsAuthError) {
          throw error;
        }

        // Aguardar antes de tentar novamente (backoff exponencial)
        if (i < retries - 1) {
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Erro desconhecido');
  }

  /**
   * Testa a conexão com o TOTVS usando uma consulta simples
   */
  async testConnection(params?: TotvsConsultaParams): Promise<{ success: boolean; error?: string }> {
    try {
      // Tentar executar a consulta (mesmo que retorne vazio, se não der erro, está OK)
      await this.realizaConsulta(params);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }
}

