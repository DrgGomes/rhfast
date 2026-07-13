// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  doc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut
} from 'firebase/auth';
import { 
  Users, Calculator, FileText, Plus, Trash2, 
  Printer, Calendar, ArrowLeft, X,
  LogOut, Building, Mail, Key, CheckCircle, ArrowRight, AlertCircle
} from 'lucide-react';

// --- Suas Configurações Reais do Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAco2vbYVQdL9c0Ls7AaUKHMUN8xCclip0",
  authDomain: "astute-nuance-469614-h3.firebaseapp.com",
  projectId: "astute-nuance-469614-h3",
  storageBucket: "astute-nuance-469614-h3.firebasestorage.app",
  messagingSenderId: "740756160162",
  appId: "1:740756160162:web:21df14a8e49a78e62ce1fb",
  measurementId: "G-WYHTCRYQ4D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // O Estado principal para os Funcionários e Folha
  const [employees, setEmployees] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null); 

  // --- SISTEMA DE ROTAS PROFISSIONAIS (URLs) ---
  // Inicializa a rota. Se estiver num ambiente de preview, força a raiz '/'
  const initialPath = window.location.href.startsWith('blob:') ? '/' : window.location.pathname;
  const [currentPath, setCurrentPath] = useState(initialPath);

  // Escuta os botões de "Voltar" e "Avançar" do navegador
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Função mágica para mudar de página e atualizar a URL lá em cima
  const navigate = (path) => {
    try {
      // Tenta mudar a URL, mas ignora se for no ambiente de preview bloqueado
      if (!window.location.href.startsWith('blob:')) {
        window.history.pushState({}, '', path);
      }
    } catch (error) {
      console.warn("Alteração de URL bloqueada no preview. Navegando internamente.");
    }
    setCurrentPath(path);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Regras de Redirecionamento (Protegendo as páginas)
  useEffect(() => {
    if (!loadingAuth) {
      const publicPaths = ['/', '/login', '/cadastro'];
      const isPublicPath = publicPaths.includes(currentPath);

      if (user && isPublicPath) {
        // Se está logado e tentou ir pra tela de login, manda pro painel
        navigate('/painel');
      } else if (!user && !isPublicPath) {
        // Se NÃO está logado e tentou acessar rota interna, manda pro login
        navigate('/login');
      }
    }
  }, [user, loadingAuth, currentPath]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'companies', user.uid, 'employees');
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const empList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(empList);
    }, (error) => {
      console.error("Erro ao buscar funcionários:", error);
    });

    return () => unsubscribeDocs();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    setEmployees([]);
    navigate('/');
  };

  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Carregando RH Fast...</p>
      </div>
    );
  }

  // --- ÁREA PÚBLICA (Sem usuário logado) ---
  if (!user) {
    switch (currentPath) {
      case '/cadastro': 
        return <AuthScreen auth={auth} db={db} initialIsLogin={false} navigate={navigate} />;
      case '/login': 
        return <AuthScreen auth={auth} db={db} initialIsLogin={true} navigate={navigate} />;
      case '/':
      default: 
        return <LandingPage navigate={navigate} />;
    }
  }

  // --- ÁREA PRIVADA (Usuário logado - SaaS) ---
  const renderPrivateView = () => {
    switch(currentPath) {
      case '/funcionarios': 
        return <EmployeeManager employees={employees} userId={user.uid} db={db} />;
      case '/gerar-folha': 
        return <PayrollCalculator employees={employees} onGenerate={(data) => { setSelectedPayroll(data); navigate('/holerites'); }} />;
      case '/holerites': 
        return <HoleriteView data={selectedPayroll} navigate={navigate} companyName={user.displayName || "Minha Empresa"} />;
      case '/painel':
      default: 
        return <Dashboard navigate={navigate} employees={employees} />;
    }
  };

  // Função auxiliar para pintar o botão ativo no menu
  const getNavClass = (path) => {
    const baseClass = "px-3 py-2 rounded-lg transition hover:bg-blue-600";
    return currentPath === path ? `${baseClass} bg-blue-800 font-bold shadow-inner` : baseClass;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200">
      {/* Header do Sistema */}
      <header className="bg-blue-700 text-white p-4 shadow-lg print:hidden sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/painel')}>
            <div className="bg-white text-blue-700 p-2 rounded-lg shadow-sm">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight tracking-wide">RH Fast</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200">Painel de Gestão</p>
            </div>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-2 md:gap-4 text-sm font-medium">
            <button onClick={() => navigate('/painel')} className={getNavClass('/painel')}>Início</button>
            <button onClick={() => navigate('/funcionarios')} className={getNavClass('/funcionarios')}>Equipe</button>
            <button onClick={() => navigate('/gerar-folha')} className={getNavClass('/gerar-folha')}>Gerar Folha</button>
            <button onClick={handleLogout} className="px-3 py-2 rounded-lg transition hover:bg-red-500 hover:border-transparent flex items-center gap-1 ml-2 border border-blue-400">
              <LogOut size={16}/> Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">
        {renderPrivateView()}
      </main>
    </div>
  );
}

