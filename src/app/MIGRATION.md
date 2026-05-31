# Guia de Migração para Supabase

Este documento descreve como migrar o sistema de gestão de pedidos e vendas do localStorage para o banco de dados Supabase.

## 📋 Pré-requisitos

- Sistema já configurado com Supabase
- Dados existentes no localStorage (se aplicável)
- Acesso ao painel do Supabase

## 🗄️ Estrutura de Dados

O sistema utiliza uma estrutura de Key-Value store no Supabase para armazenar:

### Clientes
- **Chave**: `cliente:{id}`
- **Dados**: Nome, telefone, email, endereço completo, data de criação

### Pedidos
- **Chave**: `pedido:{id}`
- **Dados**: Cliente ID, produtos (array JSON), valores, status, observações

### Vendas
- **Chave**: `venda:{id}`
- **Dados**: Pedido ID, cliente ID, produtos, parcelas, recebimentos, status

## 🚀 Processo de Migração

### Automática (Recomendada)

1. **Faça login no sistema**
2. **Se houver dados no localStorage**, um painel de migração aparecerá automaticamente
3. **Clique em "Migrar Dados"** para transferir todos os registros
4. **Aguarde a confirmação** da migração bem-sucedida
5. **O sistema automaticamente mudará** para usar o Supabase

### Manual

Se a migração automática não funcionar:

1. **Acesse o Dashboard**
2. **Verifique o componente "Database Status"**
3. **Use as opções de recarga** se necessário
4. **Entre em contato com o suporte** se houver problemas

## 📊 Monitoramento

### Dashboard - Status do Banco
- **Modo Local**: Dados apenas no navegador
- **Modo Supabase**: Dados na nuvem, sincronizados
- **Contador de registros** em tempo real
- **Status de conexão** e possíveis erros

### Verificações de Integridade
- ✅ Total de clientes migrados
- ✅ Total de pedidos migrados  
- ✅ Total de vendas migradas
- ✅ Relacionamentos preservados

## 🔧 Troubleshooting

### Erro de Conexão
```
Erro ao buscar dados: 500
```
**Solução**: Verificar se o servidor Supabase está ativo

### Erro de Migração
```
Erro na migração: dados inválidos
```
**Solução**: Verificar se os dados no localStorage estão íntegros

### Dados Inconsistentes
**Sintoma**: Contadores diferentes entre local e Supabase
**Solução**: Use o botão "Recarregar" no Dashboard

## 📝 API Endpoints

O sistema utiliza os seguintes endpoints:

- `GET /clientes` - Buscar todos os clientes
- `POST /clientes` - Criar cliente
- `PUT /clientes/:id` - Atualizar cliente
- `DELETE /clientes/:id` - Deletar cliente

*Endpoints similares existem para pedidos e vendas*

## 🔒 Segurança

- ✅ **Autenticação**: Sistema de login mantido (hardcoded)
- ✅ **Autorização**: Bearer token para API
- ✅ **CORS**: Configurado para origem específica
- ✅ **Validação**: Dados validados no servidor

## 📈 Performance

### Otimizações Implementadas
- **Batch operations** para migração
- **Lazy loading** dos dados do Supabase
- **Error handling** robusto
- **Loading states** para melhor UX

### Monitoramento
- Status de carregamento em tempo real
- Tratamento de erros com mensagens claras
- Retry automático em caso de falha temporária

## 🚨 Importante

⚠️ **Backup**: Sempre faça backup dos dados antes da migração
⚠️ **Teste**: Teste o sistema após a migração
⚠️ **Suporte**: Documente qualquer problema encontrado

---

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. ✅ **Verificar funcionalidades**: Testar criação, edição e exclusão
2. ✅ **Validar relatórios**: Confirmar dados nos relatórios
3. ✅ **Treinar usuários**: Sobre as novas funcionalidades
4. ✅ **Monitorar sistema**: Acompanhar performance e erros

---

*Última atualização: Setembro 2025*