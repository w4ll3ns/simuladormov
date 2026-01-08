-- ============================================
-- MIGRATION: Criar tabela configuracoes
-- ============================================
-- Execute este script no Supabase SQL Editor
-- Acesse: https://app.supabase.com/project/[SEU_PROJETO]/sql/new
-- ============================================

-- Verifica se a função update_updated_at_column já existe
-- Se não existir, cria ela primeiro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria a tabela de configurações (se não existir)
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'sistema',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chave)
);

-- Enable RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Users can view own configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can insert own configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can update own configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Users can delete own configuracoes" ON public.configuracoes;

-- Políticas RLS para configurações
CREATE POLICY "Users can view own configuracoes"
  ON public.configuracoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configuracoes"
  ON public.configuracoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configuracoes"
  ON public.configuracoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configuracoes"
  ON public.configuracoes FOR DELETE
  USING (auth.uid() = user_id);

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON public.configuracoes;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Remove índices antigos se existirem
DROP INDEX IF EXISTS idx_configuracoes_user_id;
DROP INDEX IF EXISTS idx_configuracoes_categoria;
DROP INDEX IF EXISTS idx_configuracoes_chave;

-- Índices para melhor performance
CREATE INDEX idx_configuracoes_user_id ON public.configuracoes(user_id);
CREATE INDEX idx_configuracoes_categoria ON public.configuracoes(categoria);
CREATE INDEX idx_configuracoes_chave ON public.configuracoes(chave);

-- Comentários para documentação
COMMENT ON TABLE public.configuracoes IS 'Armazena configurações do sistema por usuário';
COMMENT ON COLUMN public.configuracoes.chave IS 'Chave única da configuração (ex: rm_base_url)';
COMMENT ON COLUMN public.configuracoes.valor IS 'Valor da configuração (podem conter dados sensíveis, criptografar em produção)';
COMMENT ON COLUMN public.configuracoes.categoria IS 'Categoria da configuração (ex: rm, sistema, integracao)';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
-- Após executar, verifique se a tabela foi criada:
-- SELECT * FROM public.configuracoes LIMIT 1;
-- ============================================
