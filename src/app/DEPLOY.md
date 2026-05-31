# 🚀 Guia de Deploy - Sistema de Gestão de Vendas

## ✅ Sistema Preparado para Produção

O sistema foi configurado e está pronto para deploy com:

- ✅ **Dados de exemplo removidos**
- ✅ **Tabelas iniciadas vazias**
- ✅ **Configurações de build otimizadas**
- ✅ **Sistema de login funcional**
- ✅ **Estrutura de arquivos organizada**

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta em serviço de hospedagem (Netlify, Vercel, etc.)

## 🔧 Comandos de Build

```bash
# Instalar dependências
npm install

# Build para produção
npm run build

# Preview local do build
npm run preview

# Desenvolvimento local
npm run dev
```

## 🌐 Opções de Deploy

### 1. **Netlify** (Recomendado)

**Deploy Manual:**
```bash
npm run build
# Faça upload da pasta 'dist' no painel do Netlify
```

**Deploy Automático:**
1. Conecte seu repositório GitHub no Netlify
2. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Deploy automático a cada push

### 2. **Vercel**

**Deploy CLI:**
```bash
npm install -g vercel
vercel --prod
```

**Deploy GitHub:**
1. Conecte repositório no Vercel
2. Configuração automática para React
3. Deploy automático

### 3. **Firebase Hosting**

```bash
npm install -g firebase-tools
npm run build
firebase init hosting
firebase deploy
```

### 4. **GitHub Pages**

```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

## ⚙️ Variáveis de Ambiente

O sistema não requer variáveis de ambiente pois usa Local Storage, mas você pode configurar:

```env
# .env.production (opcional)
VITE_APP_NAME="Sistema de Gestão de Vendas"
VITE_APP_VERSION="1.0.0"
```

## 🔒 Configurações de Segurança

### Usuários Pré-configurados:
- `usuario-1` / `kiki130`
- `usuario-2` / `branquinha130`
- `usuario-3` / `pretinho130`

> **⚠️ IMPORTANTE:** Após deploy, altere as senhas no arquivo `/components/Login.tsx` para maior segurança.

## 📊 Dados e Backup

### Armazenamento:
- Dados salvos no **Local Storage** do navegador
- Não requer banco de dados externo
- Dados persistem entre sessões

### Backup Recomendado:
```javascript
// Console do navegador - Exportar dados
const backup = {
  clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
  pedidos: JSON.parse(localStorage.getItem('pedidos') || '[]'),
  vendas: JSON.parse(localStorage.getItem('vendas') || '[]')
};
console.log('Backup:', JSON.stringify(backup));
```

### Restaurar Backup:
```javascript
// Console do navegador - Importar dados
const backup = {/* seus dados aqui */};
localStorage.setItem('clientes', JSON.stringify(backup.clientes));
localStorage.setItem('pedidos', JSON.stringify(backup.pedidos));
localStorage.setItem('vendas', JSON.stringify(backup.vendas));
location.reload();
```

## 🎯 Configurações Específicas

### Netlify (_redirects):
```
/*    /index.html   200
```

### Vercel (vercel.json):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 📈 Monitoramento

### Métricas Importantes:
- Performance do Local Storage
- Tempo de carregamento
- Compatibilidade de navegadores
- Uso de memória

### Analytics (Opcional):
Adicione Google Analytics no `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## 🐛 Troubleshooting

### Problemas Comuns:

1. **Build falha:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Roteamento não funciona:**
   - Configure redirects para SPA
   - Verifique configuração do servidor

3. **Local Storage não funciona:**
   - Verifique se está em HTTPS (produção)
   - Teste em modo incógnito

4. **Componentes não carregam:**
   - Verifique importações
   - Confirme build de produção

## ✅ Checklist Final

Antes do deploy, verifique:

- [ ] Build executa sem erros
- [ ] Login funciona corretamente  
- [ ] Todas as páginas carregam
- [ ] Local Storage salva dados
- [ ] Relatórios são gerados
- [ ] PDFs são exportados
- [ ] Interface responsiva
- [ ] Performance adequada

## 🎉 Deploy Concluído!

Após o deploy:

1. ✅ Teste todos os usuários de login
2. ✅ Cadastre primeiro cliente teste
3. ✅ Crie pedido e venda teste
4. ✅ Gere relatório teste
5. ✅ Verifique exportação PDF
6. ✅ Teste em diferentes dispositivos

**Sistema pronto para uso em produção!** 🚀

---

**URLs de Deploy:**
- Produção: `[SUA_URL_AQUI]`
- Staging: `[SUA_URL_STAGING]`

**Suporte:** Entre em contato para dúvidas técnicas.