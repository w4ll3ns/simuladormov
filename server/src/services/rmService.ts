import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/env';
import { generateBasicAuthHeader } from '../utils/auth';
import { buildRmQueryString, validateQueryParams } from '../utils/params';
import { configService } from './configService';

/**
 * Interface para os parâmetros da consulta SQL
 */
export interface RmQueryParams {
  codSentenca: string;
  codColigada: string | number;
  codSistema: string;
  params?: Record<string, string | number>;
}

/**
 * Interface para a resposta padronizada da API
 */
export interface RmApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  executionTimeMs?: number;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
}

/**
 * Serviço para integração com TOTVS RM
 * Responsável por executar consultas SQL no RM via API oficial
 */
export class RmService {
  private client: AxiosInstance | null = null;
  private baseUrl: string = '';
  private authHeader: string = '';
  private userId?: string;

  /**
   * Configura o serviço com as credenciais do RM
   * Pode usar configurações do banco de dados ou variáveis de ambiente
   */
  async configure(userId?: string, testConfig?: { baseUrl: string; username: string; password: string }) {
    let rmBaseUrl: string;
    let rmUsername: string;
    let rmPassword: string;

    // Se há configuração de teste (vem do header), usa ela
    if (testConfig) {
      rmBaseUrl = testConfig.baseUrl;
      rmUsername = testConfig.username;
      rmPassword = testConfig.password;
    }
    // Se há userId, tenta buscar do banco
    else if (userId && configService.isConfigured()) {
      try {
        const dbConfig = await configService.getRmConfig(userId);
        if (dbConfig && dbConfig.rm_base_url && dbConfig.rm_username && dbConfig.rm_password) {
          rmBaseUrl = dbConfig.rm_base_url;
          rmUsername = dbConfig.rm_username;
          rmPassword = dbConfig.rm_password;
          this.userId = userId;
          
          if (config.nodeEnv === 'development') {
            console.log(`[RM Service] Usando configurações do banco para usuário ${userId}`);
          }
        } else {
          // Fallback para variáveis de ambiente
          if (config.nodeEnv === 'development') {
            console.log(`[RM Service] Configurações do banco não encontradas para usuário ${userId}, usando variáveis de ambiente`);
          }
          rmBaseUrl = config.rm.baseUrl;
          rmUsername = config.rm.username;
          rmPassword = config.rm.password;
        }
      } catch (error) {
        // Em caso de erro ao buscar do banco, usa variáveis de ambiente
        console.error('[RM Service] Erro ao buscar configurações do banco:', error);
        rmBaseUrl = config.rm.baseUrl;
        rmUsername = config.rm.username;
        rmPassword = config.rm.password;
      }
    }
    // Fallback para variáveis de ambiente
    else {
      rmBaseUrl = config.rm.baseUrl;
      rmUsername = config.rm.username;
      rmPassword = config.rm.password;
    }

    // Valida se as credenciais estão configuradas
    if (!rmBaseUrl || !rmUsername || !rmPassword) {
      const errorMsg = userId && configService.isConfigured()
        ? 'Credenciais do RM não configuradas no sistema. Configure em /config/rm ou nas variáveis de ambiente.'
        : 'Credenciais do RM não configuradas. Configure no sistema ou nas variáveis de ambiente.';
      throw new Error(errorMsg);
    }

    this.baseUrl = rmBaseUrl;

    // Gera header de autenticação
    this.authHeader = generateBasicAuthHeader(rmUsername, rmPassword);

    // Cria instância do Axios configurada para o RM
    // Seguindo padrão da documentação TOTVS REST
    this.client = axios.create({
      baseURL: this.baseUrl.replace(/\/+$/, ''), // Remove barras finais (conforme documentação)
      timeout: 30000, // 30 segundos (conforme documentação)
      headers: {
        'Authorization': this.authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Configurações adicionais para melhor compatibilidade
      validateStatus: (status) => status >= 200 && status < 500, // Aceita até 4xx para tratamento manual
    });

    // Interceptor para logging (apenas em desenvolvimento)
    if (config.nodeEnv === 'development') {
      this.client.interceptors.request.use((request) => {
        console.log(`[RM Service] ${request.method?.toUpperCase()} ${request.url}`);
        return request;
      });
    }
  }

  constructor() {
    // Inicializa vazio - configure() será chamado antes do uso
    // Isso permite usar configurações do banco ou env dinamicamente
  }

  /**
   * Executa uma consulta SQL no RM
   * 
   * @param queryParams - Parâmetros da consulta
   * @param userId - ID do usuário (opcional, para buscar config do banco)
   * @param testConfig - Configuração de teste (opcional)
   * @returns Resposta padronizada com os dados
   * 
   * @example
   * const result = await rmService.executeQuery({
   *   codSentenca: '1.01',
   *   codColigada: 1,
   *   codSistema: 'A',
   *   params: { CODCOLIGADA: 1, IDPS: 25 }
   * }, userId);
   */
  async executeQuery(
    queryParams: RmQueryParams,
    userId?: string,
    testConfig?: { baseUrl: string; username: string; password: string }
  ): Promise<RmApiResponse> {
    const startTime = Date.now();

    // Configura o serviço se necessário
    if (!this.client || userId !== this.userId) {
      await this.configure(userId, testConfig);
    }

    try {
      // Valida parâmetros obrigatórios (codColigada pode ser 0)
      if (!queryParams.codSentenca || queryParams.codSentenca.trim() === '') {
        throw new Error('codSentenca é obrigatório');
      }
      if (queryParams.codColigada === null || queryParams.codColigada === undefined || queryParams.codColigada === '') {
        throw new Error('codColigada é obrigatório');
      }
      if (!queryParams.codSistema || queryParams.codSistema.trim() === '') {
        throw new Error('codSistema é obrigatório');
      }

      // Monta a URL do endpoint oficial do RM
      // Formato conforme documentação TOTVS: /api/framework/v1/consultaSQLServer/RealizaConsulta/{CODIGO}/{COLIGADA}/{SISTEMA}
      const consultaPath = '/api/framework/v1/consultaSQLServer/RealizaConsulta';
      const basePath = `${queryParams.codSentenca}/${queryParams.codColigada}/${queryParams.codSistema}`;
      const endpoint = `${consultaPath}/${basePath}`;
      
      // Monta query string com parâmetros SQL (se houver)
      // Formato: ?parameters=PARAM1=valor1;PARAM2=valor2 (conforme documentação)
      const queryString = queryParams.params ? buildRmQueryString(queryParams.params) : '';
      const fullUrl = `${endpoint}${queryString}`;

      // Verifica se o client foi configurado
      if (!this.client) {
        throw new Error('Serviço RM não configurado');
      }

      // Log da URL completa (apenas em desenvolvimento, sem credenciais)
      if (config.nodeEnv === 'development') {
        console.log(`[RM Service] Executando consulta: ${fullUrl}`);
        console.log(`[RM Service] Base URL: ${this.baseUrl}`);
      }

      // Executa a requisição HTTP
      const response = await this.client.get(fullUrl);

      const executionTime = Date.now() - startTime;

      // Extrai os dados da resposta (pode vir em diferentes formatos conforme documentação TOTVS)
      const extractedData = this.extractResponseData(response.data);

      // Log do resultado (apenas em desenvolvimento)
      if (config.nodeEnv === 'development') {
        console.log(`[RM Service] Consulta executada com sucesso. ${extractedData.length} registro(s) retornado(s).`);
      }

      // Retorna resposta padronizada
      return {
        success: true,
        data: extractedData,
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return this.handleError(error, executionTime);
    }
  }

  /**
   * Extrai os dados da resposta do TOTVS RM
   * A resposta pode vir em diferentes formatos conforme documentação oficial
   * 
   * @param data - Dados brutos da resposta
   * @returns Array de registros
   */
  private extractResponseData(data: any): any[] {
    // 1. Array direto
    if (Array.isArray(data)) {
      return data;
    }

    // 2. Objeto com propriedade 'dados'
    if (data && typeof data === 'object' && data.dados && Array.isArray(data.dados)) {
      return data.dados;
    }

    // 3. Objeto com propriedade 'data'
    if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
      return data.data;
    }

    // 4. Objeto com propriedade 'records'
    if (data && typeof data === 'object' && data.records && Array.isArray(data.records)) {
      return data.records;
    }

    // 5. Objeto único (envolver em array)
    if (data && typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Verifica se não é um objeto de erro
      if (data.error || data.message) {
        return [];
      }
      return [data];
    }

    // 6. Nenhum dado ou formato desconhecido
    return [];
  }

  /**
   * Trata erros da requisição ao RM
   * 
   * @param error - Erro capturado
   * @param executionTime - Tempo de execução até o erro
   * @returns Resposta de erro padronizada
   */
  private handleError(error: unknown, executionTime: number): RmApiResponse {
    // Erro do Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Erro de autenticação (conforme documentação TOTVS)
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        const isAuth = axiosError.response?.status === 401;
        return {
          success: false,
          executionTimeMs: executionTime,
          error: {
            message: isAuth 
              ? 'Credenciais inválidas ou ausentes para acessar o RM'
              : 'Sem permissão para executar esta consulta SQL',
            status: axiosError.response?.status,
            code: isAuth ? 'UNAUTHORIZED' : 'FORBIDDEN',
          },
        };
      }

      // Erro de recurso não encontrado
      if (axiosError.response?.status === 404) {
        return {
          success: false,
          executionTimeMs: executionTime,
          error: {
            message: 'Consulta SQL não encontrada no RM',
            status: 404,
            code: 'NOT_FOUND',
          },
        };
      }

      // Erro de validação (bad request)
      if (axiosError.response?.status === 400) {
        return {
          success: false,
          executionTimeMs: executionTime,
          error: {
            message: axiosError.response?.data?.message || 'Parâmetros inválidos para a consulta SQL',
            status: 400,
            code: 'BAD_REQUEST',
          },
        };
      }

      // Erro do servidor RM
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return {
          success: false,
          executionTimeMs: executionTime,
          error: {
            message: 'Erro interno no servidor RM',
            status: axiosError.response.status,
            code: 'RM_SERVER_ERROR',
          },
        };
      }

      // Erro de timeout
      if (axiosError.code === 'ECONNABORTED') {
        return {
          success: false,
          executionTimeMs: executionTime,
          error: {
            message: 'Timeout ao conectar com o RM. Tente novamente.',
            status: 408,
            code: 'TIMEOUT',
          },
        };
      }

      // Erro de conexão
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        return {
          success: false,
          executionTimeMs: executionTime,
          error: {
            message: 'Não foi possível conectar ao servidor RM. Verifique a URL e a conectividade.',
            status: 503,
            code: 'CONNECTION_ERROR',
          },
        };
      }

      // Outros erros do Axios
      return {
        success: false,
        executionTimeMs: executionTime,
        error: {
          message: axiosError.message || 'Erro ao executar consulta SQL no RM',
          status: axiosError.response?.status,
          code: 'RM_API_ERROR',
        },
      };
    }

    // Erro de validação (lançado pelo validateQueryParams)
    if (error instanceof Error) {
      return {
        success: false,
        executionTimeMs: executionTime,
        error: {
          message: error.message,
          status: 400,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Erro desconhecido
    return {
      success: false,
      executionTimeMs: executionTime,
      error: {
        message: 'Erro desconhecido ao executar consulta SQL',
        status: 500,
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// Exporta instância singleton do serviço
export const rmService = new RmService();
