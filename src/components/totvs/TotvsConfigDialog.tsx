/**
 * Dialog de configuração TOTVS (White Label)
 * Permite configurar todas as configurações do TOTVS via interface
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { loadTotvsConfig, saveTotvsConfig, validateTotvsConfig } from '@/integrations/totvs/config';
import { TotvsRestClient } from '@/integrations/totvs/client';
import { parseParametrosArray } from '@/integrations/totvs/types';
import type { TotvsConfig, TotvsParametro } from '@/integrations/totvs/types';

interface TotvsConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TotvsConfigDialog({ open, onOpenChange }: TotvsConfigDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<Partial<TotvsConfig>>({
    baseUrl: '',
    username: '',
    password: '',
    codigoConsulta: '',
    coligada: '',
    sistema: '',
    parametros: '',
    timeout: 30000,
    retries: 3,
  });
  const [parametros, setParametros] = useState<TotvsParametro[]>([]);

  // Carregar configurações existentes ao abrir o dialog
  useEffect(() => {
    if (open && user) {
      loadExistingConfig();
    }
  }, [open, user]);

  const loadExistingConfig = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const existingConfig = await loadTotvsConfig(user.id);
      if (existingConfig) {
        setConfig({
          ...existingConfig,
          // Não exibir senha salva (por segurança)
          password: '',
        });
        
        // Carregar parâmetros se existirem
        if (existingConfig.parametros) {
          try {
            const parametrosArray = JSON.parse(existingConfig.parametros) as TotvsParametro[];
            if (Array.isArray(parametrosArray)) {
              setParametros(parametrosArray);
            } else {
              setParametros([]);
            }
          } catch {
            setParametros([]);
          }
        } else {
          setParametros([]);
        }
      } else {
        // Resetar para valores padrão
        setConfig({
          baseUrl: '',
          username: '',
          password: '',
          codigoConsulta: '',
          coligada: '',
          sistema: '',
          parametros: '',
          timeout: 30000,
          retries: 3,
        });
        setParametros([]);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!user) return;

    // Validar campos obrigatórios
    const validation = validateTotvsConfig(config);
    if (!validation.valid) {
      toast.error(`Campos obrigatórios faltando: ${validation.missingFields.join(', ')}`);
      return;
    }

    // Verificar se senha foi informada ou se já existe configuração salva
    if (!config.password) {
      const existingConfig = await loadTotvsConfig(user.id);
      if (!existingConfig?.password) {
        toast.error('Senha é obrigatória para testar a conexão');
        return;
      }
      // Usar senha existente se não foi informada nova
      config.password = existingConfig.password;
    }

    setTesting(true);
    try {
      const testConfig: TotvsConfig = {
        baseUrl: config.baseUrl!,
        username: config.username!,
        password: config.password!,
        codigoConsulta: config.codigoConsulta!,
        coligada: config.coligada!,
        sistema: config.sistema!,
        parametros: JSON.stringify(parametros),
        timeout: config.timeout,
        retries: config.retries,
      };

      const client = new TotvsRestClient(testConfig);
      
      // Converter parâmetros para objeto
      const parametrosObj = parametros.length > 0 ? parseParametrosArray(parametros) : undefined;
      
      const result = await client.testConnection(parametrosObj);

      if (result.success) {
        toast.success('Conexão testada com sucesso!');
      } else {
        toast.error(`Erro ao testar conexão: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao testar conexão'
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validar campos obrigatórios
    const validation = validateTotvsConfig(config);
    if (!validation.valid) {
      toast.error(`Campos obrigatórios faltando: ${validation.missingFields.join(', ')}`);
      return;
    }

    // Se senha não foi informada, tentar usar a existente
    if (!config.password) {
      const existingConfig = await loadTotvsConfig(user.id);
      if (existingConfig?.password) {
        config.password = existingConfig.password;
      } else {
        toast.error('Senha é obrigatória');
        return;
      }
    }

    setLoading(true);
    try {
      const configToSave: TotvsConfig = {
        baseUrl: config.baseUrl!,
        username: config.username!,
        password: config.password!,
        codigoConsulta: config.codigoConsulta!,
        coligada: config.coligada!,
        sistema: config.sistema!,
        parametros: parametros.length > 0 ? JSON.stringify(parametros) : undefined,
        timeout: config.timeout,
        retries: config.retries,
      };

      const result = await saveTotvsConfig(user.id, configToSave);

      if (result.success) {
        toast.success('Configurações salvas com sucesso!');
        onOpenChange(false);
        // Limpar senha do estado após salvar
        setConfig((prev) => ({ ...prev, password: '' }));
      } else {
        toast.error(`Erro ao salvar: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar configurações'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações TOTVS</DialogTitle>
          <DialogDescription>
            Configure as credenciais e parâmetros de conexão com o TOTVS RM.
            Todas as configurações são específicas para sua conta.
          </DialogDescription>
        </DialogHeader>

        {loading && !config.baseUrl ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="baseUrl">
                Base URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://servidor-totvs.com.br"
                value={config.baseUrl || ''}
                onChange={(e) =>
                  setConfig({ ...config, baseUrl: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                Usuário <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="seu_usuario"
                value={config.username || ''}
                onChange={(e) =>
                  setConfig({ ...config, username: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Senha <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={config.password ? '••••••••' : 'sua_senha'}
                  value={config.password || ''}
                  onChange={(e) =>
                    setConfig({ ...config, password: e.target.value })
                  }
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para manter a senha atual
              </p>
            </div>

            {/* Código da Consulta */}
            <div className="space-y-2">
              <Label htmlFor="codigoConsulta">
                Código da Consulta (CODSENTECA) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codigoConsulta"
                type="text"
                placeholder="COLABORADORES"
                value={config.codigoConsulta || ''}
                onChange={(e) =>
                  setConfig({ ...config, codigoConsulta: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Coligada e Sistema */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coligada">
                  Coligada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coligada"
                  type="text"
                  placeholder="0"
                  value={config.coligada || ''}
                  onChange={(e) =>
                    setConfig({ ...config, coligada: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sistema">
                  Sistema <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sistema"
                  type="text"
                  placeholder="S"
                  value={config.sistema || ''}
                  onChange={(e) =>
                    setConfig({ ...config, sistema: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {/* Parâmetros Dinâmicos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Parâmetros Dinâmicos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const novoParametro: TotvsParametro = {
                      id: `param-${Date.now()}-${Math.random()}`,
                      nome: '',
                      valor: '',
                      ativo: true,
                    };
                    setParametros([...parametros, novoParametro]);
                  }}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Parâmetro
                </Button>
              </div>

              {parametros.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum parâmetro adicionado. Clique em "Adicionar Parâmetro" para começar.
                </p>
              ) : (
                <div className="space-y-3 border rounded-lg p-4">
                  {parametros.map((param, index) => (
                    <div
                      key={param.id}
                      className="grid grid-cols-12 gap-3 items-end p-3 bg-muted/50 rounded-md"
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Label htmlFor={`param-nome-${param.id}`} className="text-xs">
                          Nome do Parâmetro *
                        </Label>
                        <Input
                          id={`param-nome-${param.id}`}
                          placeholder="Ex: CODCOLIGADA"
                          value={param.nome}
                          onChange={(e) => {
                            const novosParametros = [...parametros];
                            novosParametros[index].nome = e.target.value;
                            setParametros(novosParametros);
                          }}
                          disabled={loading}
                        />
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Label htmlFor={`param-valor-${param.id}`} className="text-xs">
                          Valor *
                        </Label>
                        <Input
                          id={`param-valor-${param.id}`}
                          placeholder="Ex: 1"
                          value={param.valor}
                          onChange={(e) => {
                            const novosParametros = [...parametros];
                            novosParametros[index].valor = e.target.value;
                            setParametros(novosParametros);
                          }}
                          disabled={loading}
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Switch
                          checked={param.ativo}
                          onCheckedChange={(checked) => {
                            const novosParametros = [...parametros];
                            novosParametros[index].ativo = checked;
                            setParametros(novosParametros);
                          }}
                          disabled={loading}
                        />
                        <span className="text-xs text-muted-foreground">
                          {param.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setParametros(parametros.filter((p) => p.id !== param.id));
                          }}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeout e Retries */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  placeholder="30000"
                  value={config.timeout || 30000}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      timeout: parseInt(e.target.value, 10) || 30000,
                    })
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retries">Número de Tentativas</Label>
                <Input
                  id="retries"
                  type="number"
                  placeholder="3"
                  value={config.retries || 3}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      retries: parseInt(e.target.value, 10) || 3,
                    })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={loading || testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || testing}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || testing}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

