import { useState } from 'react';
import { Card } from './ui/card';
import { Cliente, Pedido, Venda } from '../types';
import { CalendarDays, CloudSun, Coins, ShoppingBasket, SunMedium, Wind } from 'lucide-react';

interface DashboardProps {
  clientes: Cliente[];
  pedidos: Pedido[];
  vendas: Venda[];
  useSupabase?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onReloadData?: () => void;
}

export function Dashboard({ 
  clientes,
  pedidos,
  vendas,
  useSupabase = true,
  isLoading = false,
  error = null,
  onReloadData = () => {}
}: DashboardProps) {
  void clientes;
  void pedidos;
  void vendas;
  void useSupabase;
  void isLoading;
  void error;
  void onReloadData;

  const agora = new Date();
  const dataHoraAtual = `${agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })} - ${agora.toLocaleTimeString('pt-BR')}`;

  const formatarParaInputData = (dataBR: string) => {
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  const formatarParaDataBR = (dataISO: string) => {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const dataPadrao = '2026-11-01';
  const [dataSelecionada, setDataSelecionada] = useState<string>(dataPadrao);
  const [modoNegocio, setModoNegocio] = useState<'compra' | 'venda'>('venda');
  const [demandaKwhInput, setDemandaKwhInput] = useState('20');
  const [precoPropostoInput, setPrecoPropostoInput] = useState('0,39');

  const predicaoSemana = [
    { dia: 'sábado', data: '30/05/2026', status: '🔵 Excedente Comercial', geracao: '999,4 kWh', tarifa: 'R$ 0,36' },
    { dia: 'domingo', data: '31/05/2026', status: '🔵 Excedente Comercial', geracao: '1067,5 kWh', tarifa: 'R$ 0,36' },
    { dia: 'segunda-feira', data: '01/06/2026', status: '🟢 Superavit', geracao: '841,5 kWh', tarifa: 'R$ 0,43' },
    { dia: 'terça-feira', data: '02/06/2026', status: '🟢 Superavit', geracao: '692,0 kWh', tarifa: 'R$ 0,43' },
    { dia: 'quarta-feira', data: '03/06/2026', status: '🟢 Superavit', geracao: '1039,1 kWh', tarifa: 'R$ 0,36' },
    { dia: 'quinta-feira', data: '04/06/2026', status: '🟢 Superavit', geracao: '926,3 kWh', tarifa: 'R$ 0,43' },
    { dia: 'sexta-feira', data: '05/06/2026', status: '🟢 Superavit', geracao: '778,2 kWh', tarifa: 'R$ 0,43' }
  ];

  const equipamentos = [
    {
      nome: 'Nó Beta',
      tag: 'Alta',
      local: 'Zona Norte · 5,1 km',
      potencia: '6,2 kW',
      energia: '32,1 kWh',
      receita: 'R$ 23,15',
      reserva: 'Livre',
      icon: '☀'
    },
    {
      nome: 'Nó Delta',
      tag: 'Uso local',
      local: 'Zona Oeste · 7,2 km',
      potencia: '5,9 kW',
      energia: '30,6 kWh',
      receita: 'R$ 22,03',
      reserva: 'Livre',
      icon: '⚡'
    },
    {
      nome: 'Nó Alfa',
      tag: 'Reserva verde',
      local: 'Centro · 2,3 km',
      potencia: '4,8 kW',
      energia: '24,9 kWh',
      receita: 'R$ 17,92',
      reserva: 'Livre',
      icon: '🌿'
    },
    {
      nome: 'Nó Épsilon',
      tag: 'Pico solar',
      local: 'Centro · 3,5 km',
      potencia: '4,1 kW',
      energia: '21,3 kWh',
      receita: 'R$ 15,31',
      reserva: 'Livre',
      icon: '🔋'
    },
    {
      nome: 'Nó Gama',
      tag: 'Estoque extra',
      local: 'Zona Sul · 1,8 km',
      potencia: '3,5 kW',
      energia: '18,1 kWh',
      receita: 'R$ 13,07',
      reserva: 'Livre',
      icon: '🏷'
    }
  ];

  const cargasComprador = [
    {
      nome: 'Casa Beta',
      perfil: 'Residencial',
      tipo: 'Eletrodomésticos',
      local: 'Zona Norte · 5,1 km',
      potencia: '6,2 kW',
      usoMedio: '5,2 h/dia',
      consumoEstimado: '32,1 kWh/dia',
      demanda: 'Média',
      icon: '🏠'
    },
    {
      nome: 'Loja Delta',
      perfil: 'Comercial',
      tipo: 'Refrigeração e iluminação',
      local: 'Zona Oeste · 7,2 km',
      potencia: '5,9 kW',
      usoMedio: '5,1 h/dia',
      consumoEstimado: '30,6 kWh/dia',
      demanda: 'Alta',
      icon: '🏪'
    },
    {
      nome: 'Condomínio Alfa',
      perfil: 'Residencial',
      tipo: 'Bomba, elevador e áreas comuns',
      local: 'Centro · 2,3 km',
      potencia: '4,8 kW',
      usoMedio: '5,2 h/dia',
      consumoEstimado: '24,9 kWh/dia',
      demanda: 'Média',
      icon: '🏢'
    },
    {
      nome: 'Fábrica Épsilon',
      perfil: 'Industrial',
      tipo: 'Linha de produção',
      local: 'Centro · 3,5 km',
      potencia: '4,1 kW',
      usoMedio: '5,2 h/dia',
      consumoEstimado: '21,3 kWh/dia',
      demanda: 'Alta',
      icon: '🏭'
    },
    {
      nome: 'Oficina Gama',
      perfil: 'Comercial',
      tipo: 'Máquinas e ferramentas',
      local: 'Zona Sul · 1,8 km',
      potencia: '3,5 kW',
      usoMedio: '5,2 h/dia',
      consumoEstimado: '18,1 kWh/dia',
      demanda: 'Média',
      icon: '🔧'
    }
  ];

  const numeroBR = (valorComUnidade: string) => Number(valorComUnidade.replace(',', '.').replace(/[^\d.]/g, ''));
  const moedaBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const consumoPrevistoKwh = 13.8;
  const temperaturaPrevista = 12.6;
  const ventoPrevisto = 1.1;

  const geracaoEquipamentosKwh = equipamentos.reduce((acc, equipamento) => acc + numeroBR(equipamento.energia), 0);
  const tarifaMedia = predicaoSemana.reduce((acc, dia) => acc + numeroBR(dia.tarifa), 0) / predicaoSemana.length;

  // Ajuste climático simples: temperatura mais próxima de 22°C e vento leve favorecem a eficiência.
  const fatorTemperatura = Math.max(0.8, 1 - Math.abs(temperaturaPrevista - 22) * 0.006);
  const fatorVento = Math.min(1.05, 1 + ventoPrevisto * 0.01);
  const fatorClimatico = fatorTemperatura * fatorVento;

  const geracaoAjustadaClima = geracaoEquipamentosKwh * fatorClimatico;
  const energiaNegociavel = Math.max(0, geracaoAjustadaClima - consumoPrevistoKwh);
  const lucroPrevisto = energiaNegociavel * tarifaMedia;
  const itemSelecionado = predicaoSemana.find((item) => item.data === formatarParaDataBR(dataSelecionada));
  const dataMin = '2026-11-01';
  const dataMax = '2026-12-31';

  const dataEscolhida = new Date(`${dataSelecionada}T12:00:00`);
  const mesSelecionado = dataEscolhida.getMonth() + 1;
  const diaSemana = dataEscolhida.getDay();
  const nomeDiaSelecionado = dataEscolhida.toLocaleDateString('pt-BR', { weekday: 'long' });

  const fatorSazonal = mesSelecionado === 11 ? 1.08 : mesSelecionado === 12 ? 1.12 : 1;
  const fatorDiaSemana = diaSemana === 0 || diaSemana === 6 ? 1.06 : 0.95;
  const geracaoEstimadaDia = geracaoAjustadaClima * fatorSazonal * fatorDiaSemana;
  const saldoEnergiaDia = geracaoEstimadaDia - consumoPrevistoKwh;
  const podeVenderNoDia = saldoEnergiaDia > 0;
  const statusDia = podeVenderNoDia ? 'Pode vender' : 'Nao recomendado vender';

  const demandaKwh = Number(demandaKwhInput.replace(',', '.')) || 0;
  const precoProposto = Number(precoPropostoInput.replace(',', '.')) || 0;
  const energiaDisponivelVenda = Math.max(0, saldoEnergiaDia);
  const energiaNecessariaCompra = Math.max(0, demandaKwh - energiaDisponivelVenda);
  const volumeNegocio = modoNegocio === 'venda'
    ? Math.min(energiaDisponivelVenda, demandaKwh)
    : demandaKwh;
  const valorNegocio = volumeNegocio * precoProposto;
  const negocioFechavel = modoNegocio === 'venda'
    ? energiaDisponivelVenda >= demandaKwh && demandaKwh > 0 && precoProposto > 0
    : demandaKwh > 0 && precoProposto > 0;

  const consumoMedioComprador = cargasComprador.reduce((acc, carga) => acc + numeroBR(carga.consumoEstimado), 0) / cargasComprador.length;
  const consumoMedioMensal = consumoMedioComprador * 30;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-100/80 via-lime-50 to-white p-4 sm:p-6">
        <p className="text-sm font-medium text-emerald-700">ENERGETRIX</p>
        <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-emerald-700" />
          <span className="capitalize">{dataHoraAtual}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {predicaoSemana.map((item) => {
          return (
            <Card key={item.data} className="border-emerald-200/70 bg-white/85 p-4 sm:p-5 shadow-sm backdrop-blur">
              <div className="space-y-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold capitalize text-emerald-950">{item.dia}</h3>
                  <p className="text-sm text-muted-foreground">{item.data}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status comercial</p>
                  <p className="mt-1 font-medium text-emerald-700">{item.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Geração estimada</p>
                    <p className="font-semibold text-foreground">{item.geracao}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Tarifa sugerida</p>
                    <p className="font-semibold text-emerald-700">{item.tarifa}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-emerald-200/70 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-950">Calendário de compra provável</h2>
            <p className="text-sm text-muted-foreground">
              Escolha os dados com menor escassez para sugerir a compra ao agente.
            </p>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Recomendação automática: 30/05/2026
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {predicaoSemana.slice(0, 5).map((item) => (
            <div key={`sugerido-${item.data}`} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="font-semibold capitalize text-emerald-950">{item.dia}</p>
              <p className="text-sm text-emerald-700">{item.status}</p>
              <p className="mt-2 text-sm text-muted-foreground">Data: {item.data}</p>
              <p className="text-sm text-muted-foreground">Geração: {item.geracao}</p>
              <p className="text-sm font-medium text-emerald-700">Tarifa: {item.tarifa}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-emerald-200/70 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-emerald-950">Caixa de calendário para reserva e compra</h2>
        <p className="text-sm text-muted-foreground">Escolha um único dia (novembro/dezembro) e veja se pode vender ou se o ideal é comprar.</p>

        <div className="mt-4 inline-flex rounded-lg border border-emerald-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setModoNegocio('compra')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              modoNegocio === 'compra' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Compra
          </button>
          <button
            type="button"
            onClick={() => setModoNegocio('venda')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              modoNegocio === 'venda' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Venda
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <label htmlFor="data-reserva" className="block text-sm font-medium text-emerald-900 mb-2">
              Data única da reserva/compra
            </label>
            <input
              id="data-reserva"
              type="date"
              value={dataSelecionada}
              min={dataMin}
              max={dataMax}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <p className="mt-2 text-xs text-muted-foreground">Seleção única entre novembro e dezembro.</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-4">
            <p className="text-sm font-medium text-emerald-900">Resumo da data escolhida</p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold capitalize">{nomeDiaSelecionado}</p>
              <p>Data: {formatarParaDataBR(dataSelecionada)}</p>
              <p>Modo: <span className="capitalize">{modoNegocio}</span></p>
              <p>Geração estimada do dia: {geracaoEstimadaDia.toFixed(1).replace('.', ',')} kWh</p>
              <p>Saldo energético: {saldoEnergiaDia.toFixed(1).replace('.', ',')} kWh</p>
              <p className={podeVenderNoDia ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
                {statusDia}
              </p>
              {itemSelecionado && <p className="text-xs text-muted-foreground">Referência semanal: {itemSelecionado.status}</p>}
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-emerald-100 bg-white p-4">
            <p className="text-sm font-medium text-emerald-900">Caixa de proposta e demanda</p>
            <p className="text-xs text-muted-foreground mt-1">Defina a demanda e a proposta para validar se o negócio pode ser fechado.</p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="demanda-kwh" className="block text-xs font-medium text-emerald-900 mb-1">Demanda (kWh)</label>
                <input
                  id="demanda-kwh"
                  type="text"
                  value={demandaKwhInput}
                  onChange={(e) => setDemandaKwhInput(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <div>
                <label htmlFor="preco-proposto" className="block text-xs font-medium text-emerald-900 mb-1">Proposta (R$/kWh)</label>
                <input
                  id="preco-proposto"
                  type="text"
                  value={precoPropostoInput}
                  onChange={(e) => setPrecoPropostoInput(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs text-muted-foreground">Valor estimado</p>
                <p className="text-lg font-semibold text-emerald-800">{moedaBRL.format(valorNegocio)}</p>
              </div>
            </div>

            <div className="mt-3 text-sm space-y-1">
              <p>Energia disponível para venda: {energiaDisponivelVenda.toFixed(1).replace('.', ',')} kWh</p>
              <p>Energia necessária para compra: {energiaNecessariaCompra.toFixed(1).replace('.', ',')} kWh</p>
              <p className={negocioFechavel ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                {negocioFechavel ? 'Negócio viável para fechar hoje.' : 'Negócio não fecha com os valores atuais.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-emerald-200/70 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-emerald-950">Cálculo de consumo do comprador</h2>
        <p className="text-sm text-muted-foreground">
          Defina a média de consumo por eletrodoméstico ou perfil industrial para prever o melhor dia de compra.
        </p>

        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          Média prevista de consumo: <span className="font-semibold">{consumoMedioComprador.toFixed(1).replace('.', ',')} kWh/dia</span>
          {' · '}
          Projeção mensal: <span className="font-semibold">{consumoMedioMensal.toFixed(0)} kWh/mês</span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {cargasComprador.map((carga) => (
            <div key={carga.nome} className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {carga.icon} {carga.nome}
                  </p>
                  <p className="text-sm text-muted-foreground">{carga.tipo}</p>
                </div>
                <p className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">{carga.perfil}</p>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{carga.local}</p>

              <div className="mt-3 space-y-1 text-sm">
                <p>Potência instalada: <span className="font-semibold">{carga.potencia}</span></p>
                <p>Uso médio: <span className="font-semibold">{carga.usoMedio}</span></p>
                <p>Consumo estimado: <span className="font-semibold text-emerald-700">{carga.consumoEstimado}</span></p>
                <p>Demanda: <span className="font-semibold">{carga.demanda}</span></p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Consumo previsto (clima)</p>
              <p className="text-2xl font-semibold">13,8 kWh</p>
              <p className="text-sm text-muted-foreground">Quitandinha: 12,6 °C · 1,1 km/h</p>
            </div>
            <CloudSun className="w-7 h-7 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-4 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Compras potenciais</p>
              <p className="text-2xl font-semibold">22 Oportunidades</p>
              <p className="text-sm text-muted-foreground">Demanda ativa na sua região</p>
            </div>
            <ShoppingBasket className="w-7 h-7 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-4 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lucro previsto</p>
              <p className="text-2xl font-semibold">{moedaBRL.format(lucroPrevisto)}</p>
              <p className="text-sm text-muted-foreground">
                Equipamentos: {geracaoEquipamentosKwh.toFixed(1).replace('.', ',')} kWh · Clima: {(fatorClimatico * 100).toFixed(1).replace('.', ',')}%
              </p>
            </div>
            <Coins className="w-7 h-7 text-emerald-600" />
          </div>
        </Card>

        <Card className="p-4 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Escassez climática</p>
              <p className="text-2xl font-semibold">3 %</p>
              <p className="text-sm text-muted-foreground">Escassez Baixa · base para preço e oferta</p>
            </div>
            <Wind className="w-7 h-7 text-emerald-600" />
          </div>
        </Card>
      </div>

      <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-lime-50 p-4 text-sm text-emerald-900">
        <div className="flex items-center gap-2 font-medium">
          <SunMedium className="h-4 w-4" />
          Status comercial consolidado: Excedente comercial com janela de compra favorável.
        </div>
      </div>
    </div>
  );
}