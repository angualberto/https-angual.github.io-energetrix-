# Sistema de Gestão de Vendas

Sistema completo para gestão de pedidos, vendas e recebimentos com relatórios customizáveis.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro completo com dados de contato
- **Controle de Pedidos**: Criação e acompanhamento de pedidos
- **Gestão de Vendas**: Conversão de pedidos em vendas totais ou parciais
- **Sistema de Parcelamento**: Controle quinzenal/mensal com cronograma
- **Controle de Recebimentos**: Lançamento manual de valores recebidos
- **Relatórios Avançados**: 
  - Relatório de Vendas
  - Relatório Financeiro  
  - Relatório de Clientes
  - Relatório de Previsão de Recebimentos
  - Relatório de Vendas Individual
- **Sistema de Login**: Controle de acesso com usuários pré-definidos
- **Exportação PDF**: Todos os relatórios podem ser exportados
- **Dashboard**: Visão geral do negócio com métricas importantes

## 🔐 Usuários Pré-configurados

O sistema possui três usuários para acesso:

- **usuário**: usuario-1 | **senha**: kiki130
- **usuário**: usuario-2 | **senha**: branquinha130  
- **usuário**: usuario-3 | **senha**: pretinho130

## 🛠️ Tecnologias Utilizadas

- **React** com TypeScript
- **Tailwind CSS v4**
- **ShadCN/UI Components**
- **Recharts** para gráficos
- **Lucide React** para ícones
- **Local Storage** para persistência de dados

## 📦 Instalação e Deploy

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação Local

1. Clone o repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd sistema-gestao-vendas
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Execute o projeto em desenvolvimento
```bash
npm run dev
# ou  
yarn dev
```

4. Acesse `http://localhost:3000`

### Deploy em Produção

O sistema está preparado para deploy em qualquer plataforma que suporte aplicações React:

#### Netlify
1. Faça build do projeto: `npm run build`
2. Faça upload da pasta `dist` no Netlify

#### Vercel
1. Conecte o repositório no Vercel
2. Configure o comando de build: `npm run build`
3. Deploy automático

#### Outros Serviços
1. Execute: `npm run build`
2. Faça upload dos arquivos da pasta `dist`

## 📊 Estrutura de Dados

O sistema utiliza Local Storage para persistência de dados com as seguintes entidades:

- **Clientes**: Nome, telefone, email, endereço
- **Pedidos**: Produtos, quantidades, valores, custos
- **Vendas**: Conversão de pedidos com sistema de parcelas
- **Recebimentos**: Controle de pagamentos das parcelas

## 🎯 Uso do Sistema

### Primeiro Acesso
1. Faça login com um dos usuários pré-configurados
2. Cadastre seus primeiros clientes
3. Crie pedidos para os clientes
4. Converta pedidos em vendas
5. Gerencie recebimentos das parcelas
6. Utilize os relatórios para análise

### Fluxo Recomendado
1. **Clientes** → Cadastre seus clientes
2. **Pedidos** → Crie pedidos com produtos e custos  
3. **Vendas** → Converta pedidos aprovados em vendas
4. **Recebimentos** → Acompanhe e lance recebimentos
5. **Relatórios** → Analise performance e previsões

## 🔧 Configurações

### Personalização
- Cores e temas podem ser ajustados em `/styles/globals.css`
- Componentes UI estão em `/components/ui/`
- Lógica de negócio está nos componentes principais

### Backup de Dados
- Os dados ficam no Local Storage do navegador
- Para backup, exporte dados via console do navegador
- Para migração, importe dados no Local Storage

## 📈 Relatórios Disponíveis

### Relatório de Vendas
- Resumo geral de vendas no período
- Produtos mais vendidos
- Vendas detalhadas por cliente
- Filtros por período e cliente

### Relatório Financeiro  
- Análise de receitas, custos e lucros
- Fluxo de caixa por mês
- Controle de recebimentos e vencimentos

### Relatório de Clientes
- Top clientes por valor
- Análise de clientes ativos/inativos
- Ticket médio e formas de pagamento

### Relatório de Previsão
- Previsão de recebimentos futuros
- Gráfico interativo por mês
- Análise de parcelas pendentes

### Relatório de Vendas Individual
- Análise detalhada por cliente específico
- Histórico de compras e recebimentos
- Consolidado de valores (recebidos, previstos, vencidos)

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique se todos os dados estão sendo salvos corretamente
2. Confirme que está logado com usuário válido
3. Para reset completo, limpe o Local Storage do navegador
4. Recarregue a página em caso de problemas de interface

## 📄 Licença

Sistema desenvolvido para gestão empresarial. Todos os direitos reservados.

---

**Sistema pronto para produção** ✅
- Dados de exemplo removidos
- Tabelas iniciadas vazias  
- Login funcional
- Pronto para uso real