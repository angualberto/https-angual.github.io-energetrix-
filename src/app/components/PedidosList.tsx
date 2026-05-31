import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Cliente, Pedido } from '../types';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { Search, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { PedidoForm } from './PedidoForm';
import { VendaForm } from './VendaForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

interface PedidosListProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  onPedidoCreate: (pedido: Pedido) => void;
  onPedidoUpdate: (pedido: Pedido) => void;
  onPedidoDelete: (pedidoId: string) => void;
  onVendaCreate: (venda: any) => void;
}

export function PedidosList({ 
  pedidos, 
  clientes, 
  onPedidoCreate, 
  onPedidoUpdate, 
  onPedidoDelete,
  onVendaCreate 
}: PedidosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [showVendaForm, setShowVendaForm] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [convertingPedido, setConvertingPedido] = useState<Pedido | null>(null);
  const [deletingPedido, setDeletingPedido] = useState<Pedido | null>(null);

  const filteredPedidos = pedidos.filter(pedido => {
    const cliente = clientes.find(c => c.id === pedido.clienteId);
    const matchesSearch = cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.produtos.some(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'todos' || pedido.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (pedido: Pedido) => {
    if (pedido.status === 'convertido') return;
    setEditingPedido(pedido);
    setShowPedidoForm(true);
  };

  const handleConvert = (pedido: Pedido) => {
    if (pedido.status === 'convertido') return;
    setConvertingPedido(pedido);
    setShowVendaForm(true);
  };

  const handleDelete = (pedido: Pedido) => {
    if (pedido.status === 'convertido') return;
    setDeletingPedido(pedido);
  };

  const confirmDelete = () => {
    if (deletingPedido) {
      onPedidoDelete(deletingPedido.id);
      setDeletingPedido(null);
    }
  };

  const handleSavePedido = (pedido: Pedido) => {
    if (editingPedido) {
      onPedidoUpdate(pedido);
    } else {
      onPedidoCreate(pedido);
    }
    setEditingPedido(null);
  };

  const handleCloseForm = () => {
    setShowPedidoForm(false);
    setShowVendaForm(false);
    setEditingPedido(null);
    setConvertingPedido(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">Pedidos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie seus pedidos</p>
        </div>
        <Button onClick={() => setShowPedidoForm(true)} className="bg-primary text-primary-foreground self-start sm:self-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
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
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="convertido">Convertidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {filteredPedidos.map((pedido) => {
          const cliente = clientes.find(c => c.id === pedido.clienteId);
          const isConvertido = pedido.status === 'convertido';
          
          return (
            <Card key={pedido.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 sm:mb-6">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h3 className="text-base sm:text-lg font-semibold truncate">Pedido #{pedido.id.slice(-6).toUpperCase()}</h3>
                    <Badge variant={isConvertido ? 'default' : 'secondary'} className="px-3 py-1 self-start">
                      {isConvertido ? 'Convertido' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      Cliente: {cliente?.nome}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Data: {formatDate(pedido.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
                  {!isConvertido && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(pedido)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConvert(pedido)}
                        className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                      >
                        <ArrowRight className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Converter</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pedido)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-foreground">Produtos:</h4>
                {pedido.produtos.map((produto, index) => (
                  <div key={index} className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {produto.quantidade} • Valor Unit.: {formatCurrency(produto.valorUnitario)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold">{formatCurrency(produto.subtotal)}</p>
                      <p className="text-sm text-muted-foreground">
                        Custo: {formatCurrency(produto.custoTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-xl font-semibold text-primary">{formatCurrency(pedido.valorTotal)}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Custo Total</p>
                  <p className="text-xl font-semibold text-orange-600">{formatCurrency(pedido.custoTotal)}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Lucro Bruto Total</p>
                  <p className="text-xl font-semibold text-green-600">{formatCurrency(pedido.lucroTotal)}</p>
                </div>
              </div>

              {pedido.observacoes && (
                <div className="mt-6 p-4 bg-accent/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Observações: </span>
                    <span className="text-muted-foreground">{pedido.observacoes}</span>
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredPedidos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'todos' 
              ? 'Nenhum pedido encontrado com os filtros aplicados' 
              : 'Nenhum pedido cadastrado'}
          </p>
        </div>
      )}

      <PedidoForm
        isOpen={showPedidoForm}
        onClose={handleCloseForm}
        onSave={handleSavePedido}
        clientes={clientes}
        pedido={editingPedido || undefined}
      />

      <VendaForm
        isOpen={showVendaForm}
        onClose={handleCloseForm}
        onSave={onVendaCreate}
        clientes={clientes}
        pedido={convertingPedido || undefined}
      />

      <AlertDialog open={!!deletingPedido} onOpenChange={() => setDeletingPedido(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}