/**
 * Utilitários para formatação e manipulação de valores monetários
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um valor numérico como moeda brasileira com sinal (+ ou -)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com sinal (ex: "+R$ 1.234,56" ou "-R$ 1.234,56")
 */
export function formatCurrencyWithSign(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return prefix + formatCurrency(value);
}

/**
 * Formata um valor numérico de forma compacta (ex: "1,2K", "1,5M")
 * @param value - Valor numérico a ser formatado
 * @returns String formatada de forma compacta
 */
export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Hook-like function para obter um formatador de moeda (para uso em componentes)
 * Retorna uma função memoizada para melhor performance
 */
export function createCurrencyFormatter() {
  return formatCurrency;
}
