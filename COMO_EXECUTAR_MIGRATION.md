# 📋 Como Executar a Migration da Tabela configuracoes

## ❌ Problema

Ao tentar salvar as configurações do RM, você recebeu o erro:

```
POST https://mbnivudvtjeupqissmsn.supabase.co/rest/v1/configuracoes 404 (Not Found)
```

Isso significa que a tabela `configuracoes` não existe no banco de dados Supabase.

## ✅ Solução

Execute a migration SQL no Supabase para criar a tabela.

### **Passo 1: Acesse o Supabase SQL Editor**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New query"**

### **Passo 2: Execute o Script SQL**

1. Abra o arquivo `EXECUTAR_MIGRATION_CONFIGURACOES.sql` neste projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

### **Passo 3: Verifique se Funcionou**

Execute esta query para verificar:

```sql
SELECT * FROM public.configuracoes LIMIT 1;
```

Se não der erro, a tabela foi criada com sucesso! 🎉

## 📝 O Que o Script Faz

1. ✅ Cria a função `update_updated_at_column` (se não existir)
2. ✅ Cria a tabela `configuracoes` com todas as colunas necessárias
3. ✅ Ativa Row Level Security (RLS)
4. ✅ Cria políticas de segurança (cada usuário só vê suas próprias configurações)
5. ✅ Cria trigger para atualizar `updated_at` automaticamente
6. ✅ Cria índices para melhor performance

## 🔐 Segurança

As políticas RLS garantem que:
- Cada usuário só pode ver suas próprias configurações
- Cada usuário só pode criar/editar/deletar suas próprias configurações
- As configurações são isoladas por `user_id`

## 🧪 Teste Após Executar

Após executar a migration:

1. Volte para a página `/config/rm` no sistema
2. Preencha os campos:
   - URL Base: `http://lares.ceuma.edu.br:8051`
   - Usuário: (seu usuário RM)
   - Senha: (sua senha RM)
3. Clique em **"Salvar Configurações"**

Agora deve funcionar sem erros! ✅

## ⚠️ Se Ainda Der Erro

Se ainda der erro após executar a migration:

1. Verifique se você está logado no sistema
2. Verifique se a tabela foi criada:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'configuracoes';
   ```
3. Verifique se as políticas RLS foram criadas:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'configuracoes';
   ```

## 📞 Suporte

Se precisar de ajuda, verifique:
- Logs do console do navegador (F12)
- Logs do Supabase (Dashboard > Logs)
- Erros no backend (se houver)
