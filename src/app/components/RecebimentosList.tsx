import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Cliente, Venda, Parcela, Recebimento } from '../types';
import { formatDate, formatCurrency, generateId } from '../utils/dateUtils';
import { Search, Calendar, Clock, CheckCircle, AlertCircle, Plus, DollarSign, Eye } from 'lucide-react';

interface RecebimentosListProps {
  vendas: Venda[];
  clientes: Cliente[];
  onVendaUpdate?: (venda: Venda) => void;
}

export function RecebimentosList({ vendas, clientes, onVendaUpdate }: RecebimentosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [periodoFilter, setPeriodoFilter] = useState('todos');
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  
  const [formRecebimento, setFormRecebimento] = useState({
    clienteId: '',
    valor: '',
    dataRecebimento: new Date().toISOString().split('T')[0],
    formaPagamento: 'dinheiro' as 'dinheiro' | 'cartao' | 'pix' | 'transferencia',
    observacoes: ''
  });

  // Extrair todas as parcelas com informações das vendas
  const todasParcelas = vendas.flatMap(venda => 
    venda.parcelas.map(parcela => ({
      ...parcela,
      venda,
      cliente: clientes.find(c => c.id === venda.clienteId)
    }))
  );

  const filteredParcelas = todasParcelas.filter(item => {
    const matchesSearch = item.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.venda.produtos.some(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    
    let matchesPeriodo = true;
    if (periodoFilter !== 'todos') {
      const hoje = new Date();
      const dataVencimento = new Date(item.dataVencimento);
      
      switch (periodoFilter) {
        case 'vencidas':
          matchesPeriodo = dataVencimento < hoje && item.status !== 'paga';
          break;
        case 'hoje':
          matchesPeriodo = dataVencimento.toDateString() === hoje.toDateString();
          break;
        case '7dias':
          const em7Dias = new Date();
          em7Dias.setDate(hoje.getDate() + 7);
          matchesPeriodo = dataVencimento >= hoje && dataVencimento <= em7Dias;
          break;
        case '30dias':
          const em30Dias = new Date();
          em30Dias.setDate(hoje.getDate() + 30);
          matchesPeriodo = dataVencimento >= hoje && dataVencimento <= em30Dias;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPeriodo;
  });

  // Ordenar por data de vencimento
  const parcelasOrdenadas = filteredParcelas.sort((a, b) => 
    new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
  );

  const getStatusIcon = (parcela: any) => {
    const hoje = new Date();
    const dataVencimento = new Date(parcela.dataVencimento);
    
    if (parcela.status === 'paga') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (dataVencimento < hoje) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusLabel = (parcela: any) => {
    const hoje = new Date();
    const dataVencimento = new Date(parcela.dataVencimento);
    
    if (parcela.status === 'paga') {
      return 'Paga';
    } else if (dataVencimento < hoje) {
      return 'Vencida';
    } else if (parcela.status === 'parcial') {
      return 'Parcial';
    } else {
      return 'Em Aberto';
    }
  };

  const getStatusVariant = (parcela: any) => {
    const hoje = new Date();
    const dataVencimento = new Date(parcela.dataVencimento);
    
    if (parcela.status === 'paga') {
      return 'default';
    } else if (dataVencimento < hoje) {
      return 'destructive';
    } else if (parcela.status === 'parcial') {
      return 'secondary';
    } else {
      return 'outline';
    }
  };

  // Calcular totais
  const totalPrevisao = parcelasOrdenadas.reduce((acc, p) => acc + p.valorRestante, 0);
  const totalVencidas = parcelasOrdenadas
    .filter(p => new Date(p.dataVencimento) < new Date() && p.status !== 'paga')
    .reduce((acc, p) => acc + p.valorRestante, 0);

  const handleNovoRecebimento = () => {
    setFormRecebimento({
      clienteId: '',
      valor: '',
      dataRecebimento: new Date().toISOString().split('T')[0],
      formaPagamento: 'dinheiro',
      observacoes: ''
    });
    setClienteSelecionado(null);
    setShowRecebimentoModal(true);
  };

  const handleVerHistorico = (parcela: any) => {
    setClienteSelecionado(parcela);
    setShowHistoricoModal(true);
  };

  const handleSalvarRecebimento = () => {
    if (!onVendaUpdate || !formRecebimento.clienteId) return;

    const valorRecebimento = parseFloat(formRecebimento.valor);
    if (valorRecebimento <= 0) {
      alert('Valor deve ser maior que zero.');
      return;
    }

    const cliente = clientes.find(c => c.id === formRecebimento.clienteId);
    if (!cliente) return;

    // Buscar todas as parcelas em aberto do cliente, ordenadas por data de vencimento
    const parcelasCliente = todasParcelas
      .filter(p => p.cliente?.id === formRecebimento.clienteId && p.status !== 'paga')
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

    if (parcelasCliente.length === 0) {
      alert('Cliente não possui parcelas em aberto.');
      return;
    }

    let valorRestante = valorRecebimento;
    const vendasAtualizadas: Venda[] = [];

    // Distribuir o valor pago nas parcelas mais antigas
    for (const parcelaItem of parcelasCliente) {
      if (valorRestante <= 0) break;

      const valorParaParcela = Math.min(valorRestante, parcelaItem.valorRestante);
      
      const novoRecebimento: Recebimento = {
        id: generateId(),
        vendaId: parcelaItem.venda.id,
        parcelaId: parcelaItem.id,
        valor: valorParaParcela,
        formaPagamento: formRecebimento.formaPagamento,
        observacoes: formRecebimento.observacoes,
        createdAt: new Date(formRecebimento.dataRecebimento)
      };

      // Atualizar a venda
      let vendaAtualizada = vendasAtualizadas.find(v => v.id === parcelaItem.venda.id);
      if (!vendaAtualizada) {
        vendaAtualizada = { ...parcelaItem.venda };
        vendasAtualizadas.push(vendaAtualizada);
      }

      const parcelaIndex = vendaAtualizada.parcelas.findIndex(p => p.id === parcelaItem.id);
      if (parcelaIndex !== -1) {
        const parcelaAtualizada = { ...vendaAtualizada.parcelas[parcelaIndex] };
        parcelaAtualizada.recebimentos = [...parcelaAtualizada.recebimentos, novoRecebimento];
        parcelaAtualizada.valorPago += valorParaParcela;
        parcelaAtualizada.valorRestante -= valorParaParcela;
        
        // Atualizar status da parcela
        if (parcelaAtualizada.valorRestante <= 0) {
          parcelaAtualizada.status = 'paga';
        } else {
          parcelaAtualizada.status = 'parcial';
        }
        
        vendaAtualizada.parcelas[parcelaIndex] = parcelaAtualizada;
        
        // Atualizar status da venda
        const todasPagas = vendaAtualizada.parcelas.every(p => p.status === 'paga');
        const algumaParcial = vendaAtualizada.parcelas.some(p => p.status === 'parcial');
        
        if (todasPagas) {
          vendaAtualizada.status = 'paga';
        } else if (algumaParcial) {
          vendaAtualizada.status = 'parcial';
        }
      }

      valorRestante -= valorParaParcela;
    }

    // Aplicar todas as atualizações
    vendasAtualizadas.forEach(venda => {
      onVendaUpdate(venda);
    });

    setShowRecebimentoModal(false);
    setClienteSelecionado(null);
  };

  // Obter clientes com parcelas em aberto
  const clientesComParcelas = clientes.filter(cliente => 
    todasParcelas.some(p => p.cliente?.id === cliente.id && p.status !== 'paga')
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">Recebimentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Controle de recebimentos e parcelas</p>
        </div>
        <Button onClick={handleNovoRecebimento} className="bg-green-600 hover:bg-green-700 text-white self-start sm:self-auto">
          <DollarSign className="w-4 h-4 mr-2" />
          Receber Pagamento
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Total a Receber</span>
          </div>
          <p className="text-2xl font-semibold">{formatCurrency(totalPrevisao)}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium">Valores Vencidos</span>
          </div>
          <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalVencidas)}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Parcelas em Aberto</span>
          </div>
          <p className="text-2xl font-semibold">{parcelasOrdenadas.filter(p => p.status !== 'paga').length}</p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="aberta">Em Aberto</SelectItem>
            <SelectItem value="parcial">Parciais</SelectItem>
            <SelectItem value="paga">Pagas</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Períodos</SelectItem>
            <SelectItem value="vencidas">Vencidas</SelectItem>
            <SelectItem value="hoje">Vence Hoje</SelectItem>
            <SelectItem value="7dias">Próximos 7 dias</SelectItem>
            <SelectItem value="30dias">Próximos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Parcelas */}
      <div className="space-y-3">
        {parcelasOrdenadas.map((item) => (
          <Card key={`${item.venda.id}-${item.id}`} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(item)}
                  <h3 className="font-semibold">
                    {item.cliente?.nome}
                  </h3>
                  <Badge variant={getStatusVariant(item) as any}>
                    {getStatusLabel(item)}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Venda #{item.venda.id.slice(-6).toUpperCase()} - Parcela {item.numero}</p>
                  <p>Vencimento: {formatDate(item.dataVencimento)}</p>
                  {item.venda.formaPagamento === 'parcelado' && (
                    <p>Parcelamento: {item.venda.numeroParcelas}x {item.venda.tipoParcelamento}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {formatCurrency(item.valorOriginal)}
                    </p>
                    {item.valorPago > 0 && (
                      <p className="text-sm text-green-600">
                        Pago: {formatCurrency(item.valorPago)}
                      </p>
                    )}
                    {item.valorRestante > 0 && item.status !== 'paga' && (
                      <p className="text-sm text-red-600 font-medium">
                        Restante: {formatCurrency(item.valorRestante)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {item.recebimentos && item.recebimentos.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerHistorico(item)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Histórico
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Produtos da venda */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm font-medium mb-1">Produtos:</p>
              <div className="text-sm text-muted-foreground">
                {item.venda.produtos.map((produto, index) => (
                  <span key={index}>
                    {produto.nome} ({produto.quantidade}x)
                    {index < item.venda.produtos.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {parcelasOrdenadas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'todos' || periodoFilter !== 'todos'
              ? 'Nenhum recebimento encontrado com os filtros aplicados'
              : 'Nenhum recebimento cadastrado'}
          </p>
        </div>
      )}

      {/* Modal de Lançamento de Recebimento */}
      <Dialog open={showRecebimentoModal} onOpenChange={setShowRecebimentoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receber Pagamento</DialogTitle>
            <DialogDescription>
              Registre o pagamento recebido. O valor será abatido automaticamente das parcelas mais antigas do cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={formRecebimento.clienteId} onValueChange={(value) => setFormRecebimento(prev => ({ ...prev, clienteId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesComParcelas.map((cliente) => {
                    const valorDevendo = todasParcelas
                      .filter(p => p.cliente?.id === cliente.id && p.status !== 'paga')
                      .reduce((acc, p) => acc + p.valorRestante, 0);
                    
                    return (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - Devendo: {formatCurrency(valorDevendo)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="valor">Valor Recebido *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formRecebimento.valor}
                onChange={(e) => setFormRecebimento(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="dataRecebimento">Data do Recebimento *</Label>
              <Input
                id="dataRecebimento"
                type="date"
                value={formRecebimento.dataRecebimento}
                onChange={(e) => setFormRecebimento(prev => ({ ...prev, dataRecebimento: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
              <Select value={formRecebimento.formaPagamento} onValueChange={(value: any) => setFormRecebimento(prev => ({ ...prev, formaPagamento: value }))}>
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

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formRecebimento.observacoes}
                onChange={(e) => setFormRecebimento(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
                placeholder="Observações sobre o recebimento (opcional)"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowRecebimentoModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSalvarRecebimento} className="flex-1 bg-green-600 hover:bg-green-700">
                Confirmar Recebimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico de Recebimentos */}
      <Dialog open={showHistoricoModal} onOpenChange={setShowHistoricoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Recebimentos</DialogTitle>
            <DialogDescription>
              Todos os pagamentos recebidos para esta parcela
            </DialogDescription>
          </DialogHeader>

          {clienteSelecionado && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{clienteSelecionado.cliente?.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Parcela {clienteSelecionado.numero} - {formatCurrency(clienteSelecionado.valorOriginal)}
                </p>
              </div>

              <div className="space-y-3">
                {clienteSelecionado.recebimentos && clienteSelecionado.recebimentos.length > 0 ? (
                  clienteSelecionado.recebimentos.map((recebimento: Recebimento) => (
                    <Card key={recebimento.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{formatCurrency(recebimento.valor)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(recebimento.createdAt)} • {recebimento.formaPagamento}
                          </p>
                          {recebimento.observacoes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {recebimento.observacoes}
                            </p>
                          )}
                        </div>
                        <Badge variant="default">Pago</Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum recebimento registrado
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowHistoricoModal(false)} className="flex-1">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}