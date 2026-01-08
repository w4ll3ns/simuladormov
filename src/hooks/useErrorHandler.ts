import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Tipos de erro padronizados
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Interface para erros padronizados
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error | unknown;
}

/**
 * Hook para tratamento padronizado de erros
 * 
 * @example
 * const { handleError } = useErrorHandler();
 * 
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   handleError(error);
 * }
 */
export function useErrorHandler() {
  /**
   * Trata erros de forma padronizada, exibindo mensagens apropriadas ao usuário
   */
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    let errorMessage = customMessage;
    let errorType = ErrorType.UNKNOWN;

    // Se já é um AppError, usa diretamente
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      const appError = error as AppError;
      errorMessage = appError.message;
      errorType = appError.type;
    }
    // Se é um Error do JavaScript
    else if (error instanceof Error) {
      errorMessage = error.message;
      
      // Identifica tipo de erro baseado na mensagem
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorType = ErrorType.NETWORK;
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorType = ErrorType.AUTH;
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (error.message.includes('User already registered')) {
        errorType = ErrorType.VALIDATION;
        errorMessage = 'Este e-mail já está cadastrado.';
      } else if (error.message.includes('23505')) {
        // PostgreSQL unique constraint violation
        errorType = ErrorType.VALIDATION;
        if (error.message.includes('chapa')) {
          errorMessage = 'Já existe um colaborador com esta CHAPA.';
        } else {
          errorMessage = 'Este registro já existe no sistema.';
        }
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        errorType = ErrorType.NOT_FOUND;
        errorMessage = 'Registro não encontrado.';
      } else if (error.message.includes('permission') || error.message.includes('403')) {
        errorType = ErrorType.PERMISSION;
        errorMessage = 'Você não tem permissão para realizar esta ação.';
      }
    }
    // Se é uma string
    else if (typeof error === 'string') {
      errorMessage = error;
    }
    // Fallback para erro desconhecido
    else {
      errorMessage = errorMessage || 'Ocorreu um erro inesperado. Tente novamente.';
    }

    // Exibe toast de erro
    toast.error(errorMessage);

    // Log do erro completo para debugging (apenas em desenvolvimento)
    if (import.meta.env.DEV && error) {
      console.error('Error handled:', {
        type: errorType,
        message: errorMessage,
        original: error,
      });
    }

    return {
      type: errorType,
      message: errorMessage,
      originalError: error,
    };
  }, []);

  /**
   * Trata erros de validação especificamente
   */
  const handleValidationError = useCallback(
    (error: unknown, fieldName?: string) => {
      let message = 'Dados inválidos. Verifique os campos e tente novamente.';

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      if (fieldName) {
        message = `${fieldName}: ${message}`;
      }

      toast.error(message);
    },
    []
  );

  /**
   * Trata erros de rede especificamente
   */
  const handleNetworkError = useCallback(() => {
    toast.error('Erro de conexão. Verifique sua internet e tente novamente.', {
      duration: 5000,
    });
  }, []);

  return {
    handleError,
    handleValidationError,
    handleNetworkError,
  };
}
