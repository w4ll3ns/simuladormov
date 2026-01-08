import { useState } from 'react';
import { useColaboradores, Colaborador } from '@/hooks/useColaboradores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Pencil, UserX, UserCheck, Loader2, Users, Upload, Settings, Database, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ImportColaboradoresDialog, ValidatedRow } from '@/components/colaboradores/ImportColaboradoresDialog';
import { TotvsConfigDialog } from '@/components/totvs/TotvsConfigDialog';
import { SyncTotvsButton } from '@/components/colaboradores/SyncTotvsButton';
import { Switch } from '@/components/ui/switch';
import type { FonteDados } from '@/hooks/useColaboradores';

const colaboradorSchema = z.object({
  chapa: z.string().trim().min(1, 'CHAPA é obrigatória').max(50, 'CHAPA muito longa'),
  nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
  cargo: z.string().trim().min(2, 'Cargo deve ter no mínimo 2 caracteres').max(100, 'Cargo muito longo'),
  salario: z.number().min(0.01, 'Salário deve ser maior que zero'),
});

interface ColaboradorFormData {
  chapa: string;
  nome: string;
  cargo: string;
  salario: number | null;
}

const initialFormData: ColaboradorFormData = {
  chapa: '',
  nome: '',
  cargo: '',
  salario: null,
};

export default function Colaboradores() {
  const [fonteDados, setFonteDados] = useState<FonteDados>('totvs');
  const { colaboradores, isLoading, createColaborador, updateColaborador, toggleColaboradorStatus, importColaboradores } = useColaboradores(fonteDados);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ColaboradorFormData>(initialFormData);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const existingChapas = colaboradores.map((c) => c.chapa);

  const handleImport = async (rows: ValidatedRow[]) => {
    await importColaboradores.mutateAsync(rows);
  };

  const filteredColaboradores = colaboradores.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.chapa.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = showInactive || c.ativo;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (colaborador?: Colaborador) => {
    if (colaborador) {
      setEditingId(colaborador.id);
      setFormData({
        chapa: colaborador.chapa,
        nome: colaborador.nome,
        cargo: colaborador.cargo,
        salario: colaborador.salario,
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = colaboradorSchema.safeParse({
      ...formData,
      salario: formData.salario ?? 0,
    });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (editingId) {
      await updateColaborador.mutateAsync({
        id: editingId,
        chapa: formData.chapa,
        nome: formData.nome,
        cargo: formData.cargo,
        salario: formData.salario!,
      });
    } else {
      await createColaborador.mutateAsync({
        chapa: formData.chapa,
        nome: formData.nome,
        cargo: formData.cargo,
        salario: formData.salario!,
        ativo: true,
      });
    }

    setDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de colaboradores</p>
        </div>
        <div className="flex gap-2">
          {/* Toggle de Fonte de Dados */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Supabase</span>
            <Switch
              checked={fonteDados === 'totvs'}
              onCheckedChange={(checked) => setFonteDados(checked ? 'totvs' : 'supabase')}
            />
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">TOTVS</span>
            <Badge variant="secondary" className="ml-2">
              {fonteDados === 'totvs' ? 'TOTVS' : 'Supabase'}
            </Badge>
          </div>
          
          {/* Botão de Configuração TOTVS */}
          {fonteDados === 'totvs' && (
            <Button variant="outline" onClick={() => setConfigDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar TOTVS
            </Button>
          )}
          
          {/* Botão de Sincronização (apenas no modo Supabase) */}
          {fonteDados === 'supabase' && <SyncTotvsButton />}
          
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} disabled={fonteDados === 'totvs'}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} disabled={fonteDados === 'totvs'}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Altere os dados do colaborador'
                  : 'Preencha os dados para cadastrar um novo colaborador'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapa">CHAPA *</Label>
                  <Input
                    id="chapa"
                    value={formData.chapa}
                    onChange={(e) => setFormData({ ...formData, chapa: e.target.value })}
                    placeholder="Ex: 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salario">Salário *</Label>
                  <CurrencyInput
                    id="salario"
                    value={formData.salario}
                    onChange={(value) => setFormData({ ...formData, salario: value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Analista de RH"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createColaborador.isPending || updateColaborador.isPending}
                >
                  {(createColaborador.isPending || updateColaborador.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingId ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>

        <ImportColaboradoresDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          existingChapas={existingChapas}
          onImport={handleImport}
        />
        
        <TotvsConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CHAPA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Colaboradores
            <Badge variant="secondary" className="ml-2">
              {filteredColaboradores.length}
            </Badge>
            <Badge variant={fonteDados === 'totvs' ? 'default' : 'outline'} className="ml-2">
              {fonteDados === 'totvs' ? (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
                  TOTVS Direto
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Supabase
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredColaboradores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum colaborador encontrado</p>
              {!search && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => handleOpenDialog()}
                >
                  Cadastrar o primeiro colaborador
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CHAPA</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right">Salário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredColaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id} className={!colaborador.ativo ? 'opacity-60' : ''}>
                      <TableCell className="font-mono">{colaborador.chapa}</TableCell>
                      <TableCell className="font-medium">{colaborador.nome}</TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(colaborador.salario)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={colaborador.ativo ? 'default' : 'secondary'}>
                          {colaborador.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {fonteDados === 'supabase' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(colaborador)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  toggleColaboradorStatus.mutate({
                                    id: colaborador.id,
                                    ativo: !colaborador.ativo,
                                  })
                                }
                              >
                                {colaborador.ativo ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          {fonteDados === 'totvs' && (
                            <span className="text-xs text-muted-foreground">
                              Somente leitura
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
