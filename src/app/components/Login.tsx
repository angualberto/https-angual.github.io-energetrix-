import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import { initializeAuthDb, loginUser, registerUser, type AuthUser, type UserRole } from '../utils/authSqlite';
import logoLight from '../../assets/logo-light.svg';

interface LoginProps {
  onLogin: (usuario: AuthUser) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<UserRole>('comprador');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [inicializando, setInicializando] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuthDb();
      } catch {
        setErro('Não foi possível inicializar o banco SQLite de autenticação.');
      } finally {
        setInicializando(false);
      }
    };

    void init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (modo === 'entrar') {
      const result = await loginUser(usuario, senha);
      if (result.ok && result.user) {
        onLogin(result.user);
      } else {
        setErro(result.message);
      }
    } else {
      const result = await registerUser(usuario, senha, perfil);
      if (result.ok && result.user) {
        setSucesso('Cadastro realizado. Sessão iniciada automaticamente.');
        onLogin(result.user);
      } else {
        setErro(result.message);
      }
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-4 sm:p-8 shadow-lg bg-white/90 dark:bg-emerald-950/90 border-emerald-100 dark:border-emerald-800">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logoLight} alt="Enertrix Logo" className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-emerald-900 dark:text-emerald-50">ENERTRIX</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Acesso ao Portal de Transações P2P</p>
        </div>

        <div className="mb-4 inline-flex w-full rounded-lg border border-emerald-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setModo('entrar')}
            className={`w-1/2 rounded-md px-3 py-2 text-sm transition-colors ${modo === 'entrar' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setModo('cadastrar')}
            className={`w-1/2 rounded-md px-3 py-2 text-sm transition-colors ${modo === 'cadastrar' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuário</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="usuario"
                type="text"
                placeholder="Digite seu usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {modo === 'cadastrar' && (
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <select
                id="perfil"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as UserRole)}
                className="w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="comprador">Comprador</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
          )}

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {sucesso && (
            <Alert>
              <AlertDescription>{sucesso}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={carregando || inicializando}
          >
            {inicializando
              ? 'Inicializando...'
              : carregando
                ? (modo === 'entrar' ? 'Entrando...' : 'Cadastrando...')
                : (modo === 'entrar' ? 'Entrar' : 'Cadastrar e acessar')}
          </Button>
        </form>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Banco local SQLite ativo. Usuário padrão: admin / admin.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}