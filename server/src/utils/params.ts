/**
 * Utilitários para formatação de parâmetros SQL do RM
 */

/**
 * Converte um objeto de parâmetros para o formato exigido pelo RM
 * Formato: PARAM1=VALOR1;PARAM2=VALOR2
 * 
 * @param params - Objeto com os parâmetros (ex: { CODCOLIGADA: 1, IDPS: 25 })
 * @returns String formatada e URL encoded (ex: CODCOLIGADA=1;IDPS=25)
 * 
 * @example
 * formatRmParameters({ CODCOLIGADA: 1, IDPS: 25 })
 * // Retorna: "CODCOLIGADA=1;IDPS=25"
 */
export function formatRmParameters(params: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const pairs = Object.entries(params).map(([key, value]) => {
    // Garante que o valor seja uma string
    // IMPORTANTE: Não faz trim para preservar zeros à esquerda (ex: CHAPA=004071)
    const stringValue = String(value);
    
    // Formata como PARAM=VALOR
    return `${key}=${stringValue}`;
  });

  // Junta todos os pares com ponto e vírgula
  return pairs.join(';');
}

/**
 * Converte parâmetros para query string URL encoded
 * 
 * @param params - Objeto com os parâmetros
 * @returns Query string no formato ?parameters=PARAM1=VALOR1;PARAM2=VALOR2
 */
export function buildRmQueryString(params: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const formattedParams = formatRmParameters(params);
  
  // URL encode o resultado final
  // Formato conforme documentação TOTVS: ?parameters=PARAM1=valor1;PARAM2=valor2
  return `?parameters=${encodeURIComponent(formattedParams)}`;
}

/**
 * Valida se os parâmetros obrigatórios da consulta estão presentes
 * 
 * @param codSentenca - Código da sentença SQL
 * @param codColigada - Código da coligada
 * @param codSistema - Código do sistema
 */
export function validateQueryParams(
  codSentenca: string | undefined,
  codColigada: string | number | undefined,
  codSistema: string | undefined
): void {
  if (!codSentenca || codSentenca.trim() === '') {
    throw new Error('codSentenca é obrigatório');
  }

  // codColigada pode ser 0, então verifica se é null/undefined
  if (codColigada === null || codColigada === undefined || codColigada === '') {
    throw new Error('codColigada é obrigatório');
  }

  if (!codSistema || codSistema.trim() === '') {
    throw new Error('codSistema é obrigatório');
  }
}
