import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSimulacoes, SimulacaoWithStats } from '@/hooks/useSimulacoes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  FileBarChart,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { z } from 'zod';
import { formatCurrencyWithSign } from '@/lib/currency';

const simulacaoSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
});

export default function Simulacoes() {
  const navigate = useNavigate();
  const { simulacoes, isLoading, createSimulacao, deleteSimulacao, duplicateSimulacao } = useSimulacoes();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });

  const filteredSimulacoes = simulacoes.filter((s) =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = simulacaoSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    const sim = await createSimulacao.mutateAsync({
      nome: formData.nome,
      descricao: formData.descricao || undefined,
    });

    setDialogOpen(false);
    setFormData({ nome: '', descricao: '' });
    navigate(`/simulacoes/${sim.id}`);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSimulacao.mutateAsync(deleteId);
      setDeleteId(null);
    }
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
          <h1 className="text-2xl font-bold text-foreground">Simulações</h1>
          <p className="text-muted-foreground">Gerencie suas simulações de movimentação</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Simulação</DialogTitle>
              <DialogDescription>
                Defina um nome e descrição para sua simulação de movimentação
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da simulação *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Mudanças equipe Comercial - Janeiro/2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o objetivo desta simulação..."
                  rows={3}
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
                <Button type="submit" disabled={createSimulacao.isPending}>
                  {createSimulacao.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Criar e continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar simulações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Simulations List */}
      {filteredSimulacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma simulação encontrada</p>
            {!search && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setDialogOpen(true)}
              >
                Criar sua primeira simulação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSimulacoes.map((simulacao) => (
            <SimulacaoCard
              key={simulacao.id}
              simulacao={simulacao}
              onDuplicate={() => duplicateSimulacao.mutate(simulacao.id)}
              onDelete={() => setDeleteId(simulacao.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir simulação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A simulação e todas as suas movimentações
              serão permanentemente excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SimulacaoCardProps {
  simulacao: SimulacaoWithStats;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SimulacaoCard({ simulacao, onDuplicate, onDelete }: SimulacaoCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{simulacao.nome}</CardTitle>
            <CardDescription className="mt-1">
              {format(new Date(simulacao.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/simulacoes/${simulacao.id}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {simulacao.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {simulacao.descricao}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={simulacao.status === 'finalizada' ? 'default' : 'secondary'}>
              {simulacao.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {simulacao.totalMovimentacoes} mov.
            </span>
          </div>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              simulacao.impactoTotal >= 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {simulacao.impactoTotal >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {formatCurrencyWithSign(simulacao.impactoTotal)}/mês
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link to={`/simulacoes/${simulacao.id}`}>
            Abrir simulação
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
