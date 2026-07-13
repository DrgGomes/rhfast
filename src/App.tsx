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
  Printer, Calendar, ArrowLeft,
  LogOut, Building, Mail, Key, CheckCircle, ArrowRight
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
  const [view, setView] = useState('dashboard'); 
  const [employees, setEmployees] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null); 
  
  // Controle de qual tela pública mostrar ('landing', 'login', 'register')
  const [publicView, setPublicView] = useState('landing'); 

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

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
    setView('dashboard');
    setPublicView('landing');
  };

  const renderView = () => {
    switch(view) {
      case 'employees': return <EmployeeManager employees={employees} userId={user.uid} db={db} />;
      case 'payroll': return <PayrollCalculator employees={employees} onGenerate={(data) => { setSelectedPayroll(data); setView('print'); }} />;
      case 'print': return <HoleriteView data={selectedPayroll} onBack={() => setView('payroll')} companyName={user.displayName || "Empresa Parceira"} />;
      default: return <Dashboard changeView={setView} employees={employees} />;
    }
  };

  if (loadingAuth) return <div className="flex items-center justify-center h-screen text-slate-500 font-bold bg-slate-50">Carregando sistema seguro...</div>;

  // Roteamento Público (Sem usuário logado)
  if (!user) {
    if (publicView === 'landing') {
      return <LandingPage onNavigate={setPublicView} />;
    }
    return <AuthScreen auth={auth} db={db} initialIsLogin={publicView === 'login'} onNavigate={setPublicView} />;
  }

  // Se estiver logado, mostra o Painel
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header do Sistema */}
      <header className="bg-blue-700 text-white p-4 shadow-lg print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-700 p-2 rounded-lg shadow-sm">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight tracking-wide">RH Fast</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200">Painel de Gestão</p>
            </div>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-2 md:gap-4 text-sm font-medium">
            <button onClick={() => setView('dashboard')} className={`px-3 py-2 rounded-lg transition hover:bg-blue-600 ${view === 'dashboard' ? 'bg-blue-800 font-bold shadow-inner' : ''}`}>Início</button>
            <button onClick={() => setView('employees')} className={`px-3 py-2 rounded-lg transition hover:bg-blue-600 ${view === 'employees' ? 'bg-blue-800 font-bold shadow-inner' : ''}`}>Equipe</button>
            <button onClick={() => setView('payroll')} className={`px-3 py-2 rounded-lg transition hover:bg-blue-600 ${view === 'payroll' ? 'bg-blue-800 font-bold shadow-inner' : ''}`}>Gerar Folha</button>
            <button onClick={handleLogout} className="px-3 py-2 rounded-lg transition hover:bg-red-500 hover:border-transparent flex items-center gap-1 ml-2 border border-blue-400">
              <LogOut size={16}/> Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {renderView()}
      </main>
    </div>
  );
}

// --- Componentes Novos: Landing Page e Login Melhorado ---

// Página de Apresentação (Site Oficial)
function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Menu Superior do Site */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-700 text-white p-1.5 rounded-lg">
              <Building className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">RH Fast<span className="text-blue-600">.</span></span>
          </div>
          <div className="flex gap-2 md:gap-4 items-center text-sm font-bold">
            <button onClick={() => onNavigate('login')} className="text-slate-600 hover:text-blue-700 transition px-3 py-2">
              Entrar
            </button>
            <button onClick={() => onNavigate('register')} className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-block bg-blue-100 text-blue-800 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest mb-2">
            Para Pequenas Empresas
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1]">
            Chega de planilhas. <br/>
            <span className="text-blue-600">Seu RH fácil</span> em minutos.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed md:max-w-md">
            O RH Fast foi criado para o empresário que não tem tempo a perder. Cadastre funcionários, calcule dias trabalhados e gere holerites em poucos cliques. Tudo na nuvem, simples e seguro.
          </p>
          <div className="flex gap-4 pt-4">
            <button onClick={() => onNavigate('register')} className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-2">
              Começar Agora <ArrowRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Imagem/Ilustração da Hero */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600 rounded-[2rem] transform rotate-3 opacity-10"></div>
          <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 relative z-10">
            <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
              <div className="font-black text-slate-800">Resumo da Folha</div>
              <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Gerado com Sucesso</div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Maria Silva', role: 'Mensalista', val: 'R$ 2.500' },
                { name: 'João Santos', role: 'Diarista (15 dias)', val: 'R$ 1.500' },
                { name: 'Ana Souza', role: 'Mensalista', val: 'R$ 3.200' }
              ].map((i, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{i.name}</div>
                    <div className="text-xs text-slate-500">{i.role}</div>
                  </div>
                  <div className="font-mono font-bold text-slate-700">{i.val}</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-slate-800 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2">
              <Printer size={18} /> Imprimir Recibos
            </button>
          </div>
        </div>
      </div>

      {/* Funcionalidades */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Tudo que sua empresa precisa</h2>
            <p className="text-slate-400">Desenvolvido focado na praticidade do dia a dia.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Gestão de Equipe", desc: "Cadastre diaristas ou mensalistas em segundos, mantendo o controle total do seu time." },
              { title: "Cálculo Automático", desc: "Apenas informe os dias trabalhados. O sistema calcula proporcionais e diárias automaticamente." },
              { title: "Holerites em 1 Clique", desc: "Gere recibos com visual profissional prontos para imprimir e pegar a assinatura do funcionário." }
            ].map((f, i) => (
              <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <CheckCircle className="text-blue-400 w-10 h-10 mb-4" />
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} RH Fast SaaS. Todos os direitos reservados.
      </footer>
    </div>
  );
}

// Tela de Login e Cadastro
function AuthScreen({ auth, db, initialIsLogin, onNavigate }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'companies', userCredential.user.uid), {
          nomeEmpresa: empresa,
          email: email,
          dataCadastro: new Date()
        });
        alert("Conta criada com sucesso! Bem-vindo ao RH Fast.");
      }
    } catch (error) {
      console.error(error);
      alert(isLogin ? "Erro ao entrar. Verifique e-mail e senha." : "Erro ao criar conta. A senha deve ter 6+ caracteres.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative p-4">
      
      {/* Botão de Voltar ao Site */}
      <button 
        onClick={() => onNavigate('landing')} 
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition px-4 py-2 rounded-lg hover:bg-blue-50"
      >
        <ArrowLeft size={20} /> Voltar ao site
      </button>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 rounded-xl shadow-lg shadow-blue-200">
            <Building size={40} />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-center text-slate-900 mb-2">RH Fast</h2>
        <p className="text-center text-slate-500 mb-8 font-medium">
          {isLogin ? 'Acesse o painel da sua empresa' : 'Cadastre sua empresa gratuitamente'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Empresa</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 text-slate-400" size={20} />
                <input required type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full pl-11 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-800 font-medium transition" placeholder="Ex: Padaria do João" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={20} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-800 font-medium transition" placeholder="seu@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 text-slate-400" size={20} />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-800 font-medium transition" placeholder="••••••••" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70 mt-4 text-lg">
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar no Sistema' : 'Criar Conta Grátis')}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-slate-500 mb-2">{isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}</p>
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition">
            {isLogin ? 'Crie uma conta para sua empresa' : 'Faça login com seu e-mail'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 1. Dashboard
function Dashboard({ changeView, employees }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-slate-700">Bem-vindo ao seu RH</h2>
        <p className="text-slate-500">Gerencie sua equipe de forma simples e rápida, sem planilhas complexas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div onClick={() => changeView('employees')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-3 text-center">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Funcionários</h3>
          <p className="text-sm text-slate-500 font-medium">{employees.length} colaboradores cadastrados</p>
        </div>

        <div onClick={() => changeView('payroll')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center gap-3 text-center">
          <div className="bg-green-100 p-4 rounded-full text-green-600">
            <Calculator size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Calcular Folha</h3>
          <p className="text-sm text-slate-500 font-medium">Lançar dias e gerar holerites</p>
        </div>
      </div>
    </div>
  );
}

// 2. Gerenciador de Funcionários
function EmployeeManager({ employees, userId, db }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', baseValue: '', type: 'mensalista' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.baseValue) return;
    try {
      // Salva no banco de dados exclusivo desta empresa
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
      alert("Erro ao salvar funcionário.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      await deleteDoc(doc(db, 'companies', userId, 'employees', id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-blue-600"/> Equipe</h2>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-bold shadow-sm">
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
          <h3 className="font-bold mb-4 text-blue-800 flex items-center gap-2">Cadastrar Novo Colaborador</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input type="text" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cargo / Função</label>
              <input type="text" required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Ex: Vendedor" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Forma de Pagamento</label>
              <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="mensalista">Mensalista (Salário Fixo / Mês)</option>
                <option value="diarista">Diarista (Valor Fixo / Dia Trabalhado)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {formData.type === 'mensalista' ? 'Salário Mensal Bruto (R$)' : 'Valor da Diária (R$)'}
              </label>
              <input type="number" required step="0.01" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" value={formData.baseValue} onChange={e => setFormData({...formData, baseValue: e.target.value})} placeholder="0.00" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md transition">Salvar Cadastro</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:border-blue-300 hover:shadow-md transition">
            <div className="mb-2 md:mb-0">
              <h4 className="font-bold text-lg text-slate-800">{emp.name}</h4>
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">{emp.role}</span>
              </p>
            </div>
            <div className="flex items-center justify-between w-full md:w-auto gap-6">
              <div className="text-left md:text-right">
                <p className="font-mono font-black text-slate-700 text-lg">
                  {Number(emp.baseValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className={`ml-2 text-[10px] px-2 py-1 rounded-full font-sans font-bold uppercase ${emp.type === 'mensalista' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                    {emp.type === 'mensalista' ? 'Mensal' : 'Por Dia'}
                  </span>
                </p>
              </div>
              <button onClick={() => handleDelete(emp.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition border border-transparent hover:border-red-100" title="Excluir">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="text-center py-16 bg-white text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg text-slate-500">Nenhum funcionário cadastrado.</p>
            <p className="text-sm mt-1">Clique no botão "Novo Funcionário" acima para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Calculadora de Folha
function PayrollCalculator({ employees, onGenerate }) {
  const [inputs, setInputs] = useState({});
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); 

  const handleInputChange = (id, value) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const calculate = () => {
    const results = employees.map(emp => {
      const days = parseFloat(inputs[emp.id] || 0);
      let total = 0;
      let description = '';

      if (emp.type === 'mensalista') {
        total = (emp.baseValue / 30) * days;
        description = `Salário Mensal Proporcional (${days} dias)`;
      } else {
        total = emp.baseValue * days;
        description = `Diárias de Serviço (${days} dias x ${Number(emp.baseValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
      }

      return { ...emp, daysWorked: days, totalReceive: total, description };
    });

    const validResults = results.filter(r => r.daysWorked > 0);
    if (validResults.length === 0) {
      alert("Por favor, insira os dias trabalhados (maior que zero) para pelo menos um funcionário antes de gerar os holerites.");
      return;
    }
    onGenerate({ period: month, items: validResults });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="text-green-600" /> Fechamento de Folha
        </h2>
        
        <div className="mb-6 bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-inner">
          <label className="text-sm font-bold text-green-900 whitespace-nowrap uppercase tracking-wider">Mês de Referência:</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="p-2 border border-green-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-green-500 font-bold text-slate-700 outline-none w-full md:w-auto" />
        </div>

        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-2 px-4">
            <div className="col-span-6">Colaborador / Contrato</div>
            <div className="col-span-3 text-center">Base de Cálculo</div>
            <div className="col-span-3 text-right">Dias Lançados</div>
          </div>
          
          {employees.map(emp => (
            <div key={emp.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 transition shadow-sm">
              <div className="col-span-1 md:col-span-6">
                <p className="font-bold text-slate-800 text-lg">{emp.name}</p>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">{emp.role}</p>
              </div>
              <div className="col-span-1 md:col-span-3 text-left md:text-center">
                <span className={`text-xs font-bold px-2 py-1 rounded-md border ${emp.type === 'mensalista' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                  {emp.type === 'mensalista' ? 'MENSAL:' : 'DIÁRIA:'} <span className="font-mono">{Number(emp.baseValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </span>
              </div>
              <div className="col-span-1 md:col-span-3 relative">
                <label className="block md:hidden text-xs font-bold text-slate-500 mb-1 uppercase">Dias Trabalhados:</label>
                <div className="relative">
                  <input type="number" min="0" max="31" placeholder="0" className="w-full p-3 pr-8 border border-slate-300 rounded-lg text-right font-black text-xl text-green-700 focus:ring-2 focus:ring-green-500 outline-none shadow-inner bg-slate-50" onChange={(e) => handleInputChange(emp.id, e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 pointer-events-none">d</span>
                </div>
              </div>
            </div>
          ))}
          
          {employees.length === 0 && (
             <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-lg border border-slate-200">
               Adicione funcionários na aba "Equipe" antes de calcular a folha.
             </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
          <button onClick={calculate} disabled={employees.length === 0} className="w-full md:w-auto bg-slate-800 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:bg-slate-900 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <FileText size={24} /> Gerar Recibos (Holerites)
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. Visualização de Holerite e Impressão
function HoleriteView({ data, onBack, companyName }) {
  const handlePrint = () => window.print();
  const formatCurrency = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const [ano, mes] = data.period.split('-');
  const dataFormatada = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-md border border-slate-200 sticky top-4 z-10 gap-4">
        <button onClick={onBack} className="w-full md:w-auto flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition px-4 py-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-300">
          <ArrowLeft size={20} /> Voltar e Editar
        </button>
        <button onClick={handlePrint} className="w-full md:w-auto bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800 font-black shadow-lg">
          <Printer size={20} /> Imprimir Recibos PDF
        </button>
      </div>

      <div className="print:w-full print:absolute print:top-0 print:left-0 print:bg-white">
        {data.items.map((item, index) => (
          <div key={index} className="bg-white p-8 mb-8 border-2 border-slate-800 rounded-none max-w-3xl mx-auto print:break-inside-avoid print:mb-20 print:border-2 shadow-xl print:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 -rotate-45 transform origin-top-right print:hidden opacity-50 pointer-events-none"></div>
            
            {/* Header Holerite */}
            <div className="border-b-4 border-slate-800 pb-4 mb-6 flex justify-between items-start relative z-10">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">Recibo de Pagamento</h1>
                <p className="text-md font-bold text-slate-600 uppercase mt-1 bg-slate-200 inline-block px-3 py-1 rounded-sm">Ref: {dataFormatada}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl text-slate-800">{companyName || "Empresa"}</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">RH / Administrativo</p>
              </div>
            </div>

            {/* Dados Funcionario */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-100 p-4 rounded-lg border border-slate-300 print:bg-transparent print:border-2 print:border-slate-800 print:rounded-none">
              <div>
                <span className="block text-xs font-black text-slate-500 uppercase tracking-wider">Nome do Colaborador</span>
                <span className="text-xl font-bold text-slate-900">{item.name}</span>
              </div>
              <div>
                <span className="block text-xs font-black text-slate-500 uppercase tracking-wider">Cargo / Função</span>
                <span className="text-xl font-bold text-slate-900">{item.role}</span>
              </div>
            </div>

            <table className="w-full mb-8 border-collapse border-2 border-slate-800">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-slate-800 print:bg-transparent">
                  <th className="text-left py-3 px-4 uppercase text-xs font-black tracking-wider border-r border-slate-400">Descrição</th>
                  <th className="text-center py-3 px-4 uppercase text-xs font-black tracking-wider border-r border-slate-400">Ref.</th>
                  <th className="text-right py-3 px-4 uppercase text-xs font-black tracking-wider border-r border-slate-400">Vencimentos</th>
                  <th className="text-right py-3 px-4 uppercase text-xs font-black tracking-wider">Descontos</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-4 px-4 text-sm font-medium border-r border-slate-300">{item.description}</td>
                  <td className="text-center text-sm font-bold border-r border-slate-300">{item.daysWorked}d</td>
                  <td className="text-right text-sm font-mono font-bold border-r border-slate-300 text-green-700">{formatCurrency(item.totalReceive)}</td>
                  <td className="text-right text-sm font-mono text-slate-400">0,00</td>
                </tr>
                <tr className="h-24"><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td className="border-r border-slate-300"></td><td></td></tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800">
                  <td colSpan="2" className="py-4 px-4 bg-slate-50 print:bg-transparent border-r-2 border-slate-800">
                     <p className="text-xs uppercase font-black text-slate-500">Base {item.type === 'mensalista' ? 'Mensal' : 'Diária'}</p>
                     <p className="font-mono font-bold">{formatCurrency(item.baseValue)}</p>
                  </td>
                  <td colSpan="2" className="py-4 px-4 bg-slate-800 text-white print:bg-transparent print:text-black">
                    <div className="flex justify-between items-center">
                      <span className="uppercase text-sm font-black">Líquido a Pagar</span>
                      <span className="text-2xl font-mono font-black">{formatCurrency(item.totalReceive)}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-20 pt-2 flex justify-between items-end px-4">
              <div className="text-center w-5/12">
                <div className="border-t-2 border-slate-800 pt-2"></div>
                <p className="text-xs font-black uppercase text-slate-600">Assinatura do Empregador</p>
              </div>
              <div className="text-center text-xs font-bold text-slate-400 pb-2">
                Data: ___/___/20___
              </div>
              <div className="text-center w-5/12">
                <div className="border-t-2 border-slate-800 pt-2"></div>
                <p className="text-xs font-black uppercase text-slate-600">Assinatura do Colaborador</p>
              </div>
            </div>
            
            <div className="mt-8 text-center border-t border-dashed border-slate-300 pt-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documento Auxiliar de RH gerado via RH Fácil SaaS</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}