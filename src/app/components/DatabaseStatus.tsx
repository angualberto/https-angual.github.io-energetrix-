import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Cloud, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DatabaseStatusProps {
  useSupabase: boolean;
  supabaseRecords: {
    clientes: number;
    pedidos: number;
    vendas: number;
  };
  isLoading: boolean;
  error: string | null;
  onReloadData: () => void;
}

export function DatabaseStatus({
  useSupabase,
  supabaseRecords,
  isLoading,
  error,
  onReloadData
}: DatabaseStatusProps) {
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReloadData();
    } finally {
      setIsReloading(false);
    }
  };

  const totalRecords = supabaseRecords.clientes + supabaseRecords.pedidos + supabaseRecords.vendas;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <CardTitle className="text-sm sm:text-base">
              Supabase Database
            </CardTitle>
          </div>
          <Badge variant="default" className="self-start">
            Produção
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Dados sincronizados com o banco de dados na nuvem
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status geral */}
        <div className="flex items-center gap-2">
          {error ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Erro na conexão</span>
            </>
          ) : isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Conectado</span>
            </>
          )}
        </div>

        {/* Resumo dos dados */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{supabaseRecords.clientes}</div>
            <div className="text-xs text-muted-foreground">Clientes</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{supabaseRecords.pedidos}</div>
            <div className="text-xs text-muted-foreground">Pedidos</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{supabaseRecords.vendas}</div>
            <div className="text-xs text-muted-foreground">Vendas</div>
          </div>
        </div>

        {/* Total */}
        <div className="pt-2 border-t text-center">
          <div className="text-sm text-muted-foreground">
            Total: <strong>{totalRecords}</strong> registros
          </div>
        </div>

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={handleReload}
            variant="outline"
            size="sm"
            disabled={isReloading}
            className="flex-1"
          >
            {isReloading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Recarregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}