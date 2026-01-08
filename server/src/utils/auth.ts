/**
 * Utilitários para autenticação Basic Auth
 */

/**
 * Gera o header de autorização Basic Auth
 * @param username - Nome de usuário
 * @param password - Senha
 * @returns String do header Authorization
 */
export function generateBasicAuthHeader(username: string, password: string): string {
  if (!username || !password) {
    throw new Error('Username e password são obrigatórios para Basic Auth');
  }

  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials).toString('base64');
  
  return `Basic ${encoded}`;
}

/**
 * Gera o token Basic Auth (apenas a parte do base64, sem "Basic")
 * @param username - Nome de usuário
 * @param password - Senha
 * @returns String base64 do token
 */
export function generateBasicAuthToken(username: string, password: string): string {
  if (!username || !password) {
    throw new Error('Username e password são obrigatórios para Basic Auth');
  }

  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString('base64');
}
