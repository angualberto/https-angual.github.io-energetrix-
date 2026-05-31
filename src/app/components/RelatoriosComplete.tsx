import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Cliente, Venda } from '../types';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { Download, Filter, TrendingUp, DollarSign, Calendar, Users, Eye, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RelatoriosProps {
  vendas: Venda[];
  clientes: Cliente[];
}

interface FiltrosRelatorio {
  dataInicio: string;
  dataFim: string;
  tipoRelatorio: 'vendas' | 'financeiro' | 'clientes' | 'previsao' | 'vendas-individual';
  clienteSelecionado: string; // 'todos' ou ID do cliente
  dadosIncluir: {
    clientes: boolean;
    pagamentos: boolean;
    produtos: boolean;
    lucros: boolean;
  };
}

export function Relatorios({ vendas, clientes }: RelatoriosProps) {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    dataInicio: '',
    dataFim: '',
    tipoRelatorio: 'vendas',
    clienteSelecionado: 'todos',
    dadosIncluir: {
      clientes: true,
      pagamentos: true,
      produtos: true,
      lucros: true
    }
  });

  const [relatorioVisualizado, setRelatorioVisualizado] = useState<any>(null);
  const [showVisualizacao, setShowVisualizacao] = useState(false);

  const vendasFiltradas = vendas.filter(venda => {
    const dataVenda = new Date(venda.createdAt);
    
    const dataInicioMatch = !filtros.dataInicio || dataVenda >= new Date(filtros.dataInicio);
    const dataFimMatch = !filtros.dataFim || dataVenda <= new Date(filtros.dataFim + 'T23:59:59');
    const clienteMatch = filtros.clienteSelecionado === 'todos' || venda.clienteId === filtros.clienteSelecionado;
    
    return dataInicioMatch && dataFimMatch && clienteMatch;
  });

  const gerarRelatorioVendas = () => {
    const totalVendas = vendasFiltradas.length;
    const totalValor = vendasFiltradas.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const totalCusto = vendasFiltradas.reduce((acc, v) => acc + (v.custoTotal || 0), 0);
    const totalLucro = vendasFiltradas.reduce((acc, v) => acc + (v.lucroTotal || 0), 0);
    const margemLucro = totalValor > 0 ? (totalLucro / totalValor) * 100 : 0;

    // Vendas por forma de pagamento
    const vendasPorPagamento = vendasFiltradas.reduce((acc, venda) => {
      const forma = venda.formaPagamento || 'não informado';
      if (!acc[forma]) {
        acc[forma] = { vendas: 0, valor: 0 };
      }
      acc[forma].vendas += 1;
      acc[forma].valor += venda.valorTotal || 0;
      return acc;
    }, {} as Record<string, { vendas: number; valor: number }>);

    // Produtos mais vendidos
    const produtosMaisVendidos = vendasFiltradas
      .flatMap(venda => venda.produtos || [])
      .reduce((acc, produto) => {
        if (!produto || !produto.nome) return acc;
        if (!acc[produto.nome]) {
          acc[produto.nome] = { quantidade: 0, valor: 0 };
        }
        acc[produto.nome].quantidade += produto.quantidade || 0;
        acc[produto.nome].valor += produto.subtotal || 0;
        return acc;
      }, {} as Record<string, { quantidade: number; valor: number }>);

    return {
      tipo: 'Relatório de Vendas',
      periodo: `${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Hoje'}`,
      resumo: {
        totalVendas,
        totalValor,
        totalCusto,
        totalLucro,
        margemLucro
      },
      vendasDetalhadas: vendasFiltradas,
      vendasPorPagamento,
      produtosMaisVendidos: Object.entries(produtosMaisVendidos)
        .sort((a, b) => b[1].quantidade - a[1].quantidade)
        .slice(0, 10)
    };
  };

  const gerarRelatorioFinanceiro = () => {
    const totalReceitas = vendasFiltradas.reduce((acc, v) => acc + v.valorTotal, 0);
    const totalCustos = vendasFiltradas.reduce((acc, v) => acc + v.custoTotal, 0);
    const lucroLiquido = totalReceitas - totalCustos;

    // Análise de recebimentos - verificar se parcelas existem
    const todasParcelas = vendasFiltradas.flatMap(venda => venda.parcelas || []);
    const valorRecebido = todasParcelas.reduce((acc, p) => acc + (p.valorPago || 0), 0);
    const valorPendente = todasParcelas.reduce((acc, p) => acc + (p.valorRestante || 0), 0);
    const parcelasVencidas = todasParcelas.filter(p => {
      if (!p.dataVencimento) return false;
      return new Date(p.dataVencimento) < new Date() && p.status !== 'paga';
    });
    const valorVencido = parcelasVencidas.reduce((acc, p) => acc + (p.valorRestante || 0), 0);

    // Fluxo de caixa por mês
    const fluxoPorMes = vendasFiltradas.reduce((acc, venda) => {
      const mes = new Date(venda.createdAt).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!acc[mes]) {
        acc[mes] = { receitas: 0, custos: 0, lucro: 0 };
      }
      
      acc[mes].receitas += venda.valorTotal || 0;
      acc[mes].custos += venda.custoTotal || 0;
      acc[mes].lucro += venda.lucroTotal || 0;
      
      return acc;
    }, {} as Record<string, { receitas: number; custos: number; lucro: number }>);

    // Recebimentos com verificação de existência
    const recebimentos = todasParcelas
      .flatMap(p => p.recebimentos || [])
      .filter(r => {
        if (!r || !r.createdAt) return false;
        const dataRecebimento = new Date(r.createdAt);
        const dataInicioMatch = !filtros.dataInicio || dataRecebimento >= new Date(filtros.dataInicio);
        const dataFimMatch = !filtros.dataFim || dataRecebimento <= new Date(filtros.dataFim + 'T23:59:59');
        return dataInicioMatch && dataFimMatch;
      });

    return {
      tipo: 'Relatório Financeiro',
      periodo: `${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Hoje'}`,
      resumo: {
        totalReceitas,
        totalCustos,
        lucroLiquido,
        valorRecebido,
        valorPendente,
        valorVencido,
        parcelasVencidas: parcelasVencidas.length
      },
      fluxoPorMes: fluxoPorMes || {},
      recebimentos: recebimentos || [],
      vendasAnalisadas: vendasFiltradas.length
    };
  };

  const gerarRelatorioClientes = () => {
    // Análise por cliente - com verificações de segurança
    const vendasPorCliente = vendasFiltradas.reduce((acc, venda) => {
      const clienteId = venda.clienteId;
      if (!clienteId) return acc; // Pular vendas sem cliente
      
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) return acc; // Pular se cliente não existir
      
      if (!acc[clienteId]) {
        acc[clienteId] = { 
          cliente,
          vendas: 0, 
          valor: 0, 
          lucro: 0,
          ultimaCompra: venda.createdAt,
          formasPagamento: {}
        };
      }
      
      acc[clienteId].vendas += 1;
      acc[clienteId].valor += venda.valorTotal || 0;
      acc[clienteId].lucro += venda.lucroTotal || 0;
      acc[clienteId].ultimaCompra = new Date(venda.createdAt) > new Date(acc[clienteId].ultimaCompra) 
        ? venda.createdAt : acc[clienteId].ultimaCompra;
      
      // Formas de pagamento preferidas
      const forma = venda.formaPagamento || 'não informado';
      if (!acc[clienteId].formasPagamento[forma]) {
        acc[clienteId].formasPagamento[forma] = 0;
      }
      acc[clienteId].formasPagamento[forma] += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const topClientes = Object.values(vendasPorCliente)
      .filter((cliente: any) => cliente && cliente.cliente) // Filtrar clientes válidos
      .sort((a: any, b: any) => (b.valor || 0) - (a.valor || 0));

    // Clientes ativos no período
    const clientesAtivos = new Set(vendasFiltradas.map(v => v.clienteId).filter(id => id));
    
    // Clientes inativos (sem compras no período)
    const clientesInativos = clientes.filter(c => !clientesAtivos.has(c.id));

    // Ticket médio
    const valorTotalVendas = vendasFiltradas.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const ticketMedio = vendasFiltradas.length > 0 ? valorTotalVendas / vendasFiltradas.length : 0;

    return {
      tipo: 'Relatório de Clientes',
      periodo: `${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Hoje'}`,
      resumo: {
        totalClientes: clientes.length,
        clientesAtivos: clientesAtivos.size,
        clientesInativos: clientesInativos.length,
        ticketMedio,
        vendasAnalisadas: vendasFiltradas.length
      },
      topClientes: topClientes || [],
      clientesInativos: clientesInativos || [],
      analisePorCliente: vendasPorCliente || {},
      estatisticas: {
        clienteComMaisVendas: topClientes[0] || null,
        clienteComMaiorValor: topClientes[0] || null
      }
    };
  };

  const gerarRelatorioPrevisao = () => {
    // Para previsão, usar todas as vendas (não filtrar por cliente para ter visão completa)
    const vendasParaPrevisao = vendas.filter(venda => {
      if (filtros.dataInicio || filtros.dataFim) {
        const dataVenda = new Date(venda.createdAt);
        const dataInicioMatch = !filtros.dataInicio || dataVenda >= new Date(filtros.dataInicio);
        const dataFimMatch = !filtros.dataFim || dataVenda <= new Date(filtros.dataFim + 'T23:59:59');
        return dataInicioMatch && dataFimMatch;
      }
      return true;
    });

    // Obter todas as parcelas pendentes
    const parcelasPendentes = vendasParaPrevisao
      .flatMap(venda => venda.parcelas || [])
      .filter(parcela => parcela.status !== 'paga' && parcela.dataVencimento)
      .filter(parcela => new Date(parcela.dataVencimento) >= new Date()); // Apenas futuras

    // Agrupar por mês de vencimento
    const previsaoPorMes = parcelasPendentes.reduce((acc, parcela) => {
      const dataVencimento = new Date(parcela.dataVencimento);
      const mesAno = dataVencimento.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!acc[mesAno]) {
        acc[mesAno] = {
          mes: mesAno,
          totalParcelas: 0,
          valorTotal: 0,
          parcelas: []
        };
      }
      
      acc[mesAno].totalParcelas += 1;
      acc[mesAno].valorTotal += parcela.valorRestante || 0;
      acc[mesAno].parcelas.push({
        ...parcela,
        venda: vendasParaPrevisao.find(v => v.parcelas?.some(p => p.id === parcela.id)),
        cliente: clientes.find(c => {
          const venda = vendasParaPrevisao.find(v => v.parcelas?.some(p => p.id === parcela.id));
          return venda && c.id === venda.clienteId;
        })
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Converter para array e ordenar por data
    const previsaoOrdenada = Object.values(previsaoPorMes)
      .sort((a: any, b: any) => {
        const dataA = new Date(a.parcelas[0]?.dataVencimento || 0);
        const dataB = new Date(b.parcelas[0]?.dataVencimento || 0);
        return dataA.getTime() - dataB.getTime();
      });

    // Dados para o gráfico
    const dadosGrafico = previsaoOrdenada.slice(0, 12).map((item: any) => ({
      mes: item.mes.split(' ')[0], // Apenas o nome do mês
      valor: item.valorTotal,
      parcelas: item.totalParcelas
    }));

    const valorTotalPrevisao = parcelasPendentes.reduce((acc, p) => acc + (p.valorRestante || 0), 0);
    const totalParcelasPendentes = parcelasPendentes.length;

    return {
      tipo: 'Relatório de Previsão de Recebimentos',
      periodo: `A partir de ${formatDate(new Date())}`,
      resumo: {
        valorTotalPrevisao,
        totalParcelasPendentes,
        proximosMeses: previsaoOrdenada.length,
        mediaRecebimentoMensal: previsaoOrdenada.length > 0 ? valorTotalPrevisao / Math.min(12, previsaoOrdenada.length) : 0
      },
      previsaoPorMes: previsaoOrdenada,
      dadosGrafico,
      parcelasPendentes
    };
  };

  const gerarRelatorioVendasIndividual = () => {
    // Verificar se um cliente específico foi selecionado
    if (filtros.clienteSelecionado === 'todos') {
      return {
        tipo: 'Relatório de Vendas Individual',
        erro: 'Por favor, selecione um cliente específico para gerar este relatório.'
      };
    }

    const clienteSelecionado = clientes.find(c => c.id === filtros.clienteSelecionado);
    if (!clienteSelecionado) {
      return {
        tipo: 'Relatório de Vendas Individual',
        erro: 'Cliente não encontrado.'
      };
    }

    // Vendas do cliente específico no período
    const vendasDoCliente = vendasFiltradas.filter(venda => venda.clienteId === filtros.clienteSelecionado);
    
    // Obter todas as parcelas das vendas do cliente
    const todasParcelasCliente = vendasDoCliente.flatMap(venda => venda.parcelas || []);
    
    // Criar array unificado de todas as parcelas a receber com suas informações
    const todasParcelas = todasParcelasCliente.map(parcela => {
      let status: 'pago' | 'previsto' | 'vencido';
      let valor: number;
      
      if (parcela.status === 'paga') {
        status = 'pago';
        valor = parcela.valorPago || 0;
      } else if (parcela.status === 'aberta' && new Date(parcela.dataVencimento || '') >= new Date()) {
        status = 'previsto';
        valor = parcela.valorRestante || 0;
      } else {
        status = 'vencido';
        valor = parcela.valorRestante || 0;
      }
      
      return {
        data: parcela.dataVencimento,
        valor,
        status,
        parcela,
        vendaId: vendasDoCliente.find(v => v.parcelas?.some(p => p.id === parcela.id))?.id
      };
    });
    
    // Ordenar todas as parcelas por data cronológica
    const parcelasOrdenadas = todasParcelas.sort((a, b) => {
      const dataA = new Date(a.data || '').getTime();
      const dataB = new Date(b.data || '').getTime();
      return dataA - dataB;
    });
    
    // Agrupar por data e somar valores das parcelas com mesmo vencimento
    const parcelasAgrupadas = parcelasOrdenadas.reduce((acc, parcela) => {
      const dataKey = parcela.data || '';
      
      if (!acc[dataKey]) {
        acc[dataKey] = {
          data: parcela.data,
          pagos: 0,
          previstos: 0,
          vencidos: 0,
          parcelas: []
        };
      }
      
      acc[dataKey].parcelas.push(parcela);
      
      if (parcela.status === 'pago') {
        acc[dataKey].pagos += parcela.valor;
      } else if (parcela.status === 'previsto') {
        acc[dataKey].previstos += parcela.valor;
      } else if (parcela.status === 'vencido') {
        acc[dataKey].vencidos += parcela.valor;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Converter para array e manter ordem cronológica
    const recebimentosConsolidados = Object.values(parcelasAgrupadas)
      .sort((a: any, b: any) => {
        const dataA = new Date(a.data || '').getTime();
        const dataB = new Date(b.data || '').getTime();
        return dataA - dataB;
      });
    
    // Separar por status para manter compatibilidade com exibição atual
    const recebimentosPagos = recebimentosConsolidados
      .filter((r: any) => r.pagos > 0)
      .map((r: any) => ({
        data: r.data,
        valor: r.pagos,
        status: 'pago' as const,
        parcelas: r.parcelas.filter((p: any) => p.status === 'pago')
      }));

    const recebimentosPrevistos = recebimentosConsolidados
      .filter((r: any) => r.previstos > 0)
      .map((r: any) => ({
        data: r.data,
        valor: r.previstos,
        status: 'previsto' as const,
        parcelas: r.parcelas.filter((p: any) => p.status === 'previsto')
      }));

    const recebimentosVencidos = recebimentosConsolidados
      .filter((r: any) => r.vencidos > 0)
      .map((r: any) => ({
        data: r.data,
        valor: r.vencidos,
        status: 'vencido' as const,
        parcelas: r.parcelas.filter((p: any) => p.status === 'vencido')
      }));

    // Consolidar valores
    const totalCompras = vendasDoCliente.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const totalRecebido = recebimentosPagos.reduce((acc, r) => acc + r.valor, 0);
    const totalPrevisto = recebimentosPrevistos.reduce((acc, r) => acc + r.valor, 0);
    const totalVencido = recebimentosVencidos.reduce((acc, r) => acc + r.valor, 0);

    return {
      tipo: 'Relatório de Vendas Individual',
      cliente: clienteSelecionado,
      periodo: `${filtros.dataInicio || 'Início'} até ${filtros.dataFim || 'Hoje'}`,
      vendasDetalhadas: vendasDoCliente,
      recebimentos: {
        pagos: recebimentosPagos,
        previstos: recebimentosPrevistos,
        vencidos: recebimentosVencidos
      },
      recebimentosConsolidados,
      consolidado: {
        totalCompras,
        totalRecebido,
        totalPrevisto,
        totalVencido
      }
    };
  };

  const handleGerarRelatorio = () => {
    let relatorio;
    
    switch (filtros.tipoRelatorio) {
      case 'vendas':
        relatorio = gerarRelatorioVendas();
        break;
      case 'financeiro':
        relatorio = gerarRelatorioFinanceiro();
        break;
      case 'clientes':
        relatorio = gerarRelatorioClientes();
        break;
      case 'previsao':
        relatorio = gerarRelatorioPrevisao();
        break;
      case 'vendas-individual':
        relatorio = gerarRelatorioVendasIndividual();
        break;
      default:
        relatorio = gerarRelatorioVendas();
    }
    
    setRelatorioVisualizado(relatorio);
    setShowVisualizacao(true);
  };

  const handleDownloadPDF = () => {
    if (!relatorioVisualizado) return;

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${relatorioVisualizado.tipo}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .resumo { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .valor { font-size: 1.5em; font-weight: bold; color: #6366f1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .text-green { color: #10b981; }
        .text-red { color: #ef4444; }
        .text-blue { color: #3b82f6; }
        .rodape { margin-top: 40px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>${relatorioVisualizado.tipo.toUpperCase()}</h1>
    <p><strong>Período:</strong> ${relatorioVisualizado.periodo}</p>
    <p><strong>Gerado em:</strong> ${formatDate(new Date())}</p>
    `;

    // Adicionar conteúdo específico baseado no tipo de relatório
    if (filtros.tipoRelatorio === 'vendas') {
      htmlContent += `
    <h2>RESUMO GERAL</h2>
    <div class="resumo">
        <div class="card">
            <h3>Total de Vendas</h3>
            <div class="valor">${relatorioVisualizado.resumo.totalVendas}</div>
        </div>
        ${filtros.dadosIncluir.lucros ? `
        <div class="card">
            <h3>Valor Total</h3>
            <div class="valor">${formatCurrency(relatorioVisualizado.resumo.totalValor)}</div>
        </div>
        <div class="card">
            <h3>Lucro Total</h3>
            <div class="valor text-green">${formatCurrency(relatorioVisualizado.resumo.totalLucro)}</div>
        </div>
        <div class="card">
            <h3>Margem de Lucro</h3>
            <div class="valor">${relatorioVisualizado.resumo.margemLucro.toFixed(2)}%</div>
        </div>
        ` : ''}
    </div>
    `;

      if (filtros.dadosIncluir.produtos) {
        htmlContent += `
    <h2>PRODUTOS MAIS VENDIDOS</h2>
    <table>
        <thead>
            <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Valor Total</th>
            </tr>
        </thead>
        <tbody>
            ${relatorioVisualizado.produtosMaisVendidos.map(([nome, dados]: [string, any]) => `
                <tr>
                    <td>${nome}</td>
                    <td>${dados.quantidade}</td>
                    <td>${formatCurrency(dados.valor)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
        `;
      }

      if (filtros.dadosIncluir.clientes) {
        htmlContent += `
    <h2>VENDAS DETALHADAS</h2>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Valor Total</th>
                ${filtros.dadosIncluir.lucros ? '<th>Lucro</th>' : ''}
                ${filtros.dadosIncluir.pagamentos ? '<th>Pagamento</th>' : ''}
            </tr>
        </thead>
        <tbody>
            ${relatorioVisualizado.vendasDetalhadas.map((venda: Venda) => {
              const cliente = clientes.find(c => c.id === venda.clienteId);
              return `
                <tr>
                    <td>${formatDate(venda.createdAt)}</td>
                    <td>${cliente?.nome || 'Cliente não encontrado'}</td>
                    <td>${formatCurrency(venda.valorTotal)}</td>
                    ${filtros.dadosIncluir.lucros ? `<td class="text-green">${formatCurrency(venda.lucroTotal)}</td>` : ''}
                    ${filtros.dadosIncluir.pagamentos ? `<td>${venda.formaPagamento}</td>` : ''}
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>
        `;
      }
    }

    // Adicionar conteúdo para relatório financeiro
    if (filtros.tipoRelatorio === 'financeiro') {
      htmlContent += `
    <h2>RESUMO FINANCEIRO</h2>
    <div class="resumo">
        <div class="card">
            <h3>Total Receitas</h3>
            <div class="valor text-green">${formatCurrency(relatorioVisualizado.resumo.totalReceitas)}</div>
        </div>
        <div class="card">
            <h3>Total Custos</h3>
            <div class="valor text-red">${formatCurrency(relatorioVisualizado.resumo.totalCustos)}</div>
        </div>
        <div class="card">
            <h3>Lucro Líquido</h3>
            <div class="valor">${formatCurrency(relatorioVisualizado.resumo.lucroLiquido)}</div>
        </div>
        <div class="card">
            <h3>Valor Pendente</h3>
            <div class="valor">${formatCurrency(relatorioVisualizado.resumo.valorPendente)}</div>
        </div>
    </div>
      `;

      if (filtros.dadosIncluir.pagamentos) {
        htmlContent += `
    <h2>ANÁLISE DE RECEBIMENTOS</h2>
    <div class="resumo">
        <div class="card">
            <h3>Valor Recebido</h3>
            <div class="valor text-green">${formatCurrency(relatorioVisualizado.resumo.valorRecebido)}</div>
        </div>
        <div class="card">
            <h3>Valor Vencido</h3>
            <div class="valor text-red">${formatCurrency(relatorioVisualizado.resumo.valorVencido)}</div>
        </div>
        <div class="card">
            <h3>Parcelas Vencidas</h3>
            <div class="valor">${relatorioVisualizado.resumo.parcelasVencidas}</div>
        </div>
    </div>
        `;
      }

      if (relatorioVisualizado.fluxoPorMes && Object.keys(relatorioVisualizado.fluxoPorMes).length > 0) {
        htmlContent += `
    <h2>FLUXO DE CAIXA POR MÊS</h2>
    <table>
        <thead>
            <tr>
                <th>Mês</th>
                <th>Receitas</th>
                <th>Custos</th>
                <th>Lucro</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(relatorioVisualizado.fluxoPorMes).map(([mes, dados]: [string, any]) => `
                <tr>
                    <td>${mes}</td>
                    <td class="text-green">${formatCurrency(dados.receitas)}</td>
                    <td class="text-red">${formatCurrency(dados.custos)}</td>
                    <td>${formatCurrency(dados.lucro)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
        `;
      }
    }

    // Adicionar conteúdo para relatório de clientes
    if (filtros.tipoRelatorio === 'clientes') {
      htmlContent += `
    <h2>RESUMO DE CLIENTES</h2>
    <div class="resumo">
        <div class="card">
            <h3>Total Clientes</h3>
            <div class="valor">${relatorioVisualizado.resumo.totalClientes}</div>
        </div>
        <div class="card">
            <h3>Clientes Ativos</h3>
            <div class="valor text-green">${relatorioVisualizado.resumo.clientesAtivos}</div>
        </div>
        <div class="card">
            <h3>Clientes Inativos</h3>
            <div class="valor text-red">${relatorioVisualizado.resumo.clientesInativos}</div>
        </div>
        <div class="card">
            <h3>Ticket Médio</h3>
            <div class="valor">${formatCurrency(relatorioVisualizado.resumo.ticketMedio)}</div>
        </div>
    </div>
      `;

      if (relatorioVisualizado.topClientes && relatorioVisualizado.topClientes.length > 0) {
        htmlContent += `
    <h2>TOP CLIENTES</h2>
    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Vendas</th>
                <th>Valor Total</th>
                ${filtros.dadosIncluir.lucros ? '<th>Lucro</th>' : ''}
                <th>Última Compra</th>
            </tr>
        </thead>
        <tbody>
            ${relatorioVisualizado.topClientes.slice(0, 10).map((clienteData: any) => `
                <tr>
                    <td>${clienteData.cliente.nome}</td>
                    <td>${clienteData.cliente.telefone || 'N/A'}</td>
                    <td>${clienteData.vendas}</td>
                    <td>${formatCurrency(clienteData.valor)}</td>
                    ${filtros.dadosIncluir.lucros ? `<td class="text-green">${formatCurrency(clienteData.lucro)}</td>` : ''}
                    <td>${formatDate(clienteData.ultimaCompra)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
        `;
      }

      if (relatorioVisualizado.clientesInativos && relatorioVisualizado.clientesInativos.length > 0) {
        htmlContent += `
    <h2>CLIENTES INATIVOS NO PERÍODO</h2>
    <table>
        <thead>
            <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Data de Cadastro</th>
            </tr>
        </thead>
        <tbody>
            ${relatorioVisualizado.clientesInativos.slice(0, 20).map((cliente: any) => `
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.telefone || 'N/A'}</td>
                    <td>${formatDate(cliente.createdAt)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
        `;
      }
    }

    // Adicionar conteúdo para relatório de previsão
    if (filtros.tipoRelatorio === 'previsao') {
      htmlContent += `
    <h2>RESUMO DA PREVISÃO</h2>
    <div class="resumo">
        <div class="card">
            <h3>Valor Total Previsto</h3>
            <div class="valor text-green">${formatCurrency(relatorioVisualizado.resumo.valorTotalPrevisao)}</div>
        </div>
        <div class="card">
            <h3>Total de Parcelas</h3>
            <div class="valor">${relatorioVisualizado.resumo.totalParcelasPendentes}</div>
        </div>
        <div class="card">
            <h3>Próximos Meses</h3>
            <div class="valor">${relatorioVisualizado.resumo.proximosMeses}</div>
        </div>
        <div class="card">
            <h3>Média Mensal</h3>
            <div class="valor">${formatCurrency(relatorioVisualizado.resumo.mediaRecebimentoMensal)}</div>
        </div>
    </div>
      `;

      if (relatorioVisualizado.previsaoPorMes && relatorioVisualizado.previsaoPorMes.length > 0) {
        htmlContent += `
    <h2>PREVISÃO POR MÊS</h2>
    <table>
        <thead>
            <tr>
                <th>Mês</th>
                <th>Parcelas</th>
                <th>Valor Total</th>
            </tr>
        </thead>
        <tbody>
            ${relatorioVisualizado.previsaoPorMes.slice(0, 12).map((item: any) => `
                <tr>
                    <td>${item.mes}</td>
                    <td>${item.totalParcelas}</td>
                    <td class="text-green">${formatCurrency(item.valorTotal)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
        `;
      }
    }

    // Adicionar conteúdo para relatório de vendas individual
    if (filtros.tipoRelatorio === 'vendas-individual') {
      if (relatorioVisualizado.erro) {
        htmlContent += `
    <div class="card" style="background-color: #fee2e2; border-color: #fecaca;">
        <h3 style="color: #dc2626;">Erro</h3>
        <p>${relatorioVisualizado.erro}</p>
    </div>
        `;
      } else {
        htmlContent += `
    <h2>CLIENTE: ${(relatorioVisualizado.cliente?.nome || 'Cliente não encontrado').toUpperCase()}</h2>
    
    <h2>VENDAS DETALHADAS</h2>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Itens</th>
                <th>Total Geral</th>
                <th>Forma de Pagamento</th>
            </tr>
        </thead>
        <tbody>
            ${relatorioVisualizado.vendasDetalhadas.map((venda: Venda) => `
                <tr>
                    <td>${formatDate(venda.createdAt)}</td>
                    <td>
                        ${(venda.produtos || []).map(produto => 
                          `${produto.nome} (${produto.quantidade}x ${formatCurrency(produto.valorUnitario)}) = ${formatCurrency(produto.subtotal)}`
                        ).join('<br>')}
                    </td>
                    <td>${formatCurrency(venda.valorTotal)}</td>
                    <td>${venda.formaPagamento}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>CRONOGRAMA DE RECEBIMENTOS (ORDEM CRONOLÓGICA)</h2>
    <table>
        <thead>
            <tr>
                <th>Data de Vencimento</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Detalhes</th>
            </tr>
        </thead>
        <tbody>
            ${(relatorioVisualizado.recebimentosConsolidados || []).map((rec: any) => {
              const valorTotal = rec.pagos + rec.previstos + rec.vencidos;
              let statusPrincipal = '';
              let corStatus = '';
              
              if (rec.pagos > 0) {
                statusPrincipal = 'Recebido';
                corStatus = '#3b82f6';
              } else if (rec.vencidos > 0) {
                statusPrincipal = 'Em Atraso';
                corStatus = '#ef4444';
              } else if (rec.previstos > 0) {
                statusPrincipal = 'A Receber';
                corStatus = '#10b981';
              }
              
              let detalhes = [];
              if (rec.pagos > 0) detalhes.push(`Pago: ${formatCurrency(rec.pagos)}`);
              if (rec.previstos > 0) detalhes.push(`A Receber: ${formatCurrency(rec.previstos)}`);
              if (rec.vencidos > 0) detalhes.push(`Em Atraso: ${formatCurrency(rec.vencidos)}`);
              detalhes.push(`${rec.parcelas.length} parcela(s)`);
              
              return `
                <tr>
                    <td>${formatDate(rec.data)}</td>
                    <td style="color: ${corStatus}; font-weight: bold;">${formatCurrency(valorTotal)}</td>
                    <td style="color: ${corStatus};">${statusPrincipal}</td>
                    <td style="font-size: 0.85em;">${detalhes.join('<br>')}</td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>
    
    <h2>RESUMO POR STATUS</h2>
    <div class="resumo">
        <div class="card">
            <h3>Total Recebido</h3>
            <div class="valor text-blue">${formatCurrency(relatorioVisualizado.consolidado.totalRecebido)}</div>
            <p style="font-size: 0.8em; color: #666;">${relatorioVisualizado.recebimentos.pagos.length} datas de recebimento</p>
        </div>
        <div class="card">
            <h3>Total a Receber</h3>
            <div class="valor text-green">${formatCurrency(relatorioVisualizado.consolidado.totalPrevisto)}</div>
            <p style="font-size: 0.8em; color: #666;">${relatorioVisualizado.recebimentos.previstos.length} datas futuras</p>
        </div>
        <div class="card">
            <h3>Total em Atraso</h3>
            <div class="valor text-red">${formatCurrency(relatorioVisualizado.consolidado.totalVencido)}</div>
            <p style="font-size: 0.8em; color: #666;">${relatorioVisualizado.recebimentos.vencidos.length} datas vencidas</p>
        </div>
    </div>

    <h2>CONSOLIDADO GERAL</h2>
    <div class="resumo">
        <div class="card">
            <h3>Total de Compras Realizadas</h3>
            <div class="valor text-blue">${formatCurrency(relatorioVisualizado.consolidado.totalCompras)}</div>
        </div>
        <div class="card">
            <h3>Total de Pagamentos Recebidos</h3>
            <div class="valor text-green">${formatCurrency(relatorioVisualizado.consolidado.totalRecebido)}</div>
        </div>
        <div class="card">
            <h3>Total de Parcelas a Receber</h3>
            <div class="valor" style="color: #000;">${formatCurrency(relatorioVisualizado.consolidado.totalPrevisto)}</div>
        </div>
        <div class="card">
            <h3>Total em Atraso</h3>
            <div class="valor text-red">${formatCurrency(relatorioVisualizado.consolidado.totalVencido)}</div>
        </div>
    </div>
        `;
      }
    }
    
    htmlContent += `
    <div class="rodape">
        <p>Relatório gerado automaticamente pelo Sistema de Gestão de Vendas</p>
    </div>
</body>
</html>
    `;
    
    // Abrir em nova janela para impressão/exportação
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Aguardar carregamento e abrir diálogo de impressão
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2">Relatórios</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Gere relatórios personalizados de vendas, financeiro e clientes</p>
      </div>

      {/* Configuração de Filtros */}
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          <h3 className="text-base sm:text-lg font-semibold">Configuração do Relatório</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <Label htmlFor="tipoRelatorio">Tipo de Relatório *</Label>
            <Select 
              value={filtros.tipoRelatorio} 
              onValueChange={(value: any) => setFiltros(prev => ({ ...prev, tipoRelatorio: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendas">Relatório de Vendas</SelectItem>
                <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
                <SelectItem value="clientes">Relatório de Clientes</SelectItem>
                <SelectItem value="previsao">Previsão de Recebimentos</SelectItem>
                <SelectItem value="vendas-individual">Relatório de Vendas Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
            />
          </div>
          
          {filtros.tipoRelatorio !== 'previsao' && (
            <div>
              <Label htmlFor="clienteSelecionado">Cliente {filtros.tipoRelatorio === 'vendas-individual' ? '*' : ''}</Label>
              <Select 
                value={filtros.clienteSelecionado} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, clienteSelecionado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filtros.tipoRelatorio !== 'vendas-individual' && (
                    <SelectItem value="todos">Todos os clientes</SelectItem>
                  )}
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {filtros.tipoRelatorio === 'vendas' && (
            <div className="col-span-full">
              <Label>Dados a Incluir</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir-clientes"
                    checked={filtros.dadosIncluir.clientes}
                    onCheckedChange={(checked) => 
                      setFiltros(prev => ({
                        ...prev,
                        dadosIncluir: { ...prev.dadosIncluir, clientes: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="incluir-clientes">Informações de Clientes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir-pagamentos"
                    checked={filtros.dadosIncluir.pagamentos}
                    onCheckedChange={(checked) => 
                      setFiltros(prev => ({
                        ...prev,
                        dadosIncluir: { ...prev.dadosIncluir, pagamentos: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="incluir-pagamentos">Formas de Pagamento</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir-produtos"
                    checked={filtros.dadosIncluir.produtos}
                    onCheckedChange={(checked) => 
                      setFiltros(prev => ({
                        ...prev,
                        dadosIncluir: { ...prev.dadosIncluir, produtos: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="incluir-produtos">Produtos Mais Vendidos</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir-lucros"
                    checked={filtros.dadosIncluir.lucros}
                    onCheckedChange={(checked) => 
                      setFiltros(prev => ({
                        ...prev,
                        dadosIncluir: { ...prev.dadosIncluir, lucros: !!checked }
                      }))
                    }
                  />
                  <Label htmlFor="incluir-lucros">Análise de Lucros</Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            onClick={handleGerarRelatorio}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Visualizar Relatório
          </Button>
          
          {relatorioVisualizado && (
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          )}
        </div>
      </Card>

      {/* Visualização do Relatório */}
      {showVisualizacao && relatorioVisualizado && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{relatorioVisualizado.tipo}</h2>
            <div className="text-sm text-muted-foreground">
              Período: {relatorioVisualizado.periodo} | Gerado: {formatDate(new Date())}
            </div>
          </div>

          {/* Exibir erro se houver */}
          {relatorioVisualizado.erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">Erro ao gerar relatório</p>
              <p className="text-sm">{relatorioVisualizado.erro}</p>
            </div>
          )}

          {/* Vendas Individual */}
          {filtros.tipoRelatorio === 'vendas-individual' && !relatorioVisualizado.erro && (
            <div className="space-y-8">
              {/* Nome do Cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Cliente: {relatorioVisualizado.cliente?.nome || 'Cliente não encontrado'}</h3>
              </div>

              {/* Vendas Detalhadas */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Vendas Detalhadas
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left">Data</th>
                        <th className="border border-border p-3 text-left">Itens</th>
                        <th className="border border-border p-3 text-left">Total Geral</th>
                        <th className="border border-border p-3 text-left">Forma de Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorioVisualizado.vendasDetalhadas.map((venda: Venda) => (
                        <tr key={venda.id}>
                          <td className="border border-border p-3">{formatDate(venda.createdAt)}</td>
                          <td className="border border-border p-3">
                            {(venda.produtos || []).map((produto, index) => (
                              <div key={index} className="text-sm">
                                {produto.nome} ({produto.quantidade}x {formatCurrency(produto.valorUnitario)}) = {formatCurrency(produto.subtotal)}
                              </div>
                            ))}
                          </td>
                          <td className="border border-border p-3 font-semibold">{formatCurrency(venda.valorTotal)}</td>
                          <td className="border border-border p-3">{venda.formaPagamento}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recebimentos */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Cronograma de Recebimentos (Ordem Cronológica)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left">Data de Vencimento</th>
                        <th className="border border-border p-3 text-left">Valor Total</th>
                        <th className="border border-border p-3 text-left">Status</th>
                        <th className="border border-border p-3 text-left">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorioVisualizado.recebimentosConsolidados?.map((rec: any, index: number) => {
                        // Determinar status dominante para esta data
                        let statusPrincipal = '';
                        let corStatus = '';
                        let valorPrincipal = 0;
                        
                        if (rec.pagos > 0) {
                          statusPrincipal = 'Recebido';
                          corStatus = 'text-blue-600';
                          valorPrincipal = rec.pagos;
                        } else if (rec.vencidos > 0) {
                          statusPrincipal = 'Em Atraso';
                          corStatus = 'text-red-600';
                          valorPrincipal = rec.vencidos;
                        } else if (rec.previstos > 0) {
                          statusPrincipal = 'A Receber';
                          corStatus = 'text-green-600';
                          valorPrincipal = rec.previstos;
                        }
                        
                        const valorTotal = rec.pagos + rec.previstos + rec.vencidos;
                        
                        return (
                          <tr key={`consolidado-${index}`}>
                            <td className="border border-border p-3">{formatDate(rec.data)}</td>
                            <td className={`border border-border p-3 font-semibold ${corStatus}`}>
                              {formatCurrency(valorTotal)}
                            </td>
                            <td className={`border border-border p-3 ${corStatus}`}>
                              {statusPrincipal}
                            </td>
                            <td className="border border-border p-3 text-sm">
                              {rec.pagos > 0 && (
                                <div className="text-blue-600">Pago: {formatCurrency(rec.pagos)}</div>
                              )}
                              {rec.previstos > 0 && (
                                <div className="text-green-600">A Receber: {formatCurrency(rec.previstos)}</div>
                              )}
                              {rec.vencidos > 0 && (
                                <div className="text-red-600">Em Atraso: {formatCurrency(rec.vencidos)}</div>
                              )}
                              <div className="text-muted-foreground mt-1">
                                {rec.parcelas.length} parcela(s) de {rec.parcelas.length > 1 ? 'vendas diferentes' : 'uma venda'}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Resumo por Status */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total Recebido</div>
                    <div className="text-xl font-semibold text-blue-600">{formatCurrency(relatorioVisualizado.consolidado.totalRecebido)}</div>
                    <div className="text-xs text-muted-foreground">{relatorioVisualizado.recebimentos.pagos.length} datas de recebimento</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total a Receber</div>
                    <div className="text-xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.consolidado.totalPrevisto)}</div>
                    <div className="text-xs text-muted-foreground">{relatorioVisualizado.recebimentos.previstos.length} datas futuras</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total em Atraso</div>
                    <div className="text-xl font-semibold text-red-600">{formatCurrency(relatorioVisualizado.consolidado.totalVencido)}</div>
                    <div className="text-xs text-muted-foreground">{relatorioVisualizado.recebimentos.vencidos.length} datas vencidas</div>
                  </Card>
                </div>
              </div>

              {/* Consolidado Geral */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Consolidado Geral
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total de Compras Realizadas</div>
                    <div className="text-2xl font-semibold text-blue-600">{formatCurrency(relatorioVisualizado.consolidado.totalCompras)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total de Pagamentos Recebidos</div>
                    <div className="text-2xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.consolidado.totalRecebido)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total de Parcelas a Receber</div>
                    <div className="text-2xl font-semibold text-black">{formatCurrency(relatorioVisualizado.consolidado.totalPrevisto)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total em Atraso</div>
                    <div className="text-2xl font-semibold text-red-600">{formatCurrency(relatorioVisualizado.consolidado.totalVencido)}</div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Outros tipos de relatório continuam iguais... */}
          {filtros.tipoRelatorio === 'vendas' && (
            <div className="space-y-8">
              {/* Resumo Geral */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumo Geral
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total de Vendas</div>
                    <div className="text-2xl font-semibold">{relatorioVisualizado.resumo.totalVendas}</div>
                  </Card>
                  {filtros.dadosIncluir.lucros && (
                    <>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Valor Total</div>
                        <div className="text-2xl font-semibold">{formatCurrency(relatorioVisualizado.resumo.totalValor)}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Lucro Total</div>
                        <div className="text-2xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.resumo.totalLucro)}</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm text-muted-foreground">Margem de Lucro</div>
                        <div className="text-2xl font-semibold">{relatorioVisualizado.resumo.margemLucro.toFixed(2)}%</div>
                      </Card>
                    </>
                  )}
                </div>
              </div>

              {/* Produtos Mais Vendidos */}
              {filtros.dadosIncluir.produtos && relatorioVisualizado.produtosMaisVendidos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Produtos Mais Vendidos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-3 text-left">Produto</th>
                          <th className="border border-border p-3 text-left">Quantidade</th>
                          <th className="border border-border p-3 text-left">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioVisualizado.produtosMaisVendidos.map(([nome, dados]: [string, any]) => (
                          <tr key={nome}>
                            <td className="border border-border p-3">{nome}</td>
                            <td className="border border-border p-3">{dados.quantidade}</td>
                            <td className="border border-border p-3">{formatCurrency(dados.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Vendas Detalhadas */}
              {filtros.dadosIncluir.clientes && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Vendas Detalhadas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-3 text-left">Data</th>
                          <th className="border border-border p-3 text-left">Cliente</th>
                          <th className="border border-border p-3 text-left">Valor Total</th>
                          {filtros.dadosIncluir.lucros && <th className="border border-border p-3 text-left">Lucro</th>}
                          {filtros.dadosIncluir.pagamentos && <th className="border border-border p-3 text-left">Pagamento</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioVisualizado.vendasDetalhadas.map((venda: Venda) => {
                          const cliente = clientes.find(c => c.id === venda.clienteId);
                          return (
                            <tr key={venda.id}>
                              <td className="border border-border p-3">{formatDate(venda.createdAt)}</td>
                              <td className="border border-border p-3">{cliente?.nome || 'Cliente não encontrado'}</td>
                              <td className="border border-border p-3">{formatCurrency(venda.valorTotal)}</td>
                              {filtros.dadosIncluir.lucros && (
                                <td className="border border-border p-3 text-green-600">{formatCurrency(venda.lucroTotal)}</td>
                              )}
                              {filtros.dadosIncluir.pagamentos && (
                                <td className="border border-border p-3">{venda.formaPagamento}</td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outros relatórios (financeiro, clientes, previsão) continuam aqui... */}
          {filtros.tipoRelatorio === 'previsao' && (
            <div className="space-y-8">
              {/* Resumo Executivo */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resumo Executivo
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Valor Total Previsto</div>
                    <div className="text-2xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.resumo.valorTotalPrevisao)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total de Parcelas</div>
                    <div className="text-2xl font-semibold">{relatorioVisualizado.resumo.totalParcelasPendentes}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Próximos Meses</div>
                    <div className="text-2xl font-semibold">{relatorioVisualizado.resumo.proximosMeses}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Média Mensal</div>
                    <div className="text-2xl font-semibold">{formatCurrency(relatorioVisualizado.resumo.mediaRecebimentoMensal)}</div>
                  </Card>
                </div>
              </div>

              {/* Gráfico de Previsão */}
              {relatorioVisualizado.dadosGrafico && relatorioVisualizado.dadosGrafico.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Previsão de Recebimentos (Próximos 12 Meses)</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorioVisualizado.dadosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'valor' ? formatCurrency(Number(value)) : value,
                            name === 'valor' ? 'Valor Previsto' : 'Parcelas'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="valor" fill="#10b981" name="Valor Previsto" />
                        <Bar dataKey="parcelas" fill="#6366f1" name="Número de Parcelas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tabela Detalhada */}
              {relatorioVisualizado.previsaoPorMes && relatorioVisualizado.previsaoPorMes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalhamento por Mês</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-3 text-left">Mês</th>
                          <th className="border border-border p-3 text-left">Parcelas</th>
                          <th className="border border-border p-3 text-left">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioVisualizado.previsaoPorMes.slice(0, 12).map((item: any) => (
                          <tr key={item.mes}>
                            <td className="border border-border p-3">{item.mes}</td>
                            <td className="border border-border p-3">{item.totalParcelas}</td>
                            <td className="border border-border p-3 text-green-600 font-semibold">{formatCurrency(item.valorTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}