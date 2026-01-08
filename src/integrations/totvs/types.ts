/**
 * Tipos TypeScript para integração com TOTVS RM
 */

/**
 * Configurações completas do TOTVS
 */
export interface TotvsConfig {
  baseUrl: string;
  username: string;
  password: string;
  codigoConsulta: string;
  coligada: string | number;
  sistema: string;
  parametros?: string; // JSON string do array de TotvsParametro
  timeout?: number;
  retries?: number;
}

/**
 * Parâmetros para consulta TOTVS
 */
export interface TotvsConsultaParams {
  [key: string]: string | number;
}

/**
 * Estrutura de um parâmetro dinâmico
 */
export interface TotvsParametro {
  id: string;
  nome: string;
  valor: string;
  ativo: boolean;
}

/**
 * Converte array de parâmetros dinâmicos para objeto TotvsConsultaParams
 */
export function parseParametrosArray(parametros: TotvsParametro[]): TotvsConsultaParams {
  const params: TotvsConsultaParams = {};
  
  for (const param of parametros) {
    if (param.ativo && param.nome.trim() && param.valor.trim()) {
      const nome = param.nome.trim();
      const valor = param.valor.trim();
      
      // Sempre manter como string para preservar zeros à esquerda (ex: 004071)
      // O TOTVS espera strings nos parâmetros da query string
      params[nome] = valor;
    }
  }
  
  return params;
}

/**
 * Converte string de parâmetros no formato "CHAVE=VALOR;CHAVE2=VALOR2" para objeto
 * (mantido para compatibilidade)
 */
export function parseParametrosString(parametrosString?: string): TotvsConsultaParams {
  if (!parametrosString || parametrosString.trim() === '') {
    return {};
  }

  const params: TotvsConsultaParams = {};
  const pairs = parametrosString.split(';');

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('='); // Permite valores com "="
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();
      
      // Sempre manter como string para preservar zeros à esquerda (ex: 004071)
      // O TOTVS espera strings nos parâmetros
      params[trimmedKey] = trimmedValue;
    }
  }

  return params;
}

/**
 * Estrutura da resposta do TOTVS para colaboradores
 */
export interface TotvsColaboradorResponse {
  CODCOLIGADA_CHEFE?: number;
  CHAPA_CHEFE?: string;
  NOME_CHEFE?: string;
  FUNCAO_CHEFE?: string;
  CODCOLIGADA_FUNC: number;
  CHAPA_FUNC: string;
  NOME_FUNC: string;
  SALARIO_FUNC: number;
  SECAO_FUNC?: string;
  FUNCAO_FUNC: string;
}

/**
 * Tipos de erro específicos do TOTVS
 */
export class TotvsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'TotvsError';
  }
}

export class TotvsAuthError extends TotvsError {
  constructor(message: string = 'Falha de autenticação no TOTVS') {
    super(message, 401);
    this.name = 'TotvsAuthError';
  }
}

export class TotvsConnectionError extends TotvsError {
  constructor(message: string = 'Erro de conexão com TOTVS') {
    super(message);
    this.name = 'TotvsConnectionError';
  }
}

export class TotvsTimeoutError extends TotvsError {
  constructor(timeout: number) {
    super(`Timeout após ${timeout}ms`, 408);
    this.name = 'TotvsTimeoutError';
  }
}

