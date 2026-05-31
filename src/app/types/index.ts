export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  endereco?: string; // Campo legado para compatibilidade
  createdAt: Date;
}

export interface ProdutoPedido {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  custoUnitario: number;
  subtotal: number;
  custoTotal: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  cliente?: Cliente;
  produtos: ProdutoPedido[];
  valorTotal: number;
  custoTotal: number;
  lucroTotal: number;
  observacoes?: string;
  status: 'pendente' | 'convertido';
  createdAt: Date;
}

export interface Parcela {
  id: string;
  numero: number;
  valorOriginal: number;
  valorPago: number;
  valorRestante: number;
  dataVencimento: Date;
  status: 'aberta' | 'paga' | 'parcial';
  recebimentos: Recebimento[];
}

export interface Venda {
  id: string;
  pedidoId: string;
  clienteId: string;
  cliente?: Cliente;
  produtos: ProdutoPedido[];
  valorTotal: number;
  custoTotal: number;
  lucroTotal: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia' | 'parcelado';
  tipoParcelamento?: 'quinzenal' | 'mensal';
  numeroParcelas?: number;
  parcelas: Parcela[];
  status: 'pendente' | 'paga' | 'parcial';
  createdAt: Date;
}

export interface Recebimento {
  id: string;
  vendaId: string;
  parcelaId: string;
  valor: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
  observacoes?: string;
  createdAt: Date;
}

export interface RelatorioFiltros {
  dataInicio?: Date;
  dataFim?: Date;
  clienteId?: string;
  formaPagamento?: string;
  status?: string;
}