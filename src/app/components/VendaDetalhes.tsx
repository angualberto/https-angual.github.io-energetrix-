import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Cliente, Venda, Recebimento } from '../types';
import { formatDate, formatCurrency, generateId } from '../utils/dateUtils';
import { Calendar, CreditCard, DollarSign } from 'lucide-react';

interface VendaDetalhesProps {
  venda: Venda | null;
  cliente?: Cliente;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (venda: Venda) => void;
}

export function VendaDetalhes({ venda, cliente, isOpen, onClose, onUpdate }: VendaDetalhesProps) {
  const [recebendoParcela, setRecebendoParcela] = useState<string | null>(null);
  const [valorRecebimento, setValorRecebimento] = useState('');
  const [formaPagamentoRecebimento, setFormaPagamentoRecebimento] = useState<'dinheiro' | 'cartao' | 'pix' | 'transferencia'>('dinheiro');
  const [observacoesRecebimento, setObservacoesRecebimento] = useState('');

  if (!venda) return null;

  const handleReceberParcela = (parcelaId: string) => {
    const parcela = venda.parcelas.find(p => p.id === parcelaId);
    if (parcela) {
      setRecebendoParcela(parcelaId);
      setValorRecebimento(parcela.valorRestante.toString());
      setFormaPagamentoRecebimento('dinheiro');
      setObservacoesRecebimento('');
    }
  };

  const confirmarRecebimento = () => {
    if (!recebendoParcela || !valorRecebimento) return;

    const valorReceber = parseFloat(valorRecebimento);
    if (valorReceber <= 0) return;

    const vendaAtualizada = { ...venda };
    const parcelaIndex = vendaAtualizada.parcelas.findIndex(p => p.id === recebendoParcela);
    
    if (parcelaIndex === -1) return;

    const parcela = vendaAtualizada.parcelas[parcelaIndex];
    
    // Criar recebimento
    const novoRecebimento: Recebimento = {
      id: generateId(),
      vendaId: venda.id,
      parcelaId: recebendoParcela,
      valor: valorReceber,
      formaPagamento: formaPagamentoRecebimento,
      observacoes: observacoesRecebimento || undefined,
      createdAt: new Date()
    };

    // Atualizar parcela
    parcela.recebimentos.push(novoRecebimento);
    parcela.valorPago += valorReceber;
    parcela.valorRestante = Math.max(0, parcela.valorOriginal - parcela.valorPago);

    if (parcela.valorRestante === 0) {
      parcela.status = 'paga';
    } else if (parcela.valorPago > 0) {
      parcela.status = 'parcial';
    }

    // Se o valor recebido for maior que o restante da parcela atual
    if (valorReceber > parcela.valorRestante + valorReceber - parcela.valorPago) {
      const valorSobrando = valorReceber - (parcela.valorOriginal - (parcela.valorPago - valorReceber));
      
      // Procurar próxima parcela em aberto para abater o valor
      const proximaParcelaIndex = vendaAtualizada.parcelas.findIndex(
        (p, index) => index > parcelaIndex && p.status !== 'paga'
      );
      
      if (proximaParcelaIndex !== -1) {
        const proximaParcela = vendaAtualizada.parcelas[proximaParcelaIndex];
        const valorAbater = Math.min(valorSobrando, proximaParcela.valorRestante);
        
        if (valorAbater > 0) {
          proximaParcela.valorPago += valorAbater;
          proximaParcela.valorRestante -= valorAbater;
          
          if (proximaParcela.valorRestante === 0) {
            proximaParcela.status = 'paga';
          } else if (proximaParcela.valorPago > 0) {
            proximaParcela.status = 'parcial';
          }
        }
      }
    }

    // Atualizar status da venda
    const parcelasAbertas = vendaAtualizada.parcelas.filter(p => p.status !== 'paga');
    if (parcelasAbertas.length === 0) {
      vendaAtualizada.status = 'paga';
    } else {
      vendaAtualizada.status = 'parcial';
    }

    onUpdate(vendaAtualizada);
    setRecebendoParcela(null);
    setValorRecebimento('');
    setObservacoesRecebimento('');
  };

  const cancelarRecebimento = () => {
    setRecebendoParcela(null);
    setValorRecebimento('');
    setObservacoesRecebimento('');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paga': return 'Paga';
      case 'parcial': return 'Parcial';
      case 'aberta': return 'Em Aberto';
      default: return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paga': return 'default';
      case 'parcial': return 'secondary';
      case 'aberta': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalhes da Venda #{venda.id.slice(-6).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            {cliente 
              ? `Venda para ${cliente.nome} realizada em ${formatDate(venda.createdAt)}`
              : `Venda realizada em ${formatDate(venda.createdAt)}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Venda */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Resumo Financeiro
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-semibold">{formatCurrency(venda.valorTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-lg font-semibold">{formatCurrency(venda.custoTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(venda.lucroTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="text-lg font-semibold capitalize">
                  {venda.formaPagamento === 'parcelado' 
                    ? `${venda.numeroParcelas}x ${venda.tipoParcelamento}`
                    : venda.formaPagamento}
                </p>
              </div>
            </div>
          </Card>

          {/* Produtos */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Produtos</h3>
            <div className="space-y-3">
              {venda.produtos.map((produto, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <div>
                    <span className="font-medium">{produto.nome}</span>
                    <div className="text-sm text-muted-foreground">
                      {produto.quantidade}x {formatCurrency(produto.valorUnitario)}
                      {produto.custoUnitario > 0 && (
                        <span> | Custo: {formatCurrency(produto.custoUnitario)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(produto.subtotal)}</div>
                    {produto.custoTotal > 0 && (
                      <div className="text-sm text-green-600">
                        Lucro: {formatCurrency(produto.subtotal - produto.custoTotal)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cronograma de Recebimentos */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Cronograma de Recebimentos
            </h3>
            
            <div className="space-y-3">
              {venda.parcelas.map((parcela) => (
                <div key={parcela.id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Parcela {parcela.numero}</span>
                        <Badge variant={getStatusVariant(parcela.status) as any}>
                          {getStatusLabel(parcela.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {formatDate(parcela.dataVencimento)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(parcela.valorOriginal)}</p>
                      {parcela.valorPago > 0 && (
                        <p className="text-sm text-green-600">
                          Pago: {formatCurrency(parcela.valorPago)}
                        </p>
                      )}
                      {parcela.valorRestante > 0 && (
                        <p className="text-sm text-red-600">
                          Restante: {formatCurrency(parcela.valorRestante)}
                        </p>
                      )}
                    </div>
                  </div>

                  {parcela.status !== 'paga' && (
                    <div className="pt-2 border-t border-border">
                      {recebendoParcela === parcela.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="valorRecebimento">Valor Recebido</Label>
                              <Input
                                id="valorRecebimento"
                                type="number"
                                step="0.01"
                                value={valorRecebimento}
                                onChange={(e) => setValorRecebimento(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                              <Select value={formaPagamentoRecebimento} onValueChange={(value: any) => setFormaPagamentoRecebimento(value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                  <SelectItem value="cartao">Cartão</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="transferencia">Transferência</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="observacoes">Observações</Label>
                            <Input
                              id="observacoes"
                              value={observacoesRecebimento}
                              onChange={(e) => setObservacoesRecebimento(e.target.value)}
                              placeholder="Observações sobre o recebimento"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={confirmarRecebimento} size="sm" className="bg-green-600 hover:bg-green-700">
                              Confirmar Recebimento
                            </Button>
                            <Button onClick={cancelarRecebimento} variant="outline" size="sm">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleReceberParcela(parcela.id)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Receber
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Histórico de Recebimentos */}
                  {parcela.recebimentos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm font-medium mb-2">Histórico de Recebimentos:</p>
                      {parcela.recebimentos.map((recebimento) => (
                        <div key={recebimento.id} className="text-sm text-muted-foreground">
                          {formatDate(recebimento.createdAt)} - {formatCurrency(recebimento.valor)} 
                          <span className="capitalize"> ({recebimento.formaPagamento})</span>
                          {recebimento.observacoes && (
                            <span> - {recebimento.observacoes}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}