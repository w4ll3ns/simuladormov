import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { parseCSV, parseBrazilianNumber, generateSampleCSV, ParsedRow } from '@/lib/csvParser';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface ImportColaboradoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingChapas: string[];
  onImport: (colaboradores: ValidatedRow[]) => Promise<void>;
}

interface ColumnMapping {
  chapa: string;
  nome: string;
  cargo: string;
  salario: string;
}

export interface ValidatedRow {
  chapa: string;
  nome: string;
  cargo: string;
  salario: number;
  status: 'valid' | 'duplicate' | 'error';
  errorMessage?: string;
}

const colaboradorSchema = z.object({
  chapa: z.string().trim().min(1, 'CHAPA é obrigatória').max(50, 'CHAPA muito longa'),
  nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo'),
  cargo: z.string().trim().min(2, 'Cargo deve ter no mínimo 2 caracteres').max(100, 'Cargo muito longo'),
  salario: z.number().positive('Salário deve ser maior que zero'),
});

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

export function ImportColaboradoresDialog({
  open,
  onOpenChange,
  existingChapas,
  onImport,
}: ImportColaboradoresDialogProps) {
  const { handleError } = useErrorHandler();
  const [step, setStep] = useState<Step>('upload');
  const [rawData, setRawData] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    chapa: '',
    nome: '',
    cargo: '',
    salario: '',
  });
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const resetState = useCallback(() => {
    setStep('upload');
    setRawData(null);
    setColumnMapping({ chapa: '', nome: '', cargo: '', salario: '' });
    setValidatedRows([]);
    setImportProgress(0);
    setImportResult(null);
  }, []);

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileSelect = async (file: File) => {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      let headers: string[] = [];
      let rows: ParsedRow[] = [];

      if (extension === 'csv') {
        const text = await file.text();
        const result = parseCSV(text);
        headers = result.headers;
        rows = result.rows;
      } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });

        if (jsonData.length > 0) {
          headers = (jsonData[0] as string[]).map((h) => String(h).trim().toLowerCase());
          rows = jsonData.slice(1).map((row) => {
            const obj: ParsedRow = {};
            headers.forEach((h, i) => {
              obj[h] = String((row as string[])[i] || '').trim();
            });
            return obj;
          });
        }
      } else {
        throw new Error('Formato não suportado. Use CSV ou Excel.');
      }

      if (rows.length === 0) {
        throw new Error('O arquivo não contém dados.');
      }

      if (rows.length > 500) {
        throw new Error('Máximo de 500 linhas por importação.');
      }

      setRawData({ headers, rows });

      // Auto-map columns
      const autoMapping: ColumnMapping = {
        chapa: headers.find((h) => h.includes('chapa') || h === 'id' || h === 'matricula') || '',
        nome: headers.find((h) => h.includes('nome') || h === 'name') || '',
        cargo: headers.find((h) => h.includes('cargo') || h.includes('funcao') || h === 'role') || '',
        salario: headers.find((h) => h.includes('salario') || h.includes('salary')) || '',
      };
      setColumnMapping(autoMapping);
      setStep('mapping');
    } catch (error) {
      handleError(error, 'Erro ao processar arquivo');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const validateRows = () => {
    if (!rawData) return;

    const validated: ValidatedRow[] = rawData.rows.map((row) => {
      const chapa = row[columnMapping.chapa] || '';
      const nome = row[columnMapping.nome] || '';
      const cargo = row[columnMapping.cargo] || '';
      const salarioRaw = row[columnMapping.salario] || '';
      const salario = parseBrazilianNumber(salarioRaw);

      // Check for duplicate
      if (existingChapas.includes(chapa)) {
        return {
          chapa,
          nome,
          cargo,
          salario: salario || 0,
          status: 'duplicate' as const,
          errorMessage: 'CHAPA já cadastrada',
        };
      }

      // Validate
      const result = colaboradorSchema.safeParse({
        chapa,
        nome,
        cargo,
        salario: salario || 0,
      });

      if (!result.success) {
        return {
          chapa,
          nome,
          cargo,
          salario: salario || 0,
          status: 'error' as const,
          errorMessage: result.error.errors[0].message,
        };
      }

      return {
        chapa,
        nome,
        cargo,
        salario: salario!,
        status: 'valid' as const,
      };
    });

    setValidatedRows(validated);
    setStep('preview');
  };

  const handleImport = async () => {
    const toImport = validatedRows.filter((r) => {
      if (r.status === 'error') return false;
      if (r.status === 'duplicate' && skipDuplicates) return false;
      return true;
    });

    if (toImport.length === 0) {
      toast.error('Nenhum registro válido para importar.');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      await onImport(toImport);
      
      const skipped = validatedRows.filter((r) => r.status === 'duplicate' && skipDuplicates).length;
      const errors = validatedRows.filter((r) => r.status === 'error').length;

      setImportResult({
        success: toImport.length,
        skipped,
        errors,
      });
      setImportProgress(100);
      setStep('done');
    } catch (error) {
      handleError(error, 'Erro durante a importação. Tente novamente.');
      setStep('preview');
    }
  };

  const downloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_colaboradores.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const isMappingComplete = columnMapping.chapa && columnMapping.nome && columnMapping.cargo && columnMapping.salario;

  const validCount = validatedRows.filter((r) => r.status === 'valid').length;
  const duplicateCount = validatedRows.filter((r) => r.status === 'duplicate').length;
  const errorCount = validatedRows.filter((r) => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Colaboradores</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Selecione um arquivo CSV ou Excel para importar colaboradores.'}
            {step === 'mapping' && 'Mapeie as colunas do arquivo para os campos do sistema.'}
            {step === 'preview' && 'Revise os dados antes de importar.'}
            {step === 'importing' && 'Importando colaboradores...'}
            {step === 'done' && 'Importação concluída!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Arraste um arquivo aqui</p>
                <p className="text-sm text-muted-foreground mb-4">ou</p>
                <label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Selecionar arquivo
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Formatos aceitos: CSV, Excel (.xlsx, .xls) • Máximo 500 linhas
                </p>
              </div>

              <div className="flex justify-center">
                <Button variant="link" onClick={downloadSample}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar modelo CSV
                </Button>
              </div>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && rawData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {(['chapa', 'nome', 'cargo', 'salario'] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">
                      {field === 'salario' ? 'Salário' : field} *
                    </Label>
                    <Select
                      value={columnMapping[field]}
                      onValueChange={(value) =>
                        setColumnMapping({ ...columnMapping, [field]: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawData.headers
                          .filter((header) => header && header.trim() !== '')
                          .map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Preview first 3 rows */}
              <div>
                <Label className="text-sm text-muted-foreground">Prévia (3 primeiras linhas)</Label>
                <div className="mt-2 rounded border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CHAPA</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Salário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawData.rows.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row[columnMapping.chapa] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.nome] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.cargo] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.salario] || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={validateRows} disabled={!isMappingComplete}>
                  Validar dados
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4 flex-wrap">
                <Badge variant="default" className="text-sm px-3 py-1">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {validCount} válidos
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {duplicateCount} duplicados
                </Badge>
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  <XCircle className="h-4 w-4 mr-1" />
                  {errorCount} com erro
                </Badge>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="skip-duplicates"
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                />
                <Label htmlFor="skip-duplicates">Ignorar CHAPAs duplicadas</Label>
              </div>

              {/* Table */}
              <ScrollArea className="h-[300px] rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>CHAPA</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedRows.map((row, i) => (
                      <TableRow
                        key={i}
                        className={
                          row.status === 'error'
                            ? 'bg-destructive/10'
                            : row.status === 'duplicate'
                            ? 'bg-yellow-500/10'
                            : ''
                        }
                      >
                        <TableCell>
                          {row.status === 'valid' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {row.status === 'duplicate' && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {row.status === 'error' && (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{row.chapa}</TableCell>
                        <TableCell>{row.nome}</TableCell>
                        <TableCell>{row.cargo}</TableCell>
                        <TableCell>
                          {row.salario.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.errorMessage}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 && (skipDuplicates || duplicateCount === 0)}
                >
                  Importar {skipDuplicates ? validCount : validCount + duplicateCount} colaboradores
                </Button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Importando colaboradores...</p>
              <Progress value={importProgress} className="w-64 mx-auto" />
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && importResult && (
            <div className="py-12 text-center space-y-6">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <p className="text-xl font-semibold">Importação concluída!</p>
                <div className="mt-4 space-y-1 text-muted-foreground">
                  <p>{importResult.success} colaboradores importados</p>
                  {importResult.skipped > 0 && (
                    <p>{importResult.skipped} duplicados ignorados</p>
                  )}
                  {importResult.errors > 0 && (
                    <p>{importResult.errors} linhas com erro</p>
                  )}
                </div>
              </div>
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
