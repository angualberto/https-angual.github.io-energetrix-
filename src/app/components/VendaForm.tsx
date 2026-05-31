import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Cliente, Pedido, Venda, Parcela } from '../types';
import { generateId, formatCurrency, calcularParcelas } from '../utils/dateUtils';
import { Plus, Trash2 } from 'lucide-react';

interface VendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (venda: Venda) => void;
  clientes: Cliente[];
  pedido?: Pedido;
}

export function VendaForm({ isOpen, onClose, onSave, clientes, pedido }: VendaFormProps) {
  const [formData, setFormData] = useState({
    formaPagamento: '' as 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'parcelado' | '',
    tipoParcelamento: '' as 'quinzenal' | 'mensal' | '',
    numeroParcelas: 1,
    dataPrimeiroPagamento: new Date().toISOString().split('T')[0],
    isVendaParcial: false,
    observacoes: ''
  });

  const [tipoConversao, setTipoConversao] = useState<'total' | 'parcial'>('total');

  const [produtos, setProdutos] = useState([{
    id: generateId(),
    nome: '',
    quantidade: 1,
    valorUnitario: 0,
    custoUnitario: 0,
    subtotal: 0,
    custoTotal: 0
  }]);

  // Resetar dados quando o pedido muda ou modal abre
  useEffect(() => {
    if (isOpen) {
      if (pedido) {
        setProdutos([...pedido.produtos]);
        setTipoConversao('total');
        setFormData({
          formaPagamento: '',
          tipoParcelamento: '',
          numeroParcelas: 1,
          dataPrimeiroPagamento: new Date().toISOString().split('T')[0],
          isVendaParcial: false,
          observacoes: ''
        });
      } else {
        // Reset manual se não há pedido
        setFormData({
          formaPagamento: '',
          tipoParcelamento: '',
          numeroParcelas: 1,
          dataPrimeiroPagamento: new Date().toISOString().split('T')[0],
          isVendaParcial: false,
          observacoes: ''
        });
        setProdutos([{
          id: generateId(),
          nome: '',
          quantidade: 1,
          valorUnitario: 0,
          custoUnitario: 0,
          subtotal: 0,
          custoTotal: 0
        }]);
        setTipoConversao('total');
      }
      setErrors({});
    }
  }, [isOpen, pedido]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calcularProduto = (produto: any) => {
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

    if (!formData.formaPagamento) {
      newErrors.formaPagamento = 'Forma de pagamento é obrigatória';
    }

    if (formData.formaPagamento === 'parcelado') {
      if (!formData.tipoParcelamento) {
        newErrors.tipoParcelamento = 'Tipo de parcelamento é obrigatório';
      }
      if (formData.numeroParcelas < 1) {
        newErrors.numeroParcelas = 'Número de parcelas deve ser maior que zero';
      }
    }

    // Só validar produtos se não for uma conversão de pedido total ou se for conversão parcial
    if (!pedido || tipoConversao === 'parcial') {
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
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const valorTotal = produtos.reduce((acc, p) => acc + p.subtotal, 0);
    const custoTotal = produtos.reduce((acc, p) => acc + p.custoTotal, 0);
    const lucroTotal = valorTotal - custoTotal;

    let parcelas: Parcela[] = [];

    if (formData.formaPagamento === 'parcelado') {
      const parcelasCalculadas = calcularParcelas(
        valorTotal,
        formData.numeroParcelas,
        formData.tipoParcelamento,
        new Date(formData.dataPrimeiroPagamento)
      );

      parcelas = parcelasCalculadas.map((parcela) => ({
        id: generateId(),
        numero: parcela.numero,
        valorOriginal: parcela.valor,
        valorPago: 0,
        valorRestante: parcela.valor,
        dataVencimento: parcela.dataVencimento,
        status: 'aberta' as const,
        recebimentos: []
      }));
    } else {
      // Pagamento à vista
      const dataPagamento = new Date(formData.dataPrimeiroPagamento);
      parcelas = [{
        id: generateId(),
        numero: 1,
        valorOriginal: valorTotal,
        valorPago: valorTotal,
        valorRestante: 0,
        dataVencimento: dataPagamento,
        status: 'paga' as const,
        recebimentos: [{
          id: generateId(),
          vendaId: '',
          parcelaId: '',
          valor: valorTotal,
          formaPagamento: formData.formaPagamento as any,
          createdAt: dataPagamento
        }]
      }];
    }

    const vendaData: Venda = {
      id: generateId(),
      pedidoId: pedido?.id || '',
      clienteId: pedido?.clienteId || '',
      produtos,
      valorTotal,
      custoTotal,
      lucroTotal,
      formaPagamento: formData.formaPagamento,
      tipoParcelamento: formData.formaPagamento === 'parcelado' ? formData.tipoParcelamento : undefined,
      numeroParcelas: formData.formaPagamento === 'parcelado' ? formData.numeroParcelas : undefined,
      parcelas,
      status: formData.formaPagamento === 'parcelado' ? 'parcial' : 'paga',
      createdAt: new Date()
    };

    // Atualizar IDs das parcelas e recebimentos
    vendaData.parcelas.forEach(parcela => {
      parcela.recebimentos.forEach(recebimento => {
        recebimento.vendaId = vendaData.id;
        recebimento.parcelaId = parcela.id;
      });
    });

    onSave(vendaData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      formaPagamento: '',
      tipoParcelamento: '',
      numeroParcelas: 1,
      dataPrimeiroPagamento: new Date().toISOString().split('T')[0],
      isVendaParcial: false,
      observacoes: ''
    });
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

  const valorTotal = produtos.reduce((acc, p) => acc + p.subtotal, 0);
  const custoTotal = produtos.reduce((acc, p) => acc + p.custoTotal, 0);
  const lucroTotal = valorTotal - custoTotal;

  const cliente = pedido ? clientes.find(c => c.id === pedido.clienteId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pedido ? `Converter Pedido em Venda` : 'Nova Venda'}
          </DialogTitle>
          <DialogDescription>
            {pedido 
              ? `Converta o pedido em venda definindo forma de pagamento e parcelamento${cliente ? ` para ${cliente.nome}` : ''}`
              : 'Crie uma nova venda direta definindo produtos e forma de pagamento'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {pedido && (
            <div>
              <Label className="text-base font-medium">Tipo de Conversão</Label>
              <div className="flex gap-6 mt-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tipoConversao"
                    value="total"
                    checked={tipoConversao === 'total'}
                    onChange={(e) => {
                      setTipoConversao(e.target.value as 'total' | 'parcial');
                      if (e.target.value === 'total') {
                        setProdutos([...pedido.produtos]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-base">Conversão Total</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tipoConversao"
                    value="parcial"
                    checked={tipoConversao === 'parcial'}
                    onChange={(e) => setTipoConversao(e.target.value as 'total' | 'parcial')}
                    className="w-4 h-4"
                  />
                  <span className="text-base">Conversão Parcial</span>
                </label>
              </div>
            </div>
          )}

          {tipoConversao === 'parcial' && pedido && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <Label className="text-lg font-medium">Produtos para Venda *</Label>
                <Button type="button" onClick={addProduto} variant="outline" size="default">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>

              <div className="space-y-6">
                {produtos.map((produto, index) => (
                  <Card key={produto.id} className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor={`produto_${index}_nome`} className="text-base font-medium">Nome do Produto</Label>
                          <Input
                            id={`produto_${index}_nome`}
                            value={produto.nome}
                            onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                            className={`h-12 text-base border border-input ${errors[`produto_${index}_nome`] ? 'border-red-500' : ''}`}
                            placeholder="Digite o nome do produto"
                          />
                          {errors[`produto_${index}_nome`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_nome`]}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`produto_${index}_quantidade`} className="text-base font-medium">Quantidade</Label>
                          <Input
                            id={`produto_${index}_quantidade`}
                            type="number"
                            min="1"
                            value={produto.quantidade}
                            onChange={(e) => updateProduto(index, 'quantidade', parseInt(e.target.value) || 0)}
                            className={`h-12 text-base border border-input ${errors[`produto_${index}_quantidade`] ? 'border-red-500' : ''}`}
                          />
                          {errors[`produto_${index}_quantidade`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_quantidade`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor={`produto_${index}_valor`} className="text-base font-medium">Valor Unitário</Label>
                          <Input
                            id={`produto_${index}_valor`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={produto.valorUnitario}
                            onChange={(e) => updateProduto(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            className={`h-12 text-base border border-input ${errors[`produto_${index}_valor`] ? 'border-red-500' : ''}`}
                            placeholder="0,00"
                          />
                          {errors[`produto_${index}_valor`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_valor`]}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`produto_${index}_custo`} className="text-base font-medium">Custo Unitário</Label>
                          <Input
                            id={`produto_${index}_custo`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={produto.custoUnitario}
                            onChange={(e) => updateProduto(index, 'custoUnitario', parseFloat(e.target.value) || 0)}
                            className="h-12 text-base border border-input"
                            placeholder="0,00"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            onClick={() => removeProduto(index)}
                            disabled={produtos.length === 1}
                            className="h-12 px-6 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!pedido && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Produtos *</Label>
                <Button type="button" onClick={addProduto} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>

              <div className="space-y-4">
                {produtos.map((produto, index) => (
                  <Card key={produto.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <Label htmlFor={`produto_${index}_nome`}>Nome do Produto</Label>
                        <Input
                          id={`produto_${index}_nome`}
                          value={produto.nome}
                          onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                          className={errors[`produto_${index}_nome`] ? 'border-red-500' : ''}
                        />
                        {errors[`produto_${index}_nome`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_nome`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`produto_${index}_quantidade`}>Quantidade</Label>
                        <Input
                          id={`produto_${index}_quantidade`}
                          type="number"
                          min="1"
                          value={produto.quantidade}
                          onChange={(e) => updateProduto(index, 'quantidade', parseInt(e.target.value) || 0)}
                          className={errors[`produto_${index}_quantidade`] ? 'border-red-500' : ''}
                        />
                        {errors[`produto_${index}_quantidade`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_quantidade`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`produto_${index}_valor`}>Valor Unit.</Label>
                        <Input
                          id={`produto_${index}_valor`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={produto.valorUnitario}
                          onChange={(e) => updateProduto(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                          className={errors[`produto_${index}_valor`] ? 'border-red-500' : ''}
                        />
                        {errors[`produto_${index}_valor`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`produto_${index}_valor`]}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`produto_${index}_custo`}>Custo Unit.</Label>
                        <Input
                          id={`produto_${index}_custo`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={produto.custoUnitario}
                          onChange={(e) => updateProduto(index, 'custoUnitario', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduto(index)}
                          disabled={produtos.length === 1}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pedido && tipoConversao === 'total' && (
            <Card className="p-4 bg-muted">
              <h3 className="font-semibold mb-3">Dados do Pedido (Conversão Total)</h3>
              <div className="space-y-2 mb-4">
                {pedido.produtos.map((produto, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                    <div>
                      <span className="font-medium">{produto.nome}</span>
                      <span className="text-muted-foreground ml-2">
                        {produto.quantidade}x {formatCurrency(produto.valorUnitario)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(produto.subtotal)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div>
            <Label htmlFor="dataPrimeiroPagamento" className="text-base font-medium">Data do Primeiro Pagamento *</Label>
            <Input
              id="dataPrimeiroPagamento"
              type="date"
              value={formData.dataPrimeiroPagamento}
              onChange={(e) => setFormData(prev => ({ ...prev, dataPrimeiroPagamento: e.target.value }))}
              className="h-12 text-base border border-input"
            />
          </div>

          <div>
            <Label htmlFor="formaPagamento" className="text-base font-medium">Forma de Pagamento *</Label>
            <Select value={formData.formaPagamento} onValueChange={(value: any) => setFormData(prev => ({ ...prev, formaPagamento: value }))}>
              <SelectTrigger className={`h-12 text-base ${errors.formaPagamento ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="parcelado">Parcelado</SelectItem>
              </SelectContent>
            </Select>
            {errors.formaPagamento && (
              <p className="text-sm text-red-500 mt-1">{errors.formaPagamento}</p>
            )}
          </div>

          {formData.formaPagamento === 'parcelado' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoParcelamento" className="text-base font-medium">Tipo de Parcelamento *</Label>
                <Select value={formData.tipoParcelamento} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipoParcelamento: value }))}>
                  <SelectTrigger className={`h-12 text-base ${errors.tipoParcelamento ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoParcelamento && (
                  <p className="text-sm text-red-500 mt-1">{errors.tipoParcelamento}</p>
                )}
              </div>

              <div>
                <Label htmlFor="numeroParcelas" className="text-base font-medium">Número de Parcelas *</Label>
                <Input
                  id="numeroParcelas"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.numeroParcelas}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroParcelas: parseInt(e.target.value) || 1 }))}
                  className={`h-12 text-base ${errors.numeroParcelas ? 'border-red-500' : ''}`}
                />
                {errors.numeroParcelas && (
                  <p className="text-sm text-red-500 mt-1">{errors.numeroParcelas}</p>
                )}
              </div>
            </div>
          )}

          <Card className="p-4 bg-accent">
            <h3 className="font-semibold mb-3">Resumo da Venda</h3>
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

            {pedido && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Cliente: {cliente?.nome} | Pedido #{pedido.id.slice(-6).toUpperCase()}
                </p>
              </div>
            )}

            {formData.formaPagamento === 'parcelado' && formData.tipoParcelamento && valorTotal > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Parcelas: {formData.numeroParcelas}x de {formatCurrency(valorTotal / formData.numeroParcelas)} ({formData.tipoParcelamento})
                </p>
              </div>
            )}
          </Card>

          <div>
            <Label htmlFor="observacoes" className="text-base font-medium">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              placeholder="Observações sobre a venda (opcional)"
              className="text-base"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 text-base">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700">
              {pedido ? 'Converter em Venda' : 'Salvar Venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}