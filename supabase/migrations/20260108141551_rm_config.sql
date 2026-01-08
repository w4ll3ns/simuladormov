-- Tabela de configurações do sistema
CREATE TABLE public.configuracoes (
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

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para melhor performance
CREATE INDEX idx_configuracoes_user_id ON public.configuracoes(user_id);
CREATE INDEX idx_configuracoes_categoria ON public.configuracoes(categoria);
CREATE INDEX idx_configuracoes_chave ON public.configuracoes(chave);

-- Comentários para documentação
COMMENT ON TABLE public.configuracoes IS 'Armazena configurações do sistema por usuário';
COMMENT ON COLUMN public.configuracoes.chave IS 'Chave única da configuração (ex: rm_base_url)';
COMMENT ON COLUMN public.configuracoes.valor IS 'Valor da configuração (podem conter dados sensíveis, criptografar em produção)';
COMMENT ON COLUMN public.configuracoes.categoria IS 'Categoria da configuração (ex: rm, sistema, integracao)';