function LandingPage({ navigate }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Menu Superior do Site */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-700 text-white p-1.5 rounded-lg shadow-md">
              <Building className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">RH Fast<span className="text-blue-600">.</span></span>
          </div>
          <div className="flex gap-2 md:gap-4 items-center text-sm font-bold">
            <button onClick={() => navigate('/login')} className="text-slate-600 hover:text-blue-700 transition px-3 py-2">
              Entrar
            </button>
            <button onClick={() => navigate('/cadastro')} className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest mb-2 shadow-sm">
            <CheckCircle size={14} /> Feito para Pequenas Empresas
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1]">
            Chega de planilhas. <br/>
            <span className="text-blue-600">Seu RH fácil</span> em minutos.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed md:max-w-md">
            O RH Fast foi criado para o empresário que não tem tempo a perder. Cadastre funcionários, calcule dias trabalhados e gere holerites em poucos cliques. Tudo na nuvem, simples e seguro.
          </p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => navigate('/cadastro')} className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-2 hover:-translate-y-1">
              Começar Agora <ArrowRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Imagem/Ilustração da Hero */}
        <div className="relative animate-fade-in">
          <div className="absolute inset-0 bg-blue-600 rounded-[2rem] transform rotate-3 opacity-10"></div>
          <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 relative z-10">
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
              <div className="font-black text-slate-800">Resumo da Folha</div>
              <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">Ref: Novembro</div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Maria Silva', role: 'Mensalista', val: 'R$ 2.500' },
                { name: 'João Santos', role: 'Diarista (15 dias)', val: 'R$ 1.500' },
                { name: 'Ana Souza', role: 'Mensalista', val: 'R$ 3.200' }
              ].map((i, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition rounded-xl border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-200 p-2 rounded-full"><Users size={16} className="text-slate-600"/></div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{i.name}</div>
                      <div className="text-xs text-slate-500">{i.role}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-700">{i.val}</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 bg-slate-800 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-900 transition">
              <Printer size={18} /> Imprimir Recibos
            </button>
          </div>
        </div>
      </div>

      {/* Funcionalidades */}
      <div className="bg-slate-900 text-white py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Tudo que sua empresa precisa</h2>
            <p className="text-slate-400 text-lg">Desenvolvido focado na praticidade do dia a dia.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Gestão de Equipe", desc: "Cadastre diaristas ou mensalistas em segundos, mantendo o controle total do seu time e histórico salarial." },
              { title: "Cálculo Automático", desc: "Apenas informe os dias trabalhados. O sistema calcula proporcionais e diárias automaticamente sem dor de cabeça." },
              { title: "Holerites em 1 Clique", desc: "Gere recibos com visual profissional prontos para imprimir e pegar a assinatura do funcionário na hora." }
            ].map((f, i) => (
              <div key={i} className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 transition-colors">
                <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle className="text-blue-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="bg-slate-950 py-10 text-center text-slate-500 text-sm font-medium border-t border-slate-900">
        &copy; {new Date().getFullYear()} RH Fast SaaS. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function AuthScreen({ auth, db, initialIsLogin, navigate }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // Estado para mensagem de erro profissional
  const [successMsg, setSuccessMsg] = useState(''); // Estado para mensagem de sucesso

  // Muda a rota visualmente se a pessoa alternar entre login e cadastro
  const toggleMode = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (isLogin) {
      setIsLogin(false);
      window.history.replaceState({}, '', '/cadastro');
    } else {
      setIsLogin(true);
      window.history.replaceState({}, '', '/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // O redirect pro painel é feito automaticamente pelo useEffect principal
      } else {
        if (password.length < 6) {
          setErrorMsg("A senha precisa ter no mínimo 6 caracteres.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Cria o registro da empresa no banco
        await setDoc(doc(db, 'companies', userCredential.user.uid), {
          nomeEmpresa: empresa,
          email: email,
          dataCadastro: new Date()
        });
        setSuccessMsg("Conta criada com sucesso! Redirecionando...");
        // Redirect é automático
      }
    } catch (error) {
      console.error(error);
      if (isLogin) {
        setErrorMsg("E-mail ou senha incorretos. Verifique e tente novamente.");
      } else {
        if (error.code === 'auth/email-already-in-use') {
          setErrorMsg("Este e-mail já está cadastrado no sistema.");
        } else {
          setErrorMsg("Erro ao criar conta. Tente novamente mais tarde.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative p-4 selection:bg-blue-200">
      
      {/* Botão de Voltar ao Site */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition px-4 py-2 rounded-xl hover:bg-blue-100"
      >
        <ArrowLeft size={20} /> <span className="hidden md:inline">Voltar ao site</span>
      </button>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md mx-auto border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 transform -rotate-3">
            <Building size={40} className="transform rotate-3" />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-center text-slate-900 mb-2">RH Fast</h2>
        <p className="text-center text-slate-500 mb-8 font-medium">
          {isLogin ? 'Acesse o painel da sua empresa' : 'Cadastre sua empresa gratuitamente'}
        </p>

        {/* Mensagens de Alerta Bonitas */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-700 animate-fade-in">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3 text-green-700 animate-fade-in">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Empresa</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input required type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full pl-12 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white text-slate-800 font-medium transition-all" placeholder="Ex: Padaria do João" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white text-slate-800 font-medium transition-all" placeholder="seu@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Key className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 hover:bg-white text-slate-800 font-medium transition-all" placeholder="••••••••" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 transition-all shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 mt-4 text-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Aguarde...
              </span>
            ) : (isLogin ? 'Entrar no Sistema' : 'Criar Conta Grátis')}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-slate-500 mb-2">{isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}</p>
          <button type="button" onClick={toggleMode} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
            {isLogin ? 'Crie uma conta para sua empresa' : 'Faça login com seu e-mail'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ navigate, employees }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-10 md:py-16">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Resumo da sua Empresa</h2>
        <p className="text-slate-500 font-medium text-lg">Selecione uma das opções abaixo para começar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div onClick={() => navigate('/funcionarios')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all flex flex-col items-center gap-4 text-center group">
          <div className="bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 p-5 rounded-2xl transition-colors">
            <Users size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">Gerir Equipe</h3>
            <p className="text-slate-500 font-medium">{employees.length} colaboradores cadastrados</p>
          </div>
        </div>

        <div onClick={() => navigate('/gerar-folha')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl hover:border-green-300 hover:-translate-y-1 transition-all flex flex-col items-center gap-4 text-center group">
          <div className="bg-green-50 group-hover:bg-green-600 group-hover:text-white text-green-600 p-5 rounded-2xl transition-colors">
            <Calculator size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">Calcular Folha</h3>
            <p className="text-slate-500 font-medium">Lançar dias e gerar recibos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeManager({ employees, userId, db }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', baseValue: '', type: 'mensalista' });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado para controlar quem estamos tentando deletar (Confirmação visual)
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.baseValue) {
      setErrorMsg("Preencha todos os campos corretamente.");
      return;
    }

    try {
      await addDoc(collection(db, 'companies', userId, 'employees'), {
        name: formData.name,
        role: formData.role,
        baseValue: parseFloat(formData.baseValue),
        type: formData.type,
        createdAt: new Date()
      });
      setFormData({ name: '', role: '', baseValue: '', type: 'mensalista' });
      setIsFormOpen(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setErrorMsg("Ocorreu um erro de conexão ao salvar.");
    }
  };

  const confirmDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'companies', userId, 'employees', id));
      setDeletingId(null);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Users className="text-blue-600"/> Sua Equipe</h2>
        <button onClick={() => { setIsFormOpen(!isFormOpen); setErrorMsg(''); }} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition font-bold shadow-sm">
          {isFormOpen ? <><X size={20} /> Fechar Painel</> : <><Plus size={20} /> Novo Funcionário</>}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-blue-100 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          <h3 className="font-black text-xl mb-6 text-slate-800 flex items-center gap-2">Cadastrar Novo Colaborador</h3>
          
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
              <input type="text" required className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Cargo / Função</label>
              <input type="text" required className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-slate-50 focus:bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Ex: Vendedor" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Forma de Pagamento</label>
              <select className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition bg-slate-50 focus:bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="mensalista">Mensalista (Salário Fixo / Mês)</option>
                <option value="diarista">Diarista (Valor Fixo / Dia Trabalhado)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {formData.type === 'mensalista' ? 'Salário Mensal Bruto (R$)' : 'Valor da Diária (R$)'}
              </label>
              <input type="number" required step="0.01" min="1" className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-lg transition bg-slate-50 focus:bg-white" value={formData.baseValue} onChange={e => setFormData({...formData, baseValue: e.target.value})} placeholder="0.00" />
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-slate-100 pt-6">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition w-full md:w-auto">Cancelar</button>
            <button type="submit" className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-md transition w-full md:w-auto flex justify-center items-center gap-2"><CheckCircle size={20}/> Salvar Cadastro</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:border-blue-300 hover:shadow-md transition gap-4">
            <div>
              <h4 className="font-black text-xl text-slate-800">{emp.name}</h4>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <span className="bg-slate-100 px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[10px]">{emp.role}</span>
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full md:w-auto gap-4 md:gap-8">
              <div className="text-left md:text-right">
                <p className="font-mono font-black text-slate-800 text-xl">
                  {Number(emp.baseValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className={`ml-2 text-[10px] px-2 py-1.5 rounded-md font-sans font-black uppercase tracking-widest ${emp.type === 'mensalista' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                    {emp.type === 'mensalista' ? 'Mensal' : 'Por Dia'}
                  </span>
                </p>
              </div>

              {/* Sistema de Deletar sem Alert() */}
              {deletingId === emp.id ? (
                <div className="flex items-center gap-2 animate-fade-in w-full md:w-auto">
                  <span className="text-xs font-bold text-red-500 whitespace-nowrap">Excluir?</span>
                  <button onClick={() => confirmDelete(emp.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-600 shadow-sm flex-1 md:flex-none">Sim</button>
                  <button onClick={() => setDeletingId(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-300 shadow-sm flex-1 md:flex-none">Não</button>
                </div>
              ) : (
                <button onClick={() => setDeletingId(emp.id)} className="text-slate-400 hover:text-red-500 p-3 rounded-xl hover:bg-red-50 transition border border-transparent hover:border-red-100 w-full md:w-auto flex justify-center" title="Excluir Colaborador">
                  <Trash2 size={22} />
                </button>
              )}
            </div>
          </div>
        ))}

        {employees.length === 0 && (
          <div className="text-center py-20 bg-white text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
            <Users size={64} className="mx-auto mb-4 opacity-20" />
            <p className="font-black text-xl text-slate-500">Nenhum colaborador cadastrado.</p>
            <p className="font-medium mt-2">Clique no botão azul "Novo Funcionário" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PayrollCalculator({ employees, onGenerate }) {
  const [inputs, setInputs] = useState({});
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (id, value) => {
    setErrorMsg('');
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const calculate = () => {
    setErrorMsg('');
    const results = employees.map(emp => {
      const days = parseFloat(inputs[emp.id] || 0);
      let total = 0;
      let description = '';

      if (emp.type === 'mensalista') {
        total = (emp.baseValue / 30) * days;
        description = `Salário Proporcional (${days} dias)`;
      } else {
        total = emp.baseValue * days;
        description = `Diárias Trabalhadas (${days} dias x ${Number(emp.baseValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
      }

      return { ...emp, daysWorked: days, totalReceive: total, description };
    });

    const validResults = results.filter(r => r.daysWorked > 0);
    
    // Tratamento de Erro Visual, sem Alerts
    if (validResults.length === 0) {
      setErrorMsg("Você precisa inserir os dias trabalhados (maior que zero) para pelo menos um funcionário antes de gerar os holerites.");
      return;
    }
    
    onGenerate({ period: month, items: validResults });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <div className="bg-green-100 text-green-600 p-2 rounded-xl"><Calendar size={24} /></div> Fechamento de Folha
        </h2>
        
        <div className="mb-8 bg-green-50 p-5 rounded-2xl border border-green-200 flex flex-col md:flex-row items-start md:items-center gap-4">
          <label className="text-sm font-black text-green-900 uppercase tracking-wider">Mês de Referência da Folha:</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="p-3 border border-green-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-green-500 font-bold text-slate-800 outline-none w-full md:w-auto" />
        </div>

        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-4">
            <div className="col-span-6">Colaborador / Contrato</div>
            <div className="col-span-3 text-center">Base de Cálculo</div>
            <div className="col-span-3 text-right">Dias Lançados</div>
          </div>
          
          {employees.map(emp => (
            <div key={emp.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 transition shadow-sm">
              <div className="col-span-1 md:col-span-6">
                <p className="font-black text-slate-800 text-lg">{emp.name}</p>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1 tracking-wider">{emp.role}</p>
              </div>
              <div className="col-span-1 md:col-span-3 text-left md:text-center border-t border-slate-100 md:border-none pt-3 md:pt-0">
                <span className={`text-xs font-black px-3 py-1.5 rounded-lg border uppercase tracking-wide ${emp.type === 'mensalista' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                  {emp.type === 'mensalista' ? 'Mensal' : 'Diária'}: <span className="font-mono">{Number(emp.baseValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
              </div>
              <div className="col-span-1 md:col-span-3 relative">
                <label className="block md:hidden text-xs font-black text-slate-400 mb-2 uppercase tracking-widest mt-2 border-t border-slate-100 pt-3">Dias Trabalhados no mês:</label>
                <div className="relative">
                  <input type="number" min="0" max="31" placeholder="0" className="w-full p-4 pr-10 border-2 border-slate-200 rounded-xl text-right font-black text-2xl text-green-700 focus:border-green-500 focus:ring-0 outline-none shadow-inner bg-slate-50 hover:bg-white transition-colors" onChange={(e) => handleInputChange(emp.id, e.target.value)} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300 pointer-events-none">d</span>
                </div>
              </div>
            </div>
          ))}
          
          {employees.length === 0 && (
             <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
               Adicione funcionários na aba "Equipe" antes de calcular a folha.
             </div>
          )}
        </div>

        {/* Mensagem de Erro Visual da Folha */}
        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center justify-center gap-2 animate-fade-in text-center">
            <AlertCircle size={20} /> {errorMsg}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
          <button onClick={calculate} disabled={employees.length === 0} className="w-full md:w-auto bg-slate-800 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-900 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
            <FileText size={24} /> Gerar Recibos (Holerites)
          </button>
        </div>
      </div>
    </div>
  );
}

function HoleriteView({ data, navigate, companyName }) {
  
  // Tratamento caso atualize a tela nos Holerites sem ter gerado os dados (volta pra folha)
  useEffect(() => {
    if (!data || !data.items) {
      navigate('/gerar-folha');
    }
  }, [data, navigate]);

  if (!data || !data.items) return null; // Previne quebra de tela rápida

  const handlePrint = () => window.print();
  const formatCurrency = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const [ano, mes] = data.period.split('-');
  const dataFormatada = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center print:hidden bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-20 z-10 gap-4">
        <button onClick={() => navigate('/gerar-folha')} className="w-full md:w-auto flex items-center justify-center gap-2 text-slate-600 hover:text-blue-700 font-bold transition px-6 py-3 rounded-xl hover:bg-blue-50 border border-slate-200 hover:border-blue-200">
          <ArrowLeft size={20} /> Voltar para a Folha
        </button>
        <button onClick={handlePrint} className="w-full md:w-auto bg-blue-700 text-white px-10 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800 font-black shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
          <Printer size={20} /> Imprimir Recibos Oficiais
        </button>
      </div>

      <div className="print:w-full print:absolute print:top-0 print:left-0 print:bg-white print:p-0">
        {data.items.map((item, index) => (
          <div key={index} className="bg-white p-8 md:p-10 mb-8 border-2 border-slate-800 rounded-none max-w-4xl mx-auto print:break-inside-avoid print:mb-20 print:border-2 shadow-2xl print:shadow-none relative overflow-hidden">
            {/* Elemento Visual Decorativo (Não sai na impressão se bem configurado, mas dá charme no painel) */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-100 -rotate-45 transform origin-top-right print:hidden opacity-50 pointer-events-none"></div>
            
            {/* Header Holerite */}
            <div className="border-b-4 border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end relative z-10 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-slate-900 leading-none">Recibo de Pagamento</h1>
                <p className="text-sm font-black text-slate-600 uppercase mt-3 bg-slate-200 inline-block px-4 py-1.5 rounded-sm tracking-widest">Referência: {dataFormatada}</p>
              </div>
              <div className="text-left md:text-right w-full md:w-auto border-t-2 border-slate-200 md:border-none pt-4 md:pt-0">
                <p className="font-black text-2xl text-slate-900 uppercase">{companyName}</p>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Recursos Humanos / Administrativo</p>
              </div>
            </div>

            {/* Dados Funcionario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-lg border-2 border-slate-300 print:bg-transparent print:border-2 print:border-slate-800 print:rounded-none">
              <div>
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nome do Colaborador</span>
                <span className="text-xl md:text-2xl font-black text-slate-900 uppercase">{item.name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cargo / Função Exercida</span>
                <span className="text-xl md:text-2xl font-black text-slate-900 uppercase">{item.role}</span>
              </div>
            </div>

            {/* Tabela Principal */}
            <table className="w-full mb-10 border-collapse border-2 border-slate-800">
              <thead>
                <tr className="bg-slate-200 border-b-4 border-slate-800 print:bg-transparent print:border-b-2">
                  <th className="text-left py-4 px-4 md:px-6 uppercase text-[11px] font-black tracking-widest border-r-2 border-slate-400">Descrição do Lançamento</th>
                  <th className="text-center py-4 px-2 md:px-4 uppercase text-[11px] font-black tracking-widest border-r-2 border-slate-400">Ref.</th>
                  <th className="text-right py-4 px-4 md:px-6 uppercase text-[11px] font-black tracking-widest border-r-2 border-slate-400 w-32 md:w-48">Vencimentos</th>
                  <th className="text-right py-4 px-4 md:px-6 uppercase text-[11px] font-black tracking-widest w-32 md:w-48">Descontos</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300 print:border-slate-800">
                  <td className="py-5 px-4 md:px-6 text-sm md:text-base font-bold text-slate-800 border-r-2 border-slate-300 print:border-slate-800">{item.description}</td>
                  <td className="text-center text-sm md:text-base font-black border-r-2 border-slate-300 print:border-slate-800 bg-slate-50 print:bg-transparent">{item.daysWorked}d</td>
                  <td className="text-right text-sm md:text-base font-mono font-black border-r-2 border-slate-300 print:border-slate-800">{formatCurrency(item.totalReceive)}</td>
                  <td className="text-right text-sm md:text-base font-mono text-slate-400 font-bold">0,00</td>
                </tr>
                {/* Espaço em branco para formatação clássica de holerite */}
                <tr className="h-32 md:h-48">
                  <td className="border-r-2 border-slate-300 print:border-slate-800"></td>
                  <td className="border-r-2 border-slate-300 print:border-slate-800 bg-slate-50 print:bg-transparent"></td>
                  <td className="border-r-2 border-slate-300 print:border-slate-800"></td>
                  <td></td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-slate-800 print:border-t-2">
                  <td colSpan="2" className="py-4 px-6 bg-slate-100 print:bg-transparent border-r-4 border-slate-800 print:border-r-2">
                     <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Base de Cálculo {item.type === 'mensalista' ? 'Mensal' : 'Diária'}</p>
                     <p className="font-mono font-black text-lg">{formatCurrency(item.baseValue)}</p>
                  </td>
                  <td colSpan="2" className="py-4 px-6 bg-slate-900 text-white print:bg-transparent print:text-black">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <span className="uppercase text-xs font-black tracking-widest mb-1 md:mb-0">Líquido a Pagar</span>
                      <span className="text-2xl md:text-3xl font-mono font-black leading-none">{formatCurrency(item.totalReceive)}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Áreas de Assinatura */}
            <div className="mt-24 pt-4 flex flex-col md:flex-row justify-between items-end px-4 gap-12 md:gap-4">
              <div className="text-center w-full md:w-5/12">
                <div className="border-t-2 border-slate-800 pt-3"></div>
                <p className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Assinatura do Empregador</p>
              </div>
              <div className="text-center text-xs font-black text-slate-500 uppercase tracking-widest pb-4 md:pb-2 whitespace-nowrap">
                Data: ___/___/20___
              </div>
              <div className="text-center w-full md:w-5/12">
                <div className="border-t-2 border-slate-800 pt-3"></div>
                <p className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Assinatura do Colaborador</p>
              </div>
            </div>
            
            <div className="mt-12 text-center border-t-2 border-dashed border-slate-300 pt-4">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Documento Auxiliar de RH - Processado Eletronicamente via RH Fast SaaS</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}