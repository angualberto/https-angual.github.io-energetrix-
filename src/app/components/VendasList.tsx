import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Cliente, Venda } from '../types';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { Search, Plus, Eye, Calendar } from 'lucide-react';

import { VendaDetalhes } from './VendaDetalhes';

interface VendasListProps {
  vendas: Venda[];
  clientes: Cliente[];
  onVendaUpdate: (venda: Venda) => void;
}

export function VendasList({ vendas, clientes, onVendaUpdate }: VendasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);

  const filteredVendas = vendas.filter(venda => {
    const cliente = clientes.find(c => c.id === venda.clienteId);
    const matchesSearch = cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venda.produtos.some(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'todos' || venda.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paga': return 'Paga';
      case 'parcial': return 'Parcial';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paga': return 'default';
      case 'parcial': return 'secondary';
      case 'pendente': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleViewDetails = (venda: Venda) => {
    setSelectedVenda(venda);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2">Vendas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Controle de vendas realizadas a partir de pedidos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por cliente ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="paga">Pagas</SelectItem>
            <SelectItem value="parcial">Parciais</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredVendas.map((venda) => {
          const cliente = clientes.find(c => c.id === venda.clienteId);
          const parcelasAbertas = venda.parcelas.filter(p => p.status !== 'paga');
          const valorPendente = parcelasAbertas.reduce((acc, p) => acc + p.valorRestante, 0);
          
          return (
            <Card key={venda.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">Venda #{venda.id.slice(-6).toUpperCase()}</h3>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={getStatusVariant(venda.status) as any} className="text-xs">
                        {getStatusLabel(venda.status)}
                      </Badge>
                      {venda.formaPagamento === 'parcelado' && (
                        <Badge variant="outline" className="text-xs">
                          {venda.numeroParcelas}x {venda.tipoParcelamento}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">
                    Cliente: {cliente?.nome} | {formatDate(venda.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(venda)}
                    className="flex-shrink-0"
                  >
                    <Eye className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Detalhes</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {venda.produtos.map((produto, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-border last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm sm:text-base block truncate">{produto.nome}</span>
                      <span className="text-muted-foreground text-xs sm:text-sm block">
                        {produto.quantidade}x {formatCurrency(produto.valorUnitario)}
                      </span>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="font-medium text-sm sm:text-base">{formatCurrency(produto.subtotal)}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Custo: {formatCurrency(produto.custoTotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">{formatCurrency(venda.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo Total</p>
                  <p className="font-semibold">{formatCurrency(venda.custoTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                  <p className="font-semibold text-green-600">{formatCurrency(venda.lucroTotal)}</p>
                </div>
                {valorPendente > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Pendente</p>
                    <p className="font-semibold text-red-600">{formatCurrency(valorPendente)}</p>
                  </div>
                )}
              </div>

              {venda.formaPagamento === 'parcelado' && parcelasAbertas.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Próximas Parcelas</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {parcelasAbertas.slice(0, 3).map((parcela) => (
                      <div key={parcela.id} className="text-sm">
                        <span className="font-medium">Parcela {parcela.numero}: </span>
                        <span className="text-muted-foreground">{formatDate(parcela.dataVencimento)}</span>
                        <div className="font-medium">{formatCurrency(parcela.valorRestante)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredVendas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'todos' 
              ? 'Nenhuma venda encontrada com os filtros aplicados' 
              : 'Nenhuma venda registrada'}
          </p>
        </div>
      )}



      <VendaDetalhes
        venda={selectedVenda}
        cliente={selectedVenda ? clientes.find(c => c.id === selectedVenda.clienteId) : undefined}
        isOpen={!!selectedVenda}
        onClose={() => setSelectedVenda(null)}
        onUpdate={onVendaUpdate}
      />
    </div>
  );
}