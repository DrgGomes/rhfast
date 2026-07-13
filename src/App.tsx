// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAco2vbYVQdL9c0Ls7AaUKHMUN8xCclip0",
  authDomain: "astute-nuance-469614-h3.firebaseapp.com",
  projectId: "astute-nuance-469614-h3",
  storageBucket: "astute-nuance-469614-h3.firebasestorage.app",
  messagingSenderId: "C740756160162",
  appId: "1:740756160162:web:21df14a8e49a78e62ce1fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('landing');

  useEffect(() => {
    onAuthStateChanged(auth, (u) => { setUser(u); if(u) setPage('dashboard'); });
  }, []);

  if (!user) {
    return page === 'landing' ? <LandingPage onGoLogin={() => setPage('login')} /> : <AuthScreen onBack={() => setPage('landing')} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 flex justify-between shadow-lg">
        <h1 className="font-bold text-xl cursor-pointer" onClick={() => setPage('dashboard')}>RH Fast</h1>
        <div className="space-x-4">
          <button onClick={() => setPage('dashboard')}>Início</button>
          <button onClick={() => setPage('employees')}>Equipe</button>
          <button onClick={() => setPage('payroll')}>Folha</button>
          <button onClick={() => setPage('reports')}>Relatórios</button>
          <button onClick={() => signOut(auth)} className="bg-blue-800 px-2 rounded">Sair</button>
        </div>
      </nav>
      <main className="p-6">
        {page === 'dashboard' && <Dashboard />}
        {page === 'employees' && <EmployeeManager uid={user.uid} />}
        {page === 'payroll' && <PayrollCalculator uid={user.uid} />}
        {page === 'reports' && <Reports uid={user.uid} />}
      </main>
    </div>
  );
}

function LandingPage({ onGoLogin }) {
  return (
    <div className="text-center p-20 bg-white min-h-screen">
      <h1 className="text-5xl font-bold mb-6">Chega de planilhas.</h1>
      <p className="text-xl mb-10 text-gray-600">Seu RH fácil em minutos.</p>
      <button onClick={onGoLogin} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold">Começar Agora</button>
    </div>
  );
}

function AuthScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const handleAuth = async (isLogin) => {
    try {
      isLogin ? await signInWithEmailAndPassword(auth, email, pass) : await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) { alert(e.message); }
  };
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Acesso Empresa</h2>
        <input className="w-full p-2 border mb-2" placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
        <input className="w-full p-2 border mb-4" type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} />
        <button onClick={() => handleAuth(true)} className="w-full bg-blue-600 text-white py-2 mb-2 rounded">Entrar</button>
        <button onClick={() => handleAuth(false)} className="w-full border py-2 rounded">Criar conta</button>
        <button onClick={onBack} className="w-full mt-4 text-sm text-gray-500">Voltar</button>
      </div>
    </div>
  );
}

function Dashboard() { return <div className="p-10 text-center"><h2>Bem-vindo ao Painel RH Fast</h2></div>; }

function EmployeeManager({ uid }) {
  const [emp, setEmp] = useState({ name: '', baseValue: 0, type: 'mensalista' });
  const save = async () => {
    await addDoc(collection(db, 'companies', uid, 'employees'), emp);
    alert('Cadastrado!');
  };
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Cadastrar Colaborador</h2>
      <input className="block border p-2 mb-2 w-full" placeholder="Nome" onChange={e => setEmp({...emp, name: e.target.value})} />
      <input className="block border p-2 mb-2 w-full" placeholder="Salário/Diária" onChange={e => setEmp({...emp, baseValue: e.target.value})} />
      <button onClick={save} className="bg-green-600 text-white p-2 w-full">Salvar Cadastro</button>
    </div>
  );
}

function PayrollCalculator({ uid }) {
  const [days, setDays] = useState({});
  const closePayroll = async () => {
      alert("Relatório gerado!");
  };
  return (
      <div className="p-6 bg-white shadow rounded">
          <h2 className="text-xl font-bold mb-4">Gerar Folha</h2>
          <button onClick={closePayroll} className="bg-green-600 text-white p-2 rounded">Fechar Folha e Gerar Relatório</button>
      </div>
  );
}

function Reports({ uid }) {
    return <div className="p-6 bg-white shadow rounded"><h2>Histórico de Relatórios</h2></div>;
}