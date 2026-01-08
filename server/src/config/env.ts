import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Configuração das variáveis de ambiente do RM
 * Valida se todas as variáveis obrigatórias estão definidas
 */
export const config = {
  // Configurações do servidor
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Configurações do TOTVS RM
  rm: {
    baseUrl: process.env.RM_BASE_URL || '',
    username: process.env.RM_USERNAME || '',
    password: process.env.RM_PASSWORD || '',
  },
};

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * NOTA: As configurações podem vir do banco de dados, então essas validações são opcionais
 */
export function validateEnv(): void {
  // Valida apenas se as configurações estão presentes (mas não são obrigatórias se virem do banco)
  if (config.rm.baseUrl) {
    // Valida formato da URL base se fornecida
    try {
      new URL(config.rm.baseUrl);
    } catch {
      console.warn(`⚠️ RM_BASE_URL inválida nas variáveis de ambiente: ${config.rm.baseUrl}`);
    }
  }

  // Avisa se não há configurações nem no env nem no banco
  if (!config.rm.baseUrl && !process.env.SUPABASE_URL) {
    console.warn(
      '⚠️ Nenhuma configuração do RM encontrada. Configure no sistema ou nas variáveis de ambiente.'
    );
  }
}

export default config;
