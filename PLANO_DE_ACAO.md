# Plano de Ação - Melhorias SimulaMov RH

## 🎯 Objetivo
Implementar melhorias críticas e importantes para aumentar a qualidade, manutenibilidade e escalabilidade do código.

---

## 📋 Fase 1: Melhorias Críticas (Alta Prioridade)

### 1.1 Criar Utilitários Centralizados
- [ ] Criar `src/lib/currency.ts` para formatação de moeda
- [ ] Criar `src/lib/validation.ts` para validações comuns
- [ ] Substituir todas as duplicações de formatação de moeda

### 1.2 Validação de CHAPA Duplicada no Frontend
- [ ] Criar componente `ChapaInput` com validação em tempo real
- [ ] Integrar validação no formulário de colaboradores
- [ ] Mostrar feedback visual antes do submit

### 1.3 Padronizar Tratamento de Erros
- [ ] Criar hook `useErrorHandler`
- [ ] Substituir todos os `alert()` por `toast()`
- [ ] Criar tipos de erro padronizados

### 1.4 Dividir Arquivos Longos
- [ ] Dividir `SimulacaoEdit.tsx`:
  - [ ] Extrair componente `SimulacaoWizard`
  - [ ] Extrair componente `ChainVisualization`
  - [ ] Extrair componente `SubstitutionDialog`
  - [ ] Criar hook `useSimulacaoWizard`
- [ ] Dividir `ImportColaboradoresDialog.tsx`:
  - [ ] Extrair componente `FileUploadStep`
  - [ ] Extrair componente `ColumnMappingStep`
  - [ ] Extrair componente `PreviewStep`

---

## 📋 Fase 2: Melhorias Importantes (Média Prioridade)

### 2.1 Melhorar TypeScript
- [ ] Habilitar `strictNullChecks` gradualmente
- [ ] Corrigir erros de tipo resultantes
- [ ] Adicionar tipos mais específicos onde necessário

### 2.2 Padronizar Formulários
- [ ] Converter todos os formulários para usar `react-hook-form`
- [ ] Criar componentes de formulário reutilizáveis
- [ ] Adicionar validação consistente

### 2.3 Adicionar Loading States
- [ ] Adicionar skeleton loaders
- [ ] Garantir feedback visual em todas as operações assíncronas
- [ ] Criar componente `LoadingButton` reutilizável

### 2.4 Melhorar Acessibilidade
- [ ] Adicionar atributos ARIA onde necessário
- [ ] Melhorar navegação por teclado
- [ ] Adicionar labels descritivos
- [ ] Testar com leitor de tela

---

## 📋 Fase 3: Melhorias Desejáveis (Baixa Prioridade)

### 3.1 Adicionar Testes
- [ ] Configurar Vitest + React Testing Library
- [ ] Adicionar testes para hooks
- [ ] Adicionar testes para componentes críticos
- [ ] Adicionar testes de integração

### 3.2 Otimizar Performance
- [ ] Implementar lazy loading de rotas
- [ ] Adicionar memoização onde necessário
- [ ] Otimizar queries do React Query
- [ ] Implementar virtual scrolling para listas grandes

### 3.3 Melhorar Documentação
- [ ] Criar documentação de arquitetura
- [ ] Documentar componentes principais
- [ ] Adicionar exemplos de uso
- [ ] Criar guia de contribuição

### 3.4 Adicionar Funcionalidades
- [ ] Implementar paginação
- [ ] Adicionar filtros avançados
- [ ] Melhorar exportação de dados
- [ ] Adicionar busca avançada

---

## 🛠️ Implementação Imediata

Vou começar implementando as melhorias da **Fase 1** que são críticas:

1. ✅ Criar utilitários centralizados
2. ✅ Validação de CHAPA no frontend
3. ✅ Padronizar tratamento de erros
4. ✅ Dividir arquivos longos (começando pelo mais crítico)

---

## 📊 Métricas de Sucesso

### Antes
- Arquivos > 500 linhas: 3
- Duplicação de código: ~15%
- Cobertura de testes: 0%
- Erros não tratados: vários

### Depois (Meta)
- Arquivos > 500 linhas: 0
- Duplicação de código: < 3%
- Cobertura de testes: > 50%
- Erros não tratados: 0

---

## ⏱️ Estimativa de Tempo

- **Fase 1:** 4-6 horas
- **Fase 2:** 6-8 horas
- **Fase 3:** 8-12 horas

**Total:** 18-26 horas

---

## 🚀 Próximo Passo

Vou começar implementando as melhorias da Fase 1. Posso começar agora?


