// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// --- CONFIGURAÇÃO FIREBASE (Mantenha as suas chaves aqui) ---
const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "COLE_AQUI_SEU_DOMAIN",
  projectId: "COLE_AQUI_SEU_ID",
  storageBucket: "COLE_AQUI_SEU_STORAGE",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// -------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('landing'); // 'landing', 'login', 'dashboard', 'employees', etc.

  useEffect(() => {
    // Escuta mudanças de autenticação
    onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      if(u) {
        setPage('dashboard'); 
      }
    });
  }, []);

  // Se o usuário não estiver logado, mostra Landing Page ou Tela de Login
  if (!user) {
    if (page === 'landing') {
      return <LandingPage onGoLogin={() => setPage('login')} />;
    } else {
      return <AuthScreen onBack={() => setPage('landing')} />;
    }
  }

  // Layout Interno (Acesso Logado)
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-blue-600 text-white p-4 flex justify-between shadow-lg">
        <h1 className="font-bold text-xl cursor-pointer" onClick={() => setPage('dashboard')}>RH Fast</h1>
        <div className="space-x-4 flex items-center">
          <button className="hover:text-blue-200" onClick={() => setPage('dashboard')}>Início</button>
          <button className="hover:text-blue-200" onClick={() => setPage('employees')}>Equipe</button>
          <button className="hover:text-blue-200" onClick={() => setPage('payroll')}>Folha</button>
          <button className="hover:text-blue-200" onClick={() => setPage('reports')}>Relatórios</button>
          <button onClick={() => signOut(auth)} className="bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded">Sair</button>
        </div>
      </nav>
      <main className="p-6 flex-grow">
        {page === 'dashboard' && <Dashboard />}
        {page === 'employees' && <EmployeeManager uid={user.uid} />}
        {page === 'payroll' && <PayrollCalculator uid={user.uid} />}
        {page === 'reports' && <Reports uid={user.uid} />}
      </main>
    </div>
  );
}

// --- COMPONENTES PÚBLICOS ---

function LandingPage({ onGoLogin }) {
  return (
    <div className="text-center p-20 bg-white min-h-screen flex flex-col justify-center items-center">
      <div className="flex items-center space-x-2 mb-6">
          {/* Mockup simples do logo */}
          <div className="w-12 h-12 rounded-full bg-blue-600"></div>
          <h1 className="text-5xl font-bold text-blue-900">RH Fast</h1>
      </div>
      <p className="text-2xl mb-10 text-gray-600">Chega de planilhas. Seu RH fácil em minutos.</p>
      <button onClick={onGoLogin} className="bg-blue-600 text-white px-10 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-blue-700 transition duration-150">
        Começar Agora
      </button>
    </div>
  );
}

// --- NOVA TELA DE AUTENTICAÇÃO REFORMULADA ---
function AuthScreen({ onBack }) {
  const [isLogin, setIsLogin] = useState(true); // Controla se estamos no modo Login ou Cadastro
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) { 
      alert(e.message); 
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Coluna da Esquerda (Branding e Ilustração) */}
      <div className="w-1/2 bg-teal-900 text-white p-16 flex flex-col justify-center items-start">
          <div className="flex items-center space-x-2 mb-6">
              {/* Logo Mockup */}
              <div className="w-10 h-10 rounded-full bg-white text-teal-900 flex items-center justify-center font-bold text-xl">RHF</div>
              <h1 className="text-3xl font-bold">RH Fast</h1>
          </div>
          
          <p className="text-lg mb-12">Sua gestão de pessoal, rápida e simplificada.</p>
          
          {/* Mockup da Ilustração do Time (substitua por um SVG real se possível) */}
          <div className="w-full h-80 bg-white/10 rounded-3xl flex items-center justify-center">
              <span className="text-white/40">Ilustração do Time</span>
          </div>
      </div>

      {/* Coluna da Direita (Formulário) */}
      <div className="w-1/2 bg-white p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
            {isLogin ? 'Acesso Empresa' : 'Cadastrar Empresa'}
          </h2>
          
          <div className="space-y-4">
              <input 
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-200 outline-none" 
                  placeholder="E-mail (ex: drgimportslojas@gmail.com)" 
                  onChange={e => setEmail(e.target.value)} 
              />
              <input 
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-200 outline-none" 
                  type="password" 
                  placeholder="Senha" 
                  onChange={e => setPass(e.target.value)} 
              />
          </div>

          <div className="text-right mt-2">
            <a href="#" className="text-sm text-gray-500 hover:text-blue-600">Recuperar senha</a>
          </div>
          
          <button 
              onClick={handleAuth} 
              className="w-full bg-blue-600 text-white py-3 mt-6 rounded-full font-bold hover:bg-blue-700 shadow transition duration-150"
          >
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
          
          <div className="text-center mt-6 space-y-3">
              {isLogin ? (
                  <p className="text-sm text-gray-600">
                      Ainda não tem uma conta? <button onClick={() => setIsLogin(false)} className="text-blue-600 font-medium hover:underline">Cadastre-se.</button>
                  </p>
              ) : (
                  <p className="text-sm text-gray-600">
                      Já possui uma conta? <button onClick={() => setIsLogin(true)} className="text-blue-600 font-medium hover:underline">Entre.</button>
                  </p>
              )}
              <button onClick={onBack} className="text-sm text-gray-500 hover:text-blue-600">Voltar para o início</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES PRIVADOS (Painel Interno) ---

function Dashboard() { return <div className="p-10 text-center"><h2 className="text-2xl font-bold">Bem-vindo ao Painel RH Fast</h2></div>; }

function EmployeeManager({ uid }) {
  const [emp, setEmp] = useState({ name: '', baseValue: 0, type: 'mensalista' });
  const save = async () => {
    // Validação simples
    if (!emp.name || !emp.baseValue) return alert("Preencha todos os campos.");
    try {
        await addDoc(collection(db, 'companies', uid, 'employees'), emp);
        alert('Colaborador cadastrado!');
        // Limpa o form (básico)
        setEmp({ name: '', baseValue: 0, type: 'mensalista' });
    } catch(e) { alert(e.message); }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-6 text-blue-900">Cadastrar Novo Colaborador</h2>
      <div className="space-y-3">
          <input className="block border p-3 rounded-lg w-full outline-none focus:ring-1 focus:ring-blue-300" placeholder="Nome" value={emp.name} onChange={e => setEmp({...emp, name: e.target.value})} />
          <input className="block border p-3 rounded-lg w-full outline-none focus:ring-1 focus:ring-blue-300" placeholder="Salário Base / Diária (ex: 2500)" value={emp.baseValue} onChange={e => setEmp({...emp, baseValue: e.target.value})} />
          
          <select className="block border p-3 rounded-lg w-full outline-none focus:ring-1 focus:ring-blue-300" value={emp.type} onChange={e => setEmp({...emp, type: e.target.value})}>
              <option value="mensalista">Mensalista</option>
              <option value="diarista">Diarista</option>
          </select>
          
          <button onClick={save} className="bg-green-600 text-white p-3 w-full rounded-lg font-bold shadow hover:bg-green-700 transition">
              Salvar Cadastro
          </button>
      </div>
    </div>
  );
}

function PayrollCalculator({ uid }) {
  const closePayroll = async () => {
      alert("Lógica de geração de relatório será implementada em breve!");
  };
  
  return (
      <div className="p-10 bg-white shadow-lg rounded-xl max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Gerar Folha de Pagamento</h2>
          <p className="text-gray-600 mb-6">Em breve: carregue seus colaboradores e calcule os salários do mês.</p>
          <button onClick={closePayroll} className="bg-green-600 text-white p-3 px-6 rounded-full font-bold shadow hover:bg-green-700 transition">
              Processar Pagamentos
          </button>
      </div>
  );
}

function Reports({ uid }) {
    return <div className="p-10 bg-white shadow rounded"><h2>Histórico de Relatórios (A implementar)</h2></div>;
}