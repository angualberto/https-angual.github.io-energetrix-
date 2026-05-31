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
    nome: 'Excedente Residencial - Cluster 01',
    quantidade: 150,
    valorUnitario: 0.45,
    custoUnitario: 0.18,
    subtotal: 67.5,
    custoTotal: 27
  }]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ clienteId: '', observacoes: '' });
    setProdutos([{
      id: generateId(),
      nome: 'Excedente Residencial - Cluster 01',
      quantidade: 150,
      valorUnitario: 0.45,
      custoUnitario: 0.18,
      subtotal: 67.5,
      custoTotal: 27
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
      nome: 'Lote de Energia (Origem)',
      quantidade: 100,
      valorUnitario: 0.45,
      custoUnitario: 0.18,
      subtotal: 45,
      custoTotal: 18
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
      newErrors.cliente = 'Consumidor é obrigatório';
    }

    produtos.forEach((produto, index) => {
      if (!produto.nome.trim()) {
        newErrors[`produto_${index}_nome`] = 'Lote de Energia é obrigatório';
      }
      if (produto.quantidade <= 0) {
        newErrors[`produto_${index}_quantidade`] = 'Volume deve ser maior que zero';
      }
      if (produto.valorUnitario <= 0) {
        newErrors[`produto_${index}_valor`] = 'Preço Unitário deve ser maior que zero';
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
  const taxaApp = produtos.reduce((acc, p) => acc + (p.quantidade * 0.05), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0a2316] text-[#00E676] p-6 rounded-xl border border-[#004D40] font-sans">
        <DialogHeader className="flex flex-row justify-between items-center mb-4 space-y-0">
          <div>
            <DialogTitle className="text-xl font-bold text-white">
              {pedido ? 'Editar Transação P2P' : 'Novo Pedido P2P'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Crie uma nova transação de créditos de energia à distância
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seção Consumidor */}
          <div>
            <Label htmlFor="cliente" className="block text-xs font-semibold text-white mb-1">Comércio Comprador *</Label>
            <Select value={formData.clienteId} onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value }))}>
              <SelectTrigger className={`w-full bg-[#121212] border ${errors.cliente ? 'border-red-500' : 'border-[#004D40]'} rounded p-2 text-white text-sm h-10`}>
                <SelectValue placeholder="Selecione um estabelecimento" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-[#004D40] text-white">
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id} className="hover:bg-[#004D40] focus:bg-[#004D40] text-white">
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {produtos.map((produto, index) => (
              <div key={produto.id} className="bg-[#071a10] p-4 rounded-lg border border-[#004D40]">
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor={`produto_${index}_nome`} className="block text-xs text-gray-400">Origem do Lote Solar</Label>
                    {produtos.length > 1 && (
                      <button type="button" onClick={() => removeProduto(index)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <Input
                    id={`produto_${index}_nome`}
                    value={produto.nome}
                    onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                    className="w-full bg-[#121212] border border-[#003322] rounded p-2 text-sm text-white h-9"
                    placeholder="Ex: Excedente Residencial - Bloco A"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label htmlFor={`produto_${index}_quantidade`} className="block text-xs text-gray-400 mb-1">Volume (kWh)</Label>
                    <Input
                      id={`produto_${index}_quantidade`}
                      type="number"
                      value={produto.quantidade}
                      onChange={(e) => updateProduto(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#121212] border border-[#004D40] rounded p-2 text-sm text-white h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`produto_${index}_valor`} className="block text-xs text-gray-400 mb-1">Preço Unitário (R$/kWh)</Label>
                    <Input
                      id={`produto_${index}_valor`}
                      type="number"
                      step="0.01"
                      value={produto.valorUnitario}
                      onChange={(e) => updateProduto(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#121212] border border-[#00E676] rounded p-2 text-sm text-white h-9"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor={`produto_${index}_custo`} className="block text-xs text-gray-400 mb-1">Encargo Fio B 2026 (R$/kWh)</Label>
                  <Input
                    id={`produto_${index}_custo`}
                    type="number"
                    step="0.01"
                    value={produto.custoUnitario}
                    onChange={(e) => updateProduto(index, 'custoUnitario', parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121212] border border-[#003322] rounded p-2 text-sm text-gray-500 h-9"
                  />
                </div>

                <hr className="border-[#004D40] my-3" />

                <div className="grid grid-cols-3 text-center text-[10px] mt-2">
                  <div>
                    <span className="text-gray-400 block">Subtotal</span>
                    <strong className="text-white text-xs">R$ {produto.subtotal.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Custo Fio B</span>
                    <strong className="text-white text-xs">R$ {produto.custoTotal.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Taxa App (5c)</span>
                    <strong className="text-[#00E676] text-xs">R$ {(produto.quantidade * 0.05).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={addProduto}
            className="w-full border border-dashed border-[#004D40] text-gray-400 py-2 rounded text-xs hover:bg-[#071a10] transition-colors"
          >
            + Adicionar Outro Lote
          </button>

          <div className="bg-[#071a10] p-4 rounded-lg border border-[#004D40] mt-4">
            <h3 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Resumo Consolidado</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400">Total kWh</p>
                <p className="text-sm font-bold text-white">{produtos.reduce((acc, p) => acc + p.quantidade, 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Total Bruto</p>
                <p className="text-sm font-bold text-white">R$ {valorTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Total Taxas</p>
                <p className="text-sm font-bold text-[#00E676]">R$ {taxaApp.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-transparent border border-[#004D40] text-gray-400 font-bold py-2 rounded text-sm hover:bg-[#071a10]"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-[#121212] hover:bg-[#004D40] border border-[#00E676] text-white font-bold py-2 rounded transition-all text-sm"
            >
              {pedido ? '✓ Atualizar' : '+ Confirmar Transação P2P'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}