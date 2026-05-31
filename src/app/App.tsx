import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientesList } from './components/ClientesList';
import { ClienteForm } from './components/ClienteForm';
import { PedidoForm } from './components/PedidoForm';
import { PedidosList } from './components/PedidosList';
import { VendasList } from './components/VendasList';
import { RecebimentosList } from './components/RecebimentosList';
import { Relatorios } from './components/RelatoriosComplete';
import { Login } from './components/Login';
import { useSupabaseData } from './hooks/useSupabaseData';
import { Loader2 } from 'lucide-react';
import { type AuthUser } from './utils/authSqlite';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });

  const currentRole = simulatedRole || currentUser?.role || 'vendedor';

  const toggleSimulatedRole = () => {
    setSimulatedRole(prev => (prev || currentUser?.role || 'vendedor') === 'comprador' ? 'vendedor' : 'comprador');
  };

  // Aplicar tema
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Estados do Supabase - SEMPRE chamado para respeitar Rules of Hooks
  const {
    clientes,
    pedidos,
    vendas,
    isLoading,
    error,
    handleClienteCreate,
    handleClienteUpdate,
    handlePedidoCreate,
    handlePedidoUpdate,
    handlePedidoDelete,
    handleVendaCreate,
    handleVendaUpdate,
    reloadData,
  } = useSupabaseData();

  // Verificar se há usuário logado no localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as AuthUser;
        if (parsed?.username && parsed?.role) {
          setCurrentUser(parsed);
        } else {
          setCurrentUser({ id: 0, username: savedUser, role: 'vendedor' });
        }
      } catch {
        setCurrentUser({ id: 0, username: savedUser, role: 'vendedor' });
      }
      setIsLoggedIn(true);
    }
  }, []);

  // Handlers para Login
  const handleLogin = (usuario: AuthUser) => {
    setCurrentUser(usuario);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(usuario));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
    setCurrentPage('dashboard');
  };

  // Se não estiver logado, mostrar tela de login
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    // Mostrar loading se estiver carregando
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm sm:text-base">Carregando dados...</span>
          </div>
        </div>
      );
    }

    // Mostrar erro se houver
    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600 max-w-md mx-auto p-4">
            <p className="text-sm sm:text-base mb-3">Erro ao carregar dados: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs sm:text-sm underline hover:no-underline transition-all"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            clientes={clientes}
            pedidos={pedidos}
            vendas={vendas}
            useSupabase={true}
            isLoading={isLoading}
            error={error}
            onReloadData={reloadData}
          />
        );
      case 'clientes':
        return (
          <ClientesList
            clientes={clientes}
            vendas={vendas}
            onClienteCreate={handleClienteCreate}
            onClienteUpdate={handleClienteUpdate}
          />
        );
      case 'pedidos':
        return (
          <PedidosList
            pedidos={pedidos}
            clientes={clientes}
            onPedidoCreate={handlePedidoCreate}
            onPedidoUpdate={handlePedidoUpdate}
            onPedidoDelete={handlePedidoDelete}
            onVendaCreate={handleVendaCreate}
          />
        );
      case 'vendas':
        return (
          <VendasList
            vendas={vendas}
            clientes={clientes}
            onVendaUpdate={handleVendaUpdate}
          />
        );
      case 'recebimentos':
        return (
          <RecebimentosList
            vendas={vendas}
            clientes={clientes}
            onVendaUpdate={handleVendaUpdate}
          />
        );
      case 'relatorios':
        return (
          <Relatorios
            vendas={vendas}
            clientes={clientes}
          />
        );
      default:
        return (
          <Dashboard 
            clientes={clientes}
            pedidos={pedidos}
            vendas={vendas}
            useSupabase={true}
            isLoading={isLoading}
            error={error}
            onReloadData={reloadData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Layout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onNewClient={() => setShowClienteForm(true)}
        onNewPedido={() => setShowPedidoForm(true)}
        currentUser={currentUser?.username ?? ''}
        currentRole={currentRole}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        onToggleRole={toggleSimulatedRole}
      >
        {renderCurrentPage()}
      </Layout>

      <ClienteForm
        isOpen={showClienteForm}
        onClose={() => setShowClienteForm(false)}
        onSave={handleClienteCreate}
      />

      <PedidoForm
        isOpen={showPedidoForm}
        onClose={() => setShowPedidoForm(false)}
        onSave={handlePedidoCreate}
        clientes={clientes}
      />
    </div>
  );
}