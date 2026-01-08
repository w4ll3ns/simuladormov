import { useState, useEffect } from 'react';
import { useRmConfig } from '@/hooks/useRmConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, TestTube, CheckCircle2, AlertCircle, Eye, EyeOff, Server } from 'lucide-react';
import { z } from 'zod';

const rmConfigSchema = z.object({
  rm_base_url: z
    .string()
    .trim()
    .min(1, 'URL base é obrigatória')
    .url('URL inválida')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL deve começar com http:// ou https://'
    ),
  rm_username: z.string().trim().min(1, 'Usuário é obrigatório'),
  rm_password: z.string().min(1, 'Senha é obrigatória'),
});

export default function RmConfig() {
  const { config, isLoading, saveConfig, testConnection, error: configError } = useRmConfig();
  const [formData, setFormData] = useState({
    rm_base_url: '',
    rm_username: '',
    rm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasLoadedConfig, setHasLoadedConfig] = useState(false);

  // Carrega configurações quando disponíveis (apenas uma vez no início)
  useEffect(() => {
    // Se ainda não carregou e não está mais carregando
    if (!hasLoadedConfig && !isLoading) {
      // Verifica se há configurações para carregar
      if (config && (config.rm_base_url || config.rm_username || config.rm_password)) {
        setFormData((prevData) => {
          // Só atualiza se os campos ainda estiverem vazios (primeira carga)
          // Isso evita resetar campos que o usuário já preencheu
          const isFormEmpty = !prevData.rm_base_url && !prevData.rm_username && !prevData.rm_password;
          
          if (isFormEmpty) {
            return {
              rm_base_url: config.rm_base_url || '',
              rm_username: config.rm_username || '',
              rm_password: config.rm_password || '',
            };
          }
          
          return prevData; // Mantém o que o usuário já digitou
        });
      }
      // Marca como carregado independente de ter dados ou não
      // Isso permite que o usuário preencha os campos mesmo sem configurações salvas
      setHasLoadedConfig(true);
    }
  }, [hasLoadedConfig, isLoading, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setTestResult(null);

    // Valida formulário
    const result = rmConfigSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await saveConfig.mutateAsync(result.data);
      // Reseta flag para permitir recarregar após salvar
      setHasLoadedConfig(false);
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  const handleTest = async () => {
    setErrors({});
    setTestResult(null);

    // Valida antes de testar
    const result = rmConfigSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setTestResult({
        success: false,
        message: 'Preencha todos os campos corretamente antes de testar',
      });
      return;
    }

    try {
      await testConnection.mutateAsync(result.data);
      setTestResult({
        success: true,
        message: 'Conexão testada com sucesso! As configurações estão corretas.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao testar conexão',
      });
    }
  };

  // Mostra loading apenas no primeiro carregamento
  // Não bloqueia o formulário para permitir preenchimento
  const isInitialLoading = isLoading && !hasLoadedConfig;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações TOTVS RM</h1>
        <p className="text-muted-foreground">
          Configure as credenciais e URL do servidor TOTVS RM para integração
        </p>
      </div>

      {/* Alert Informativo */}
      <Alert>
        <Server className="h-4 w-4" />
        <AlertTitle>Configuração de Integração</AlertTitle>
        <AlertDescription>
          Configure as credenciais de acesso ao servidor TOTVS RM. Essas configurações são
          armazenadas de forma segura e são específicas para sua conta.
          {configError && (
            <span className="block mt-2 text-xs text-muted-foreground">
              ⚠️ Nota: Se a tabela de configurações ainda não foi criada, você ainda pode preencher e salvar os campos abaixo.
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Loading inicial */}
      {isInitialLoading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando configurações...</span>
        </div>
      )}

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Credenciais de Acesso</CardTitle>
          <CardDescription>
            Informe a URL base do servidor RM e suas credenciais de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Base */}
            <div className="space-y-2">
              <Label htmlFor="rm_base_url">
                URL Base do Servidor RM *
              </Label>
              <Input
                id="rm_base_url"
                type="text"
                placeholder="https://rm.seudominio.com.br:8051"
                value={formData.rm_base_url}
                onChange={(e) =>
                  setFormData({ ...formData, rm_base_url: e.target.value })
                }
                className={errors.rm_base_url ? 'border-destructive' : ''}
              />
              {errors.rm_base_url && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.rm_base_url}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                URL completa do servidor RM (ex: https://rm.empresa.com.br:8051)
              </p>
            </div>

            {/* Usuário */}
            <div className="space-y-2">
              <Label htmlFor="rm_username">
                Usuário RM *
              </Label>
              <Input
                id="rm_username"
                type="text"
                placeholder="seu_usuario_rm"
                value={formData.rm_username}
                onChange={(e) =>
                  setFormData({ ...formData, rm_username: e.target.value })
                }
                className={errors.rm_username ? 'border-destructive' : ''}
              />
              {errors.rm_username && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.rm_username}
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="rm_password">
                Senha RM *
              </Label>
              <div className="relative">
                <Input
                  id="rm_password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.rm_password}
                  onChange={(e) =>
                    setFormData({ ...formData, rm_password: e.target.value })
                  }
                  className={errors.rm_password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.rm_password && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.rm_password}
                </p>
              )}
            </div>

            {/* Resultado do Teste */}
            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {testResult.success ? 'Teste Bem-sucedido' : 'Erro no Teste'}
                </AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={saveConfig.isPending || testConnection.isPending}
              >
                {testConnection.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
              <Button
                type="submit"
                disabled={saveConfig.isPending || testConnection.isPending}
              >
                {saveConfig.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
