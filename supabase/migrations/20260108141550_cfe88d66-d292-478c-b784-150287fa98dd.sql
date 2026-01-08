-- Criação do tipo enum para tipo de movimentação
CREATE TYPE public.tipo_movimentacao AS ENUM ('promocao', 'lateral', 'reajuste');

-- Criação do tipo enum para tipo de evento
CREATE TYPE public.tipo_evento AS ENUM ('saida_inicial', 'substituicao_interna', 'nova_contratacao', 'fim_sem_reposicao');

-- Criação do tipo enum para status da simulação
CREATE TYPE public.status_simulacao AS ENUM ('rascunho', 'finalizada');

-- Criação do tipo enum para motivo de saída
CREATE TYPE public.motivo_saida AS ENUM ('demissao', 'desligamento', 'aposentadoria', 'transferencia', 'outro');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de colaboradores
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapa TEXT NOT NULL,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  salario DECIMAL(12,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapa)
);

-- Tabela de simulações
CREATE TABLE public.simulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  status public.status_simulacao NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentações (cadeia de substituições)
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulacao_id UUID NOT NULL REFERENCES public.simulacoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  tipo_evento public.tipo_evento NOT NULL,
  
  -- Dados do colaborador que está saindo da vaga
  colaborador_origem_id UUID REFERENCES public.colaboradores(id),
  colaborador_origem_snapshot JSONB, -- Snapshot dos dados no momento da simulação
  
  -- Dados do colaborador que vai ocupar a vaga (para substituição interna)
  colaborador_destino_id UUID REFERENCES public.colaboradores(id),
  colaborador_destino_snapshot JSONB, -- Snapshot dos dados no momento da simulação
  
  -- Dados da nova posição
  nova_funcao TEXT,
  novo_salario DECIMAL(12,2),
  tipo_movimentacao public.tipo_movimentacao,
  
  -- Para nova contratação
  funcao_nova_vaga TEXT,
  salario_nova_vaga DECIMAL(12,2),
  
  -- Motivo da saída (apenas para saída inicial)
  motivo_saida public.motivo_saida,
  
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de versões das simulações
CREATE TABLE public.simulacoes_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulacao_id UUID NOT NULL REFERENCES public.simulacoes(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  dados_snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulacoes_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para colaboradores
CREATE POLICY "Users can view own colaboradores"
  ON public.colaboradores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own colaboradores"
  ON public.colaboradores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own colaboradores"
  ON public.colaboradores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own colaboradores"
  ON public.colaboradores FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para simulações
CREATE POLICY "Users can view own simulacoes"
  ON public.simulacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulacoes"
  ON public.simulacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulacoes"
  ON public.simulacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulacoes"
  ON public.simulacoes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para movimentações (via simulação)
CREATE POLICY "Users can view own movimentacoes"
  ON public.movimentacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulacoes s
      WHERE s.id = movimentacoes.simulacao_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own movimentacoes"
  ON public.movimentacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.simulacoes s
      WHERE s.id = movimentacoes.simulacao_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own movimentacoes"
  ON public.movimentacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.simulacoes s
      WHERE s.id = movimentacoes.simulacao_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own movimentacoes"
  ON public.movimentacoes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.simulacoes s
      WHERE s.id = movimentacoes.simulacao_id
      AND s.user_id = auth.uid()
    )
  );

-- Políticas RLS para histórico de simulações
CREATE POLICY "Users can view own simulacoes_historico"
  ON public.simulacoes_historico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.simulacoes s
      WHERE s.id = simulacoes_historico.simulacao_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own simulacoes_historico"
  ON public.simulacoes_historico FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.simulacoes s
      WHERE s.id = simulacoes_historico.simulacao_id
      AND s.user_id = auth.uid()
    )
  );

-- Trigger para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_simulacoes_updated_at
  BEFORE UPDATE ON public.simulacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movimentacoes_updated_at
  BEFORE UPDATE ON public.movimentacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();