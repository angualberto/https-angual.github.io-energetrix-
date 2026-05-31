import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Cliente, Pedido, ProdutoPedido } from '../types';
import { generateId, formatCurrency } from '../utils/dateUtils';
import { Plus, Trash2 } from 'lucide-react';

interface PedidoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedido: Pedido) => void;
  clientes: Cliente[];
  pedido?: Pedido;
}

export function PedidoForm({ isOpen, onClose, onSave, clientes, pedido }: PedidoFormProps) {
  const [formData, setFormData] = useState({
    clienteId: '',
    observacoes: ''
  });

  const [produtos, setProdutos] = useState<ProdutoPedido[]>([{
    id: generateId(),
    nome: '',
    quantidade: 1,
    valorUnitario: 0,
    custoUnitario: 0,
    subtotal: 0,
    custoTotal: 0
  }]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ clienteId: '', observacoes: '' });
    setProdutos([{
      id: generateId(),
      nome: '',
      quantidade: 1,
      valorUnitario: 0,
      custoUnitario: 0,
      subtotal: 0,
      custoTotal: 0
    }]);
    setErrors({});
  };

  // Resetar dados quando o pedido muda ou modal abre
  useEffect(() => {
    if (isOpen) {
      if (pedido) {
        setFormData({
          clienteId: pedido.clienteId,
          observacoes: pedido.observacoes || ''
        });
        setProdutos([...pedido.produtos]);
      } else {
        resetForm();
      }
    }
  }, [isOpen, pedido]);

  const calcularProduto = (produto: Partial<ProdutoPedido>) => {
    const quantidade = produto.quantidade || 0;
    const valorUnitario = produto.valorUnitario || 0;
    const custoUnitario = produto.custoUnitario || 0;
    
    return {
      subtotal: quantidade * valorUnitario,
      custoTotal: quantidade * custoUnitario
    };
  };

  const updateProduto = (index: number, field: string, value: any) => {
    const newProdutos = [...produtos];
    newProdutos[index] = { ...newProdutos[index], [field]: value };
    
    const calculated = calcularProduto(newProdutos[index]);
    newProdutos[index].subtotal = calculated.subtotal;
    newProdutos[index].custoTotal = calculated.custoTotal;
    
    setProdutos(newProdutos);
  };

  const addProduto = () => {
    setProdutos([...produtos, {
      id: generateId(),
      nome: '',
      quantidade: 1,
      valorUnitario: 0,
      custoUnitario: 0,
      subtotal: 0,
      custoTotal: 0
    }]);
  };

  const removeProduto = (index: number) => {
    if (produtos.length > 1) {
      setProdutos(produtos.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clienteId) {
      newErrors.cliente = 'Cliente é obrigatório';
    }

    produtos.forEach((produto, index) => {
      if (!produto.nome.trim()) {
        newErrors[`produto_${index}_nome`] = 'Nome do produto é obrigatório';
      }
      if (produto.quantidade <= 0) {
        newErrors[`produto_${index}_quantidade`] = 'Quantidade deve ser maior que zero';
      }
      if (produto.valorUnitario <= 0) {
        newErrors[`produto_${index}_valor`] = 'Valor deve ser maior que zero';
      }
      if (produto.custoUnitario < 0) {
        newErrors[`produto_${index}_custo`] = 'Custo não pode ser negativo';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const valorTotal = produtos.reduce((acc, p) => acc + p.subtotal, 0);
    const custoTotal = produtos.reduce((acc, p) => acc + p.custoTotal, 0);
    const lucroTotal = valorTotal - custoTotal;

    const pedidoData: Pedido = {
      id: pedido?.id || generateId(),
      ...formData,
      produtos,
      valorTotal,
      custoTotal,
      lucroTotal,
      status: pedido?.status || 'pendente',
      createdAt: pedido?.createdAt || new Date()
    };

    onSave(pedidoData);
    onClose();
    resetForm();
  };

  const valorTotal = produtos.reduce((acc, p) => acc + p.subtotal, 0);
  const custoTotal = produtos.reduce((acc, p) => acc + p.custoTotal, 0);
  const lucroTotal = valorTotal - custoTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {pedido ? 'Editar Pedido' : 'Novo Pedido'}
          </DialogTitle>
          <DialogDescription>
            {pedido ? 'Atualize as informações do pedido' : 'Crie um novo pedido com produtos e custos'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="cliente">Cliente *</Label>
            <Select value={formData.clienteId} onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value }))}>
              <SelectTrigger className={errors.cliente ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome} - {cliente.telefone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cliente && (
              <p className="text-sm text-red-500 mt-1">{errors.cliente}</p>
            )}
          </div>

          <div>
            <div className="mb-4">
              <Label>Produtos *</Label>
            </div>

            <div className="space-y-4">
              {produtos.map((produto, index) => (
                <Card key={produto.id} className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Nome do produto em linha separada para ter mais espaço */}
                    <div>
                      <Label htmlFor={`produto_${index}_nome`}>Nome do Produto</Label>
                      <Input
                        id={`produto_${index}_nome`}
                        value={produto.nome}
                        onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                        className={`border border-input ${errors[`produto_${index}_nome`] ? 'border-red-500' : ''}`}
                        placeholder="Digite o nome do produto"
                      />
                      {errors[`produto_${index}_nome`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_nome`]}</p>
                      )}
                    </div>

                    {/* Campos numéricos em grid responsivo */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor={`produto_${index}_quantidade`}>Quantidade</Label>
                        <Input
                          id={`produto_${index}_quantidade`}
                          type="number"
                          min="1"
                          value={produto.quantidade}
                          onChange={(e) => updateProduto(index, 'quantidade', parseInt(e.target.value) || 0)}
                          className={`border border-input ${errors[`produto_${index}_quantidade`] ? 'border-red-500' : ''}`}
                          placeholder="0"
                        />
                        {errors[`produto_${index}_quantidade`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_quantidade`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`produto_${index}_valor`}>Valor Unitário</Label>
                        <Input
                          id={`produto_${index}_valor`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={produto.valorUnitario}
                          onChange={(e) => updateProduto(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                          className={`border border-input ${errors[`produto_${index}_valor`] ? 'border-red-500' : ''}`}
                          placeholder="0,00"
                        />
                        {errors[`produto_${index}_valor`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_valor`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`produto_${index}_custo`}>Custo Unitário</Label>
                        <Input
                          id={`produto_${index}_custo`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={produto.custoUnitario}
                          onChange={(e) => updateProduto(index, 'custoUnitario', parseFloat(e.target.value) || 0)}
                          className={`border border-input ${errors[`produto_${index}_custo`] ? 'border-red-500' : ''}`}
                          placeholder="0,00"
                        />
                        {errors[`produto_${index}_custo`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_custo`]}</p>
                        )}
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduto(index)}
                          disabled={produtos.length === 1}
                          className="p-2 text-red-500 hover:text-red-700 w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-medium">{formatCurrency(produto.subtotal)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo Total: </span>
                        <span className="font-medium">{formatCurrency(produto.custoTotal)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lucro: </span>
                        <span className="font-medium text-green-600">{formatCurrency(produto.subtotal - produto.custoTotal)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* Botão Adicionar Produto movido para baixo com validação */}
              <div className="flex justify-center pt-4">
                <Button 
                  type="button" 
                  onClick={addProduto} 
                  variant="outline" 
                  size="sm"
                  disabled={produtos.some(p => !p.nome.trim() || p.quantidade <= 0 || p.valorUnitario <= 0)}
                  className="w-full max-w-xs"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <Card className="p-4 bg-accent">
            <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-semibold">{formatCurrency(valorTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-xl font-semibold">{formatCurrency(custoTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto Total</p>
                <p className="text-xl font-semibold text-green-600">{formatCurrency(lucroTotal)}</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {pedido ? 'Atualizar' : 'Salvar'} Pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}