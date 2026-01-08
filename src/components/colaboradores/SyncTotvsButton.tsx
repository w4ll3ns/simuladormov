/**
 * Componente de sincronização TOTVS → Supabase
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, RefreshCw } from 'lucide-react';
import { useColaboradores } from '@/hooks/useColaboradores';
import { toast } from 'sonner';

interface SyncTotvsButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SyncTotvsButton({
  variant = 'outline',
  size = 'default',
}: SyncTotvsButtonProps) {
  const { syncFromTotvs } = useColaboradores('supabase');
  const [replaceMode, setReplaceMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSync = async () => {
    setDialogOpen(false);
    
    try {
      await syncFromTotvs.mutateAsync({ replace: replaceMode });
    } catch (error) {
      // Erro já é tratado no hook
      console.error('Erro na sincronização:', error);
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={syncFromTotvs.isPending}>
          {syncFromTotvs.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar do TOTVS
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sincronizar Colaboradores do TOTVS</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá buscar todos os colaboradores do TOTVS e{' '}
            {replaceMode ? (
              <strong>substituir</strong>
            ) : (
              <strong>adicionar</strong>
            )}{' '}
            os dados no sistema.
            <br />
            <br />
            <label className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={replaceMode}
                onChange={(e) => setReplaceMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                Substituir colaboradores existentes (desativa os que não estão no TOTVS)
              </span>
            </label>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSync} disabled={syncFromTotvs.isPending}>
            {syncFromTotvs.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              'Sincronizar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

