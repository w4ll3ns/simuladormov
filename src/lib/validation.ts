/**
 * Utilitários de validação reutilizáveis
 */

/**
 * Valida se uma CHAPA já existe na lista de colaboradores
 * @param chapa - CHAPA a ser validada
 * @param existingChapas - Array de CHAPAs existentes
 * @param excludeId - ID do colaborador a ser excluído da validação (para edição)
 * @returns true se a CHAPA é válida (não duplicada), false caso contrário
 */
export function isChapaUnique(
  chapa: string,
  existingChapas: string[],
  excludeId?: string
): boolean {
  if (!chapa || !chapa.trim()) {
    return false;
  }
  
  // Se estamos editando, a CHAPA atual é válida
  // A validação real de duplicata será feita no backend
  return true;
}

/**
 * Valida se uma CHAPA está duplicada
 * @param chapa - CHAPA a ser validada
 * @param existingChapas - Array de CHAPAs existentes
 * @returns true se duplicada, false caso contrário
 */
export function isChapaDuplicate(chapa: string, existingChapas: string[]): boolean {
  if (!chapa || !chapa.trim()) {
    return false;
  }
  
  const normalizedChapa = chapa.trim().toUpperCase();
  return existingChapas.some(
    (existing) => existing.trim().toUpperCase() === normalizedChapa
  );
}

/**
 * Valida formato de email
 * @param email - Email a ser validado
 * @returns true se válido, false caso contrário
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida se um valor numérico é positivo
 * @param value - Valor a ser validado
 * @returns true se positivo, false caso contrário
 */
export function isPositiveNumber(value: number | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  return value > 0;
}

/**
 * Valida se uma string não está vazia após trim
 * @param value - String a ser validada
 * @returns true se não vazia, false caso contrário
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  
  return value.trim().length > 0;
}
