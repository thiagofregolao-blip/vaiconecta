import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Loader2, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '../../api';

type Tab = 'login' | 'register';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');

  // login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // cadastro
  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [regRole, setRegRole] = useState('SUPER_ADMIN');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  function saveAndRedirect(data: any) {
    localStorage.setItem('vc_token', data.token);
    localStorage.setItem('vc_role', data.role);
    localStorage.setItem('vc_store', data.store ? JSON.stringify(data.store) : '');
    localStorage.setItem('vc_name', data.name || data.username);
    if (data.role === 'STORE_ADMIN' && data.store) {
      navigate(`/admin/store/${data.store.id}`);
    } else {
      navigate('/admin');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.post('/login', { username, password });
      saveAndRedirect(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPass !== regPass2) { setRegError('As senhas não coincidem'); return; }
    if (regPass.length < 6) { setRegError('Senha deve ter pelo menos 6 caracteres'); return; }
    setRegLoading(true);
    setRegError('');
    try {
      const { data } = await adminApi.post('/register', {
        username: regUser, password: regPass, name: regName, role: regRole,
      });
      saveAndRedirect(data);
    } catch (err: any) {
      setRegError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative glass rounded-3xl w-full max-w-sm p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass mb-4">
            <Wifi className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-white font-bold text-2xl">VaiConecta</h1>
          <p className="text-slate-400 text-sm mt-1">Área Administrativa</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          <button onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === 'login' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            Entrar
          </button>
          <button onClick={() => { setTab('register'); setRegError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === 'register' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            Criar conta
          </button>
        </div>

        {/* Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm text-slate-400 mb-1.5">Usuário</label>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="seu.usuario" required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-slate-400 mb-1.5">Senha</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-base cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </form>
        )}

        {/* Cadastro */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Nome completo</label>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                placeholder="Thiago Fregolão" required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Usuário</label>
              <input type="text" value={regUser} onChange={(e) => setRegUser(e.target.value)}
                placeholder="thiago" required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Perfil</label>
              <select value={regRole} onChange={(e) => setRegRole(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base cursor-pointer">
                <option value="SUPER_ADMIN">Administrador do Sistema</option>
                <option value="STORE_ADMIN">Admin de Loja</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Senha</label>
              <input type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Confirmar senha</label>
              <input type="password" value={regPass2} onChange={(e) => setRegPass2(e.target.value)}
                placeholder="••••••••" required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" />
            </div>
            {regError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{regError}</div>}
            <button type="submit" disabled={regLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-base cursor-pointer">
              {regLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
