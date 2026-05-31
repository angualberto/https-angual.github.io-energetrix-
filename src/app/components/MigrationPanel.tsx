import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Database, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { migrationApi } from '../utils/api';
import { Cliente, Pedido, Venda } from '../types';

interface MigrationPanelProps {
  clientes: Cliente[];
  pedidos: Pedido[];
  vendas: Venda[];
  onMigrationComplete: () => void;
}

export function MigrationPanel({ clientes, pedidos, vendas, onMigrationComplete }: MigrationPanelProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [migrationMessage, setMigrationMessage] = useState('');

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus('idle');
    setMigrationMessage('');

    try {
      const result = await migrationApi.migrate({
        clientes,
        pedidos,
        vendas
      });

      setMigrationStatus('success');
      setMigrationMessage(result.message || 'Migração concluída com sucesso!');
      
      // Aguardar um pouco antes de chamar o callback
      setTimeout(() => {
        onMigrationComplete();
      }, 2000);
    } catch (error) {
      console.error('Erro na migração:', error);
      setMigrationStatus('error');
      setMigrationMessage(error instanceof Error ? error.message : 'Erro desconhecido na migração');
    } finally {
      setIsMigrating(false);
    }
  };

  const totalRecords = clientes.length + pedidos.length + vendas.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Migração para Supabase</CardTitle>
          <CardDescription>
            Migre seus dados do localStorage para o banco de dados Supabase
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>{clientes.length}</strong> clientes</p>
            <p>• <strong>{pedidos.length}</strong> pedidos</p>
            <p>• <strong>{vendas.length}</strong> vendas</p>
            <p className="pt-2 border-t">
              <strong>Total:</strong> {totalRecords} registros
            </p>
          </div>

          {migrationStatus !== 'idle' && (
            <Alert variant={migrationStatus === 'success' ? 'default' : 'destructive'}>
              {migrationStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{migrationMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleMigration}
              disabled={isMigrating || migrationStatus === 'success'}
              className="flex-1"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : migrationStatus === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Concluído
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Migrar Dados
                </>
              )}
            </Button>
          </div>

          {migrationStatus === 'idle' && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">⚠️ Importante:</p>
              <p>Esta migração enviará todos os seus dados para o Supabase. Certifique-se de que todos os dados estão corretos antes de prosseguir.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}