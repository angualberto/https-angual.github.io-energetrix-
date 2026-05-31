import { ReactNode, useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  ShoppingCart,
  Users, 
  FileText, 
  TrendingUp, 
  CreditCard,
  Home,
  Plus,
  LogOut,
  User,
  Menu,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import logoLight from '../../assets/logo-light.svg';
import logoDark from '../../assets/logo-dark.svg';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onNewClient: () => void;
  onNewPedido: () => void;
  currentUser: string;
  currentRole: 'comprador' | 'vendedor';
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onToggleRole?: () => void;
}

export function Layout({ 
  children, 
  currentPage, 
  onPageChange, 
  onNewClient, 
  onNewPedido, 
  currentUser, 
  currentRole, 
  onLogout,
  theme,
  toggleTheme,
  onToggleRole
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const usuarioExibicao = currentUser || 'admin';
  const perfilExibicao = currentRole === 'comprador' ? 'Comprador' : 'Vendedor';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { id: 'vendas', label: 'Vendas', icon: FileText },
    { id: 'recebimentos', label: 'Recebimentos', icon: CreditCard },
    { id: 'relatorios', label: 'Relatórios', icon: TrendingUp },
  ];

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-lime-50 to-white dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-950">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Painel do Vendedor</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-800"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 rounded-lg border border-emerald-100 dark:border-emerald-800 bg-white/70 dark:bg-emerald-900/50 p-2">
          <p className="text-xs text-muted-foreground">Usuário logado: {usuarioExibicao}</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-50">
            <img src={theme === 'light' ? logoLight : logoDark} alt="Enertrix Logo" className="h-6 w-auto" />
            ENERTRIX
          </div>
          <p className="text-xs text-muted-foreground">Controle de Pedidos e Vendas</p>
          <div className="mt-2 inline-flex items-center gap-2">
            <div className={`rounded-full px-2 py-1 text-xs font-medium ${
              currentRole === 'comprador' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Perfil: {perfilExibicao}
            </div>
            {onToggleRole && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleRole}
                className="h-6 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Simular {currentRole === 'comprador' ? 'Vendedor' : 'Comprador'}
              </Button>
            )}
          </div>

          <Button
            onClick={() => {
              onLogout();
              setIsMobileMenuOpen(false);
            }}
            variant="outline"
            className="mt-3 w-full border-emerald-300 text-emerald-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair e voltar ao login
          </Button>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 space-y-2">
        {(currentRole === 'comprador' || currentRole === 'vendedor') && (
          <Button 
            onClick={() => {
              onNewPedido();
              setIsMobileMenuOpen(false);
            }}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Comprar Energia
          </Button>
        )}
        {currentRole === 'vendedor' && (
          <Button 
            onClick={() => {
              onNewClient();
              setIsMobileMenuOpen(false);
            }}
            variant="outline"
            className="w-full border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Vendedor
          </Button>
        )}
      </div>

      <nav className="px-3 sm:px-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="text-sm sm:text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-border">
        <Button 
          onClick={() => {
            onLogout();
            setIsMobileMenuOpen(false);
          }}
          variant="outline"
          className="w-full border-emerald-300 text-emerald-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-card border-r border-border">
        <SidebarContent />
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col flex-1 lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100 via-lime-50 to-white dark:from-emerald-950 dark:via-emerald-900 dark:to-emerald-950 border-b border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <img src={theme === 'light' ? logoLight : logoDark} alt="Enertrix Logo" className="h-8 w-auto" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-50 text-sm">Painel do Vendedor</p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold tracking-tight">Enertrix</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-emerald-700 dark:text-emerald-300"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="border-t border-border bg-card">
          <div className="flex items-center justify-around p-2">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'text-emerald-700'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="h-full overflow-auto w-full">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}