import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global para tratamento de erros não capturados
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler] Erro não tratado:', err);

  res.status(500).json({
    success: false,
    error: {
      message: 'Erro interno do servidor',
      status: 500,
      code: 'INTERNAL_ERROR',
    },
  });
}

/**
 * Middleware para capturar rotas não encontradas (404)
 */
export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Rota não encontrada',
      status: 404,
      code: 'NOT_FOUND',
    },
  });
}
