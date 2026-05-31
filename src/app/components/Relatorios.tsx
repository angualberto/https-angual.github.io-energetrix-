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
  tipoRelatorio: 'vendas' | 'financeiro' | 'clientes' | 'previsao';
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
    // Obter todas as parcelas pendentes de vendas filtradas
    const parcelasPendentes = vendasFiltradas
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
        venda: vendasFiltradas.find(v => v.parcelas?.some(p => p.id === parcela.id)),
        cliente: clientes.find(c => {
          const venda = vendasFiltradas.find(v => v.parcelas?.some(p => p.id === parcela.id));
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios personalizados de vendas, financeiro e clientes</p>
      </div>

      {/* Configuração de Filtros */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Configuração do Relatório</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Label htmlFor="clienteSelecionado">Cliente</Label>
              <Select 
                value={filtros.clienteSelecionado} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, clienteSelecionado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {filtros.tipoRelatorio !== 'previsao' && (
          <div className="mt-6">
            <Label className="text-base font-medium">Dados para Incluir</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-clientes"
                  checked={filtros.dadosIncluir.clientes}
                  onCheckedChange={(checked) => 
                    setFiltros(prev => ({
                      ...prev,
                      dadosIncluir: { ...prev.dadosIncluir, clientes: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="incluir-clientes">Clientes</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-pagamentos"
                  checked={filtros.dadosIncluir.pagamentos}
                  onCheckedChange={(checked) => 
                    setFiltros(prev => ({
                      ...prev,
                      dadosIncluir: { ...prev.dadosIncluir, pagamentos: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="incluir-pagamentos">Pagamentos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-produtos"
                  checked={filtros.dadosIncluir.produtos}
                  onCheckedChange={(checked) => 
                    setFiltros(prev => ({
                      ...prev,
                      dadosIncluir: { ...prev.dadosIncluir, produtos: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="incluir-produtos">Produtos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-lucros"
                  checked={filtros.dadosIncluir.lucros}
                  onCheckedChange={(checked) => 
                    setFiltros(prev => ({
                      ...prev,
                      dadosIncluir: { ...prev.dadosIncluir, lucros: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="incluir-lucros">Lucros</Label>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button onClick={handleGerarRelatorio} className="bg-primary text-primary-foreground">
            <Eye className="w-4 h-4 mr-2" />
            Visualizar Relatório
          </Button>
          
          {relatorioVisualizado && (
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>
      </Card>

      {/* Visualização do Relatório */}
      {showVisualizacao && relatorioVisualizado && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">{relatorioVisualizado.tipo}</h2>
              <p className="text-muted-foreground">Período: {relatorioVisualizado.periodo}</p>
            </div>
            <Button variant="outline" onClick={() => setShowVisualizacao(false)}>
              Fechar
            </Button>
          </div>

          {filtros.tipoRelatorio === 'vendas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Total de Vendas</span>
                  </div>
                  <p className="text-2xl font-semibold">{relatorioVisualizado.resumo.totalVendas}</p>
                </Card>
                
                {filtros.dadosIncluir.lucros && (
                  <>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Valor Total</span>
                      </div>
                      <p className="text-2xl font-semibold">{formatCurrency(relatorioVisualizado.resumo.totalValor)}</p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium">Lucro Total</span>
                      </div>
                      <p className="text-2xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.resumo.totalLucro)}</p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Margem de Lucro</span>
                      </div>
                      <p className="text-2xl font-semibold">{relatorioVisualizado.resumo.margemLucro.toFixed(2)}%</p>
                    </Card>
                  </>
                )}
              </div>

              {filtros.dadosIncluir.produtos && (
                <div>
                  <h3 className="font-semibold mb-4">Produtos Mais Vendidos</h3>
                  <div className="space-y-2">
                    {relatorioVisualizado.produtosMaisVendidos.slice(0, 5).map(([nome, dados]: [string, any], index: number) => (
                      <div key={nome} className="flex justify-between items-center py-2 border-b border-border">
                        <div>
                          <span className="font-medium">#{index + 1} {nome}</span>
                          <span className="text-muted-foreground ml-2">({dados.quantidade} unidades)</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(dados.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {filtros.tipoRelatorio === 'financeiro' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <span className="text-sm font-medium">Total Receitas</span>
                  <p className="text-2xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.resumo.totalReceitas)}</p>
                </Card>
                <Card className="p-4">
                  <span className="text-sm font-medium">Total Custos</span>
                  <p className="text-2xl font-semibold text-red-600">{formatCurrency(relatorioVisualizado.resumo.totalCustos)}</p>
                </Card>
                <Card className="p-4">
                  <span className="text-sm font-medium">Lucro Líquido</span>
                  <p className="text-2xl font-semibold text-blue-600">{formatCurrency(relatorioVisualizado.resumo.lucroLiquido)}</p>
                </Card>
                <Card className="p-4">
                  <span className="text-sm font-medium">Valor Pendente</span>
                  <p className="text-2xl font-semibold text-yellow-600">{formatCurrency(relatorioVisualizado.resumo.valorPendente)}</p>
                </Card>
              </div>

              {filtros.dadosIncluir.pagamentos && (
                <div>
                  <h3 className="font-semibold mb-4">Análise de Recebimentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <span className="text-sm text-muted-foreground">Valor Recebido</span>
                      <p className="text-xl font-semibold text-green-600">{formatCurrency(relatorioVisualizado.resumo.valorRecebido)}</p>
                    </Card>
                    <Card className="p-4">
                      <span className="text-sm text-muted-foreground">Valor Vencido</span>
                      <p className="text-xl font-semibold text-red-600">{formatCurrency(relatorioVisualizado.resumo.valorVencido)}</p>
                    </Card>
                    <Card className="p-4">
                      <span className="text-sm text-muted-foreground">Parcelas Vencidas</span>
                      <p className="text-xl font-semibold text-orange-600">{relatorioVisualizado.resumo.parcelasVencidas}</p>
                    </Card>
                  </div>
                </div>
              )}

              {relatorioVisualizado.fluxoPorMes && Object.keys(relatorioVisualizado.fluxoPorMes).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Fluxo de Caixa por Mês</h3>
                  <div className="space-y-2">
                    {Object.entries(relatorioVisualizado.fluxoPorMes).map(([mes, dados]: [string, any]) => (
                      <div key={mes} className="flex justify-between items-center py-2 border-b border-border">
                        <span className="font-medium">{mes}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600">R: {formatCurrency(dados.receitas)}</span>
                          <span className="text-red-600">C: {formatCurrency(dados.custos)}</span>
                          <span className="text-blue-600 font-medium">L: {formatCurrency(dados.lucro)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatorioVisualizado.vendasAnalisadas === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma venda encontrada no período selecionado</p>
                </div>
              )}
            </div>
          )}

          {filtros.tipoRelatorio === 'clientes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <span className="text-sm font-medium">Total Clientes</span>
                  <p className="text-2xl font-semibold">{relatorioVisualizado.resumo.totalClientes}</p>
                </Card>
                <Card className="p-4">
                  <span className="text-sm font-medium">Clientes Ativos</span>
                  <p className="text-2xl font-semibold text-green-600">{relatorioVisualizado.resumo.clientesAtivos}</p>
                </Card>
                <Card className="p-4">
                  <span className="text-sm font-medium">Clientes Inativos</span>
                  <p className="text-2xl font-semibold text-red-600">{relatorioVisualizado.resumo.clientesInativos}</p>
                </Card>
                <Card className="p-4">
                  <span className="text-sm font-medium">Ticket Médio</span>
                  <p className="text-2xl font-semibold text-blue-600">{formatCurrency(relatorioVisualizado.resumo.ticketMedio)}</p>
                </Card>
              </div>

              {relatorioVisualizado.topClientes && relatorioVisualizado.topClientes.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-4">Top 10 Clientes por Valor</h3>
                  <div className="space-y-2">
                    {relatorioVisualizado.topClientes.slice(0, 10).map((item: any, index: number) => (
                      <div key={item.cliente?.id || index} className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">#{index + 1} {item.cliente?.nome || 'Cliente não identificado'}</span>
                          <div className="text-sm text-muted-foreground">
                            {item.vendas} venda{item.vendas !== 1 ? 's' : ''} • Última compra: {formatDate(item.ultimaCompra)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.valor)}</div>
                          <div className="text-sm text-green-600">Lucro: {formatCurrency(item.lucro)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum cliente com vendas no período selecionado</p>
                </div>
              )}

              {filtros.dadosIncluir.clientes && relatorioVisualizado.clientesInativos && relatorioVisualizado.clientesInativos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">Clientes Inativos no Período</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {relatorioVisualizado.clientesInativos.slice(0, 12).map((cliente: any) => (
                      <div key={cliente.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                      </div>
                    ))}
                  </div>
                  {relatorioVisualizado.clientesInativos.length > 12 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      E mais {relatorioVisualizado.clientesInativos.length - 12} clientes...
                    </p>
                  )}
                </div>
              )}

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Resumo do período:</strong> {relatorioVisualizado.resumo.vendasAnalisadas} vendas analisadas • 
                {relatorioVisualizado.resumo.clientesAtivos} clientes ativos de {relatorioVisualizado.resumo.totalClientes} total
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}