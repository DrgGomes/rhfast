// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, setDoc, getDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBiN6qptBjHUNuk5V429jUmfi8-R2W6IGE",
  authDomain: "gen-lang-client-0208170765.firebaseapp.com",
  projectId: "gen-lang-client-0208170765",
  storageBucket: "gen-lang-client-0208170765.firebasestorage.app",
  messagingSenderId: "386351187550",
  appId: "1:386351187550:web:1103e9b53536be141b16cf",
  measurementId: "G-7FHHNDY3KM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// -------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('landing'); 
  const [companyProfile, setCompanyProfile] = useState({ name: 'Sua Empresa', cnpj: '', logo: '' });

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => { 
      setUser(u); 
      if(u) {
          const docRef = doc(db, 'companies', u.uid, 'settings', 'profile');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              setCompanyProfile(docSnap.data());
          }
          setPage('dashboard'); 
      }
    });
  }, []);

  if (!user) {
    return page === 'landing' ? <LandingPage onGoLogin={() => setPage('login')} /> : <AuthScreen onBack={() => setPage('landing')} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans w-full">
      <nav className="bg-[#303863] text-white flex justify-between items-center shadow-md w-full px-8 py-3 print:hidden">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('dashboard')}>
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center overflow-hidden">
                {companyProfile.logo ? (
                    <img src={companyProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[#303863] font-black text-xl leading-none">RH</span>
                )}
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight truncate max-w-[200px]">{companyProfile.name}</h1>
                <p className="text-xs text-blue-300">Empresa Conectada</p>
            </div>
        </div>
        
        <div className="flex space-x-2 bg-[#424b7a] rounded-lg p-1 overflow-x-auto">
          <MenuBtn active={page === 'dashboard'} onClick={() => setPage('dashboard')}>Início</MenuBtn>
          <MenuBtn active={page === 'employees'} onClick={() => setPage('employees')}>Equipe</MenuBtn>
          <MenuBtn active={page === 'payroll'} onClick={() => setPage('payroll')}>Calcular</MenuBtn>
          <MenuBtn active={page === 'history'} onClick={() => setPage('history')}>Relatórios</MenuBtn>
          <MenuBtn active={page === 'docs'} onClick={() => setPage('docs')}>Documentos</MenuBtn>
        </div>

        <div className="flex items-center space-x-4">
            <button onClick={() => setPage('settings')} className={`flex items-center space-x-1 ${page === 'settings' ? 'text-white' : 'text-blue-200 hover:text-white'}`}>
                <span>⚙️</span><span className="hidden md:inline">Configurações</span>
            </button>
            <button onClick={() => signOut(auth)} className="text-red-400 hover:text-red-300 flex items-center">Sair 🚪</button>
        </div>
      </nav>

      <main className="p-4 md:p-8 print:p-0 flex-grow w-full max-w-7xl mx-auto print:max-w-none">
        {page === 'dashboard' && <Dashboard uid={user.uid} onNavigate={setPage} />}
        {page === 'employees' && <EmployeeManager uid={user.uid} companyProfile={companyProfile} />}
        {page === 'payroll' && <PayrollCalculator uid={user.uid} />}
        {page === 'history' && <PaymentHistory uid={user.uid} companyProfile={companyProfile} />}
        {page === 'docs' && <DocumentGenerator uid={user.uid} companyProfile={companyProfile} />}
        {page === 'settings' && <Settings uid={user.uid} currentProfile={companyProfile} onUpdate={setCompanyProfile} />}
      </main>
    </div>
  );
}

function MenuBtn({ children, active, onClick }) {
    return (
        <button onClick={onClick} className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-md text-sm font-semibold transition-all ${active ? 'bg-white text-[#303863] shadow' : 'text-blue-100 hover:bg-[#505a8a]'}`}>
            {children}
        </button>
    );
}

// --- MÓDULO DE CONFIGURAÇÕES ---
function Settings({ uid, currentProfile, onUpdate }) {
    const [profile, setProfile] = useState(currentProfile);

    const handleSave = async () => {
        try {
            await setDoc(doc(db, 'companies', uid, 'settings', 'profile'), profile);
            onUpdate(profile);
            alert("Configurações atualizadas com sucesso!");
        } catch (error) { alert("Erro ao salvar: " + error.message); }
    };

    return (
        <div className="w-full animation-fade-in max-w-3xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
                <span className="text-3xl bg-gray-200 text-gray-700 p-2 rounded-lg">⚙️</span>
                <div><h2 className="text-2xl md:text-3xl font-bold text-[#2a3052]">Configurações da Empresa</h2><p className="text-gray-500">Dados para holerites e recibos.</p></div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Nome da Empresa</label><input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Ex: Indústria XYZ Ltda" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">CNPJ</label><input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300" value={profile.cnpj} onChange={e => setProfile({...profile, cnpj: e.target.value})} placeholder="00.000.000/0000-00" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">URL da Logomarca (Opcional)</label><input className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300" value={profile.logo} onChange={e => setProfile({...profile, logo: e.target.value})} placeholder="Cole o link da imagem da sua logo" /><p className="text-xs text-gray-400 mt-1">Link de imagem (PNG/JPG) para aparecer nas impressões.</p></div>
                <div className="pt-4 border-t border-gray-100 flex justify-end"><button onClick={handleSave} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition w-full md:w-auto">Salvar Configurações</button></div>
            </div>
        </div>
    );
}

// --- DASHBOARD ---
function Dashboard({ uid, onNavigate }) { 
    const [employeeCount, setEmployeeCount] = useState(0);
    const [employees, setEmployees] = useState([]);
    const [showValeModal, setShowValeModal] = useState(false);
    const [vale, setVale] = useState({ employeeId: '', amount: '', date: '', reason: '' });

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'companies', uid, 'employees')), (snap) => {
            const emps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(emps); setEmployeeCount(emps.length);
        });
        return () => unsub();
    }, [uid]);

    const folhaEstimada = employees.reduce((total, emp) => {
        const valor = parseFloat(emp.rate) || 0;
        return total + (emp.type === 'Diarista' ? (valor * 22) : valor);
    }, 0);
    const metaDiaria = folhaEstimada > 0 ? (folhaEstimada / 30).toFixed(2) : "0.00";

    const handleLancarVale = async () => {
        if (!vale.employeeId || !vale.amount || !vale.date) return alert("Preencha funcionário, valor e data do desconto.");
        try {
            await addDoc(collection(db, 'companies', uid, 'vales'), { employeeId: vale.employeeId, amount: parseFloat(vale.amount), date: vale.date, reason: vale.reason, status: 'pendente' });
            alert("Vale lançado com sucesso!");
            setShowValeModal(false); setVale({ employeeId: '', amount: '', date: '', reason: '' });
        } catch (error) { alert("Erro ao lançar vale: " + error.message); }
    };

    return (
        <div className="w-full animation-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 space-y-4 md:space-y-0">
                <div><h2 className="text-2xl md:text-3xl font-bold text-[#2a3052]">Visão Geral</h2><p className="text-gray-500">Bem-vindo ao painel de controle da sua empresa.</p></div>
                <div className="text-left md:text-right"><p className="text-xs font-bold text-gray-400 uppercase">Data de Hoje</p><p className="text-lg font-medium text-gray-700">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div className="bg-[#3b82f6] rounded-xl p-6 text-white shadow-lg relative overflow-hidden"><p className="text-blue-100 font-medium mb-1">Funcionários Ativos</p><p className="text-4xl font-bold">{employeeCount}</p><span className="absolute right-4 bottom-4 text-5xl opacity-20">👥</span></div>
                <div className="bg-[#10b981] rounded-xl p-6 text-white shadow-lg relative overflow-hidden"><p className="text-green-100 font-medium mb-1">Folha Estimada (Mês)</p><p className="text-3xl lg:text-4xl font-bold">R$ {folhaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><span className="absolute right-4 bottom-4 text-5xl opacity-20">💰</span></div>
                <div className="bg-white border-l-4 border-yellow-400 rounded-xl p-6 text-gray-800 shadow-lg relative"><p className="text-gray-500 text-sm font-bold uppercase mb-1">🐖 Cofrinho Diário</p><p className="text-3xl font-bold text-[#2a3052]">R$ {metaDiaria.replace('.', ',')}</p><p className="text-xs text-gray-400 mt-2">Guarde este valor/dia no caixa.</p></div>
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-transform" onClick={() => setShowValeModal(true)}><p className="text-pink-100 font-medium mb-1">Ação Rápida</p><p className="text-3xl font-bold">Lançar Vale</p><span className="absolute right-4 bottom-4 text-5xl opacity-20">💸</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div onClick={() => onNavigate('employees')} className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer flex items-center justify-between border border-gray-100 hover:-translate-y-1 transition-transform"><div className="flex items-center space-x-4"><div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl">👨‍🔧</div><div><h3 className="font-bold text-[#2a3052] text-lg">Gerenciar Equipe</h3><p className="text-gray-500 text-sm">Adicionar, editar colaboradores.</p></div></div><span className="text-gray-300 text-2xl">➔</span></div>
                <div onClick={() => onNavigate('payroll')} className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer flex items-center justify-between border border-gray-100 hover:-translate-y-1 transition-transform"><div className="flex items-center space-x-4"><div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl">🧮</div><div><h3 className="font-bold text-[#2a3052] text-lg">Calcular Pagamentos</h3><p className="text-gray-500 text-sm">Fechar folha e recibos.</p></div></div><span className="text-gray-300 text-2xl">➔</span></div>
            </div>

            {showValeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center space-x-2"><span className="bg-orange-100 text-orange-600 p-2 rounded-md">💸</span><h2 className="text-xl font-bold text-[#2a3052]">Novo Vale</h2></div>
                        <div className="p-6 space-y-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Funcionário</label><select className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white" value={vale.employeeId} onChange={e => setVale({...vale, employeeId: e.target.value})}><option value="">Selecione...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label><input type="number" className="w-full border p-3 rounded-lg outline-none" value={vale.amount} onChange={e => setVale({...vale, amount: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Mês Ref.</label><input type="month" className="w-full border p-3 rounded-lg outline-none" value={vale.date} onChange={e => setVale({...vale, date: e.target.value})} /></div></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Motivo</label><input placeholder="Ex: Adiantamento" className="w-full border p-3 rounded-lg outline-none" value={vale.reason} onChange={e => setVale({...vale, reason: e.target.value})} /></div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3"><button onClick={() => setShowValeModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium bg-white">Cancelar</button><button onClick={handleLancarVale} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow">Salvar Lançamento</button></div>
                    </div>
                </div>
            )}
        </div>
    ); 
}

// --- EQUIPE ---
function EmployeeManager({ uid }) {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const initialState = { name: '', cpf: '', pix: '', role: '', type: 'Diarista', rate: '', admission: '' };
  const [empForm, setEmpForm] = useState(initialState);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'companies', uid, 'employees')), (snap) => setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [uid]);

  const handleSave = async () => {
      if (!empForm.name || !empForm.rate) return alert("Preencha Nome e Valor.");
      try {
          const dataToSave = { ...empForm, rate: parseFloat(empForm.rate) };
          if (editId) await updateDoc(doc(db, 'companies', uid, 'employees', editId), dataToSave);
          else await addDoc(collection(db, 'companies', uid, 'employees'), dataToSave);
          setShowModal(false); setEmpForm(initialState); setEditId(null);
      } catch (error) { alert("Erro: " + error.message); }
  };
  const handleDelete = async (id) => { if (window.confirm("Excluir funcionário?")) await deleteDoc(doc(db, 'companies', uid, 'employees', id)); };
  const getMonthsEmployed = (adm) => { if(!adm)return 0; const s=new Date(adm),n=new Date(); return (n.getFullYear()-s.getFullYear())*12+(n.getMonth()-s.getMonth()); };

  return (
    <div className="w-full animation-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3"><span className="text-3xl bg-blue-100 text-blue-600 p-2 rounded-lg">👥</span><h2 className="text-2xl md:text-3xl font-bold text-[#2a3052]">Equipe</h2></div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <button onClick={() => alert("Link 'rhfast.com.br/cad/3982' copiado!")} className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow text-sm w-full md:w-auto">🔗 Link Auto-Cadastro</button>
              <button onClick={() => { setEmpForm(initialState); setEditId(null); setShowModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg text-sm w-full md:w-auto">+ Novo Cadastro</button>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => {
              const meses = getMonthsEmployed(emp.admission);
              return (
              <div key={emp.id} className="bg-white rounded-xl shadow p-6 border-t-4 border-blue-500 relative flex flex-col justify-between hover:shadow-md transition">
                  <div>
                      {meses >= 11 && <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded animate-pulse">🚨 Férias ({meses} m)</div>}
                      <div className="text-xs font-bold text-blue-500 mb-2 uppercase">{emp.role || 'Sem cargo'}</div><h3 className="font-bold text-lg text-gray-800 mb-1">{emp.name}</h3><p className="text-xs text-gray-500 mb-4">{emp.type}</p>
                  </div>
                  <div className="flex justify-between items-end mt-6">
                      <div><p className="text-xs text-gray-400">Diária/Base</p><p className="text-xl font-bold text-[#2a3052]">R$ {emp.rate ? Number(emp.rate).toFixed(2).replace('.',',') : '0,00'}</p></div>
                      <div className="flex space-x-3"><button onClick={() => { setEmpForm(emp); setEditId(emp.id); setShowModal(true); }} className="text-xl hover:scale-110">✏️</button><button onClick={() => handleDelete(emp.id)} className="text-xl hover:scale-110 opacity-80">🗑️</button></div>
                  </div>
              </div>
          )})}
      </div>
      {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col my-8">
                  <div className="p-6 border-b flex justify-between items-center bg-[#f4f7fb]"><h2 className="text-xl font-bold text-[#2a3052]">{editId ? 'Editar' : 'Novo'}</h2><button onClick={()=>setShowModal(false)} className="text-gray-400 text-2xl">&times;</button></div>
                  <div className="p-6 space-y-6">
                      <div><h3 className="font-bold text-gray-700 mb-3 border-b pb-1">1. Dados Pessoais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input className="border p-3 rounded-lg outline-none" placeholder="Nome Completo" value={empForm.name} onChange={e=>setEmpForm({...empForm, name:e.target.value})} /><input className="border p-3 rounded-lg outline-none" placeholder="CPF" value={empForm.cpf} onChange={e=>setEmpForm({...empForm, cpf:e.target.value})} /><input className="border p-3 rounded-lg outline-none md:col-span-2" placeholder="Chave PIX" value={empForm.pix} onChange={e=>setEmpForm({...empForm, pix:e.target.value})} /></div></div>
                      <div><h3 className="font-bold text-gray-700 mb-3 border-b pb-1">2. Contrato</h3><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><input className="border p-3 rounded-lg outline-none md:col-span-2" placeholder="Cargo" value={empForm.role} onChange={e=>setEmpForm({...empForm, role:e.target.value})} /><select className="border p-3 rounded-lg outline-none bg-white" value={empForm.type} onChange={e=>setEmpForm({...empForm, type:e.target.value})}><option>Diarista</option><option>Mensalista</option></select><input type="number" className="border p-3 rounded-lg outline-none" placeholder="Valor R$" value={empForm.rate} onChange={e=>setEmpForm({...empForm, rate:e.target.value})} /><div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Data Admissão</label><input type="date" className="border p-3 rounded-lg outline-none w-full" value={empForm.admission} onChange={e=>setEmpForm({...empForm, admission:e.target.value})} /></div></div></div>
                  </div>
                  <div className="p-4 border-t bg-gray-50 flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3"><button onClick={()=>setShowModal(false)} className="px-6 py-3 md:py-2 bg-white border rounded-lg w-full md:w-auto">Cancelar</button><button onClick={handleSave} className="px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg font-bold w-full md:w-auto">Salvar</button></div>
              </div>
          </div>
      )}
    </div>
  );
}

// --- CÁLCULO ---
function PayrollCalculator({ uid }) {
  const [employees, setEmployees] = useState([]);
  const [vales, setVales] = useState([]);
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [inputs, setInputs] = useState({});

  useEffect(() => {
      const unsubEmp = onSnapshot(query(collection(db, 'companies', uid, 'employees')), (snap) => setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubVales = onSnapshot(query(collection(db, 'companies', uid, 'vales')), (snap) => setVales(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.status === 'pendente')));
      return () => { unsubEmp(); unsubVales(); };
  }, [uid]);

  const handleInput = (empId, field, val) => setInputs(prev => ({...prev, [empId]: {...(prev[empId]||{}), [field]: val}}));

  const calcNet = (emp) => {
      const i = inputs[emp.id] || {};
      const base = emp.type === 'Diarista' ? ((parseFloat(i.dias)||0) * parseFloat(emp.rate||0)) : parseFloat(emp.rate||0);
      const valesTot = vales.filter(v => v.employeeId === emp.id).reduce((a,c) => a + parseFloat(c.amount||0), 0);
      return base + (parseFloat(i.extra)||0) - (parseFloat(i.faltas)||0) - valesTot;
  };

  const closePayroll = async () => {
      if(!period.start || !period.end) return alert("Defina o período.");
      if(employees.length === 0) return alert("Nenhum funcionário.");
      try {
          const totalGeral = employees.reduce((a,e) => a + calcNet(e), 0);
          const folha = {
              periodStart: period.start, periodEnd: period.end, totalGeral, createdAt: new Date().toISOString(),
              details: employees.map(emp => {
                  const i = inputs[emp.id] || {};
                  const valesTot = vales.filter(v => v.employeeId === emp.id).reduce((a,c) => a + parseFloat(c.amount||0), 0);
                  return { employeeId: emp.id, name: emp.name, role: emp.role, pix: emp.pix, type: emp.type, rate: emp.rate, dias: i.dias||0, extra: i.extra||0, faltas: i.faltas||0, vales: valesTot, net: calcNet(emp) };
              })
          };
          await addDoc(collection(db, 'companies', uid, 'history'), folha);
          for (const v of vales) await updateDoc(doc(db, 'companies', uid, 'vales', v.id), { status: 'pago' });
          alert("Folha fechada! Verifique a aba Relatórios."); setInputs({}); 
      } catch(e) { alert("Erro: " + e.message); }
  };

  return (
      <div className="w-full animation-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3"><span className="text-3xl bg-green-100 text-green-600 p-2 rounded-lg">🧮</span><div><h2 className="text-2xl md:text-3xl font-bold text-[#2a3052]">Calcular Folha</h2><p className="text-gray-500">Defina o período e lance as variáveis.</p></div></div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-center bg-white p-2 rounded-lg border w-full md:w-auto">
                  <div className="px-2 text-sm font-bold text-gray-400">PERÍODO:</div>
                  <input type="date" className="outline-none text-gray-700 bg-gray-50 p-2 rounded w-full sm:w-auto" value={period.start} onChange={e => setPeriod({...period, start: e.target.value})} />
                  <span className="text-gray-400 hidden sm:inline">até</span>
                  <input type="date" className="outline-none text-gray-700 bg-gray-50 p-2 rounded w-full sm:w-auto" value={period.end} onChange={e => setPeriod({...period, end: e.target.value})} />
              </div>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                      <thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b"><th className="p-4">Colaborador</th><th className="p-4 text-center">Dias</th><th className="p-4 text-center">Bônus(R$)</th><th className="p-4 text-center">Faltas(R$)</th><th className="p-4 text-center">Vales</th><th className="p-4 text-right">Líquido Final</th></tr></thead>
                      <tbody className="text-sm">
                          {employees.map(emp => {
                              const vTot = vales.filter(v=>v.employeeId===emp.id).reduce((a,c)=>a+parseFloat(c.amount||0),0);
                              return (
                              <tr key={emp.id} className="border-b hover:bg-gray-50">
                                  <td className="p-4"><p className="font-bold text-gray-800">{emp.name}</p><p className="text-xs text-gray-400">{emp.role} • R$ {emp.rate}</p></td>
                                  <td className="p-4 text-center"><input type="number" placeholder={emp.type==='Mensalista'?"Mês Cheio":"Dias"} disabled={emp.type==='Mensalista'} className="w-16 md:w-20 border p-2 rounded text-center outline-none" value={inputs[emp.id]?.dias||''} onChange={e=>handleInput(emp.id,'dias',e.target.value)} /></td>
                                  <td className="p-4 text-center"><input type="number" placeholder="0.00" className="w-20 md:w-24 border p-2 rounded text-center text-green-600 bg-green-50 outline-none" value={inputs[emp.id]?.extra||''} onChange={e=>handleInput(emp.id,'extra',e.target.value)} /></td>
                                  <td className="p-4 text-center"><input type="number" placeholder="0.00" className="w-20 md:w-24 border p-2 rounded text-center text-red-600 bg-red-50 outline-none" value={inputs[emp.id]?.faltas||''} onChange={e=>handleInput(emp.id,'faltas',e.target.value)} /></td>
                                  <td className="p-4 text-center"><input type="text" value={vTot.toFixed(2)} className="w-20 md:w-24 border p-2 rounded text-center text-red-600 bg-gray-100 outline-none" readOnly /></td>
                                  <td className="p-4 text-right"><p className="font-black text-lg text-[#2a3052]">R$ {calcNet(emp).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></td>
                              </tr>
                          )})}
                      </tbody>
                  </table>
              </div>
              <div className="p-4 md:p-6 bg-gray-50 flex flex-col md:flex-row justify-between items-center border-t space-y-4 md:space-y-0">
                  <div className="text-center md:text-left"><p className="text-sm text-gray-500">Total desta folha:</p><p className="text-2xl font-black text-[#2a3052]">R$ {employees.reduce((a,e)=>a+calcNet(e),0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></div>
                  <button onClick={closePayroll} className="w-full md:w-auto bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow hover:bg-green-700">✓ Fechar Folha</button>
              </div>
          </div>
      </div>
  );
}

// --- HISTÓRICO, RELATÓRIOS E HOLERITES ---
function PaymentHistory({ uid, companyProfile }) {
    const [history, setHistory] = useState([]);
    const [selectedFolha, setSelectedFolha] = useState(null);
    const [viewMode, setViewMode] = useState('list'); 

    useEffect(() => {
        const q = query(collection(db, 'companies', uid, 'history'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [uid]);

    const handleCopyPix = (folha) => {
        let text = `*Pagamentos Folha (${formatDate(folha.periodStart)} a ${formatDate(folha.periodEnd)})*\n\n`;
        folha.details.forEach(d => { if(d.net > 0) text += `${d.name} \nPIX: ${d.pix || 'Não Cadastrado'} \nVALOR: R$ ${d.net.toFixed(2).replace('.',',')}\n---\n`; });
        navigator.clipboard.writeText(text); alert("Lista de PIX copiada!");
    };

    const formatDate = (dateStr) => { if(!dateStr) return ''; const [y,m,d] = dateStr.split('-'); return `${d}/${m}/${y}`; };
    const openReport = (folha) => { setSelectedFolha(folha); setViewMode('report'); };

    if (viewMode === 'report' && selectedFolha) {
        return (
            <div className="w-full animation-fade-in print:m-0 print:p-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden space-y-4 md:space-y-0">
                    <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-blue-600 font-bold flex items-center">← Voltar para Histórico</button>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                        <button onClick={() => window.print()} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-50">🖨️ Imprimir</button>
                        <button onClick={() => setViewMode('holerites')} className="w-full sm:w-auto bg-[#4a55e8] text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700">Ver Holerites ➔</button>
                    </div>
                </div>
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 print:shadow-none print:border-none">
                    <div className="bg-[#1e233b] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center print:bg-white print:text-black print:border-b-2 print:border-black space-y-4 md:space-y-0">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-1">{companyProfile.name}</h2>
                            <p className="text-gray-400 text-sm print:text-black">Relatório Gerencial de Pagamentos {companyProfile.cnpj ? ` - CNPJ: ${companyProfile.cnpj}` : ''}</p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 print:text-black">Período</p>
                            <p className="text-lg md:text-xl font-bold">{formatDate(selectedFolha.periodStart)} - {formatDate(selectedFolha.periodEnd)}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm min-w-max">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                                    <th className="p-4 font-bold">Colaborador</th><th className="p-4 text-center font-bold">Dias</th><th className="p-4 font-bold">Base</th><th className="p-4 font-bold">Bruto</th><th className="p-4 text-red-500 font-bold">Desc.</th><th className="p-4 text-blue-500 font-bold">Extra</th><th className="p-4 font-bold">Líquido</th><th className="p-4 font-bold">PIX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedFolha.details.map((emp, idx) => {
                                    const bruto = emp.type === 'Diarista' ? (emp.dias * emp.rate) : emp.rate;
                                    const descontos = parseFloat(emp.faltas || 0) + parseFloat(emp.vales || 0);
                                    return (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="p-4"><p className="font-bold text-gray-800">{emp.name}</p><p className="text-xs text-gray-400 uppercase">{emp.role || 'Geral'}</p></td>
                                            <td className="p-4 text-center"><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{emp.type === 'Diarista' ? 'D' : 'M'}</span></td>
                                            <td className="p-4 text-gray-600">R$ {parseFloat(emp.rate).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                                            <td className="p-4 font-bold text-gray-800">R$ {parseFloat(bruto).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                                            <td className="p-4 text-red-500 font-bold">{descontos > 0 ? `(R$ ${parseFloat(descontos).toLocaleString('pt-BR', {minimumFractionDigits:2})})` : '-'}</td>
                                            <td className="p-4 text-blue-500 font-bold">{emp.extra > 0 ? `R$ ${parseFloat(emp.extra).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : 'R$ 0,00'}</td>
                                            <td className="p-4 font-black text-gray-900 text-lg">R$ {parseFloat(emp.net).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                                            <td className="p-4 text-gray-600 text-xs">{emp.pix || 'Não Cadastrado'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-[#2a3052] text-white p-6 flex justify-end items-center space-x-6 print:bg-white print:text-black print:border-t-2 print:border-black">
                        <p className="font-bold uppercase tracking-wider text-sm text-gray-300 print:text-black">Total da Folha:</p>
                        <p className="text-2xl md:text-3xl font-black">R$ {selectedFolha.totalGeral.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'holerites' && selectedFolha) {
        return (
            <div className="w-full animation-fade-in print:m-0 print:p-0">
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <button onClick={() => setViewMode('report')} className="text-gray-500 hover:text-blue-600 font-bold">← Voltar para Relatório</button>
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">🖨️ Imprimir Holerites</button>
                </div>
                <div className="print:block">
                    {selectedFolha.details.map((emp, idx) => (
                        <div key={idx} className="bg-white border-2 border-gray-300 p-6 md:p-8 mb-8 shadow-sm rounded break-inside-avoid print:shadow-none print:border-gray-800 print:mb-12 print:page-break-after-always">
                            <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-800 pb-4 mb-4 space-y-4 md:space-y-0">
                                <div className="flex items-center space-x-4">
                                    {companyProfile.logo && <img src={companyProfile.logo} alt="Logo" className="h-12 w-12 object-contain" />}
                                    <div><h2 className="text-lg md:text-xl font-black uppercase text-gray-900">{companyProfile.name}</h2><p className="text-xs text-gray-500">Recibo de Pagamento de Salário</p></div>
                                </div>
                                <div className="text-left md:text-right"><p className="font-bold">Período Referência</p><p className="text-sm">{formatDate(selectedFolha.periodStart)} a {formatDate(selectedFolha.periodEnd)}</p></div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between border border-gray-300 p-3 mb-4 bg-gray-50 space-y-2 md:space-y-0">
                                <div><p className="text-xs font-bold text-gray-500 uppercase">Funcionário</p><p className="font-bold text-gray-900">{emp.name}</p></div>
                                <div><p className="text-xs font-bold text-gray-500 uppercase">Cargo</p><p className="font-bold text-gray-900">{emp.role || 'Geral'}</p></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 mb-6 text-sm min-w-max">
                                    <thead><tr className="bg-gray-100"><th className="border border-gray-300 p-2 text-left">Descrição</th><th className="border border-gray-300 p-2 text-center w-16 md:w-24">Qtd.</th><th className="border border-gray-300 p-2 text-right w-24 md:w-32 text-green-700">Vencimentos</th><th className="border border-gray-300 p-2 text-right w-24 md:w-32 text-red-700">Descontos</th></tr></thead>
                                    <tbody>
                                        <tr><td className="border border-gray-300 p-2">Salário Base / Diárias</td><td className="border border-gray-300 p-2 text-center">{emp.type === 'Diarista' ? `${emp.dias} d` : '1 m'}</td><td className="border border-gray-300 p-2 text-right text-green-700">{(emp.type === 'Diarista' ? emp.dias * emp.rate : parseFloat(emp.rate)).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td><td className="border border-gray-300 p-2 text-right"></td></tr>
                                        {emp.extra > 0 && (<tr><td className="border border-gray-300 p-2">Horas Extras / Bônus</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-right text-green-700">{parseFloat(emp.extra).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td><td className="border border-gray-300 p-2 text-right"></td></tr>)}
                                        {emp.faltas > 0 && (<tr><td className="border border-gray-300 p-2">Faltas / Atrasos</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-right"></td><td className="border border-gray-300 p-2 text-right text-red-700">{parseFloat(emp.faltas).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td></tr>)}
                                        {emp.vales > 0 && (<tr><td className="border border-gray-300 p-2">Adiantamentos (Vales)</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-right"></td><td className="border border-gray-300 p-2 text-right text-red-700">{parseFloat(emp.vales).toLocaleString('pt-BR', {minimumFractionDigits:2})}</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
                                <div><p className="text-sm text-gray-500">Chave PIX: {emp.pix || 'Não cadastrada'}</p></div>
                                <div className="border-2 border-gray-800 p-4 rounded text-center w-full md:w-auto"><p className="text-sm font-bold uppercase text-gray-600">Total Líquido</p><p className="text-2xl md:text-3xl font-black">R$ {emp.net.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                            </div>
                            <div className="mt-8 md:mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
                                <p className="mb-8">Declaro ter recebido a importância líquida discriminada neste recibo.</p>
                                <div className="flex flex-col md:flex-row justify-around space-y-8 md:space-y-0"><div className="w-full md:w-1/3 border-t border-black pt-1">Data</div><div className="w-full md:w-1/2 border-t border-black pt-1">Assinatura de {emp.name}</div></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full animation-fade-in">
            <div className="flex items-center space-x-3 mb-8"><span className="text-3xl bg-purple-100 text-purple-600 p-2 rounded-lg">📊</span><h2 className="text-2xl md:text-3xl font-bold text-[#2a3052]">Histórico e Relatórios</h2></div>
            <div className="space-y-4">
                {history.map(folha => (
                    <div key={folha.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4"><div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl shrink-0">✓</div><div><h3 className="font-bold text-lg text-gray-800">Folha Fechada</h3><p className="text-sm text-gray-500">Ref: {formatDate(folha.periodStart)} a {formatDate(folha.periodEnd)} • {folha.details?.length || 0} func.</p></div></div>
                        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 w-full md:w-auto">
                            <div className="text-left md:text-right w-full md:w-auto"><p className="text-xs text-gray-400 font-bold">TOTAL PAGO</p><p className="text-xl font-black text-[#2a3052]">R$ {folha.totalGeral.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                            <div className="flex space-x-2 w-full md:w-auto justify-end">
                                <button onClick={() => handleCopyPix(folha)} className="bg-indigo-50 text-indigo-700 px-3 md:px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 text-sm whitespace-nowrap">📋 Copiar PIX</button>
                                <button onClick={() => openReport(folha)} className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm shadow whitespace-nowrap">Ver Relatório</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DocumentGenerator({ uid, companyProfile }) {
    const [employees, setEmployees] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState('');
    const [docType, setDocType] = useState('advertencia');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => { const unsub = onSnapshot(query(collection(db, 'companies', uid, 'employees')), (snap) => setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); }, [uid]);

    if (showPreview) {
        const emp = employees.find(e => e.id === selectedEmpId) || {};
        const hoje = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
        return (
            <div className="w-full animation-fade-in print:m-0 print:p-0">
                <div className="mb-6 print:hidden flex justify-between"><button onClick={() => setShowPreview(false)} className="text-blue-600 font-bold">← Voltar</button><button onClick={() => window.print()} className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow">🖨️ Imprimir PDF</button></div>
                <div className="bg-white p-6 md:p-12 border shadow max-w-4xl mx-auto print:shadow-none print:border-none text-justify text-base md:text-lg leading-relaxed">
                    <div className="text-center mb-8 md:mb-12 border-b-2 border-black pb-6"><h1 className="text-xl md:text-2xl font-black uppercase">{companyProfile.name}</h1><p className="text-gray-600 text-sm md:text-base">Documento Oficial de Recursos Humanos {companyProfile.cnpj ? ` - CNPJ: ${companyProfile.cnpj}` : ''}</p></div>
                    {docType === 'advertencia' && (<div><h2 className="text-lg md:text-xl font-bold text-center mb-8 uppercase">Advertência Disciplinar Escrita</h2><p className="mb-4">Ao Sr(a). <strong>{emp.name}</strong>, portador(a) do CPF nº <strong>{emp.cpf || '___________'}</strong>, exercendo a função de <strong>{emp.role || '___________'}</strong>.</p><p className="mb-8">Pelo presente termo, vimos aplicar-lhe a penalidade de ADVERTÊNCIA DISCIPLINAR, em razão de atos que infringem as normas internas da empresa, prejudicando o bom andamento dos serviços.</p><p className="mb-8">Ressaltamos que a reincidência poderá acarretar sanções mais severas, incluindo a rescisão do contrato de trabalho por justa causa.</p></div>)}
                    {docType === 'rescisao' && (<div><h2 className="text-lg md:text-xl font-bold text-center mb-8 uppercase">Termo de Quitação de Contrato</h2><p className="mb-4">Declaramos para os devidos fins que o Sr(a). <strong>{emp.name}</strong>, CPF nº <strong>{emp.cpf || '___________'}</strong>, teve seu contrato de trabalho (Função: <strong>{emp.role || '___________'}</strong>) rescindido na presente data.</p><p className="mb-8">O presente termo serve como comprovante de quitação integral de todas as verbas rescisórias, diárias e direitos pendentes até o último dia trabalhado.</p></div>)}
                    {docType === 'epi' && (<div><h2 className="text-lg md:text-xl font-bold text-center mb-8 uppercase">Recibo de Entrega de EPI / Uniforme</h2><p className="mb-4">Eu, <strong>{emp.name}</strong>, CPF nº <strong>{emp.cpf || '___________'}</strong>, declaro ter recebido da empresa <strong>{companyProfile.name}</strong>, de forma gratuita, os Equipamentos de Proteção Individual (EPI) e/ou uniformes para uso exclusivo na execução das minhas atividades.</p><div className="w-full h-32 border border-dashed border-gray-400 mb-8 p-4 text-gray-400">(Escreva aqui à caneta a descrição dos itens entregues)</div></div>)}
                    <div className="mt-16 md:mt-20 text-center"><p className="mb-8 md:mb-12">Data: ___/___/20___</p><div className="flex flex-col md:flex-row justify-around mt-8 md:mt-16 space-y-8 md:space-y-0"><div className="w-full md:w-1/3 border-t border-black pt-2 font-bold">{companyProfile.name}</div><div className="w-full md:w-1/2 border-t border-black pt-2 font-bold">Assinatura: {emp.name}</div></div></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full animation-fade-in max-w-4xl mx-auto print:hidden">
             <div className="flex items-center space-x-3 mb-8"><span className="text-3xl bg-orange-100 text-orange-600 p-2 rounded-lg">📄</span><div><h2 className="text-2xl md:text-3xl font-bold text-[#2a3052]">Gerador de Documentos</h2></div></div>
              <div className="bg-white p-6 md:p-8 rounded-xl shadow border border-gray-100">
                  <div className="mb-6"><label className="block text-sm font-bold text-gray-700 mb-2">1. Selecione o Funcionário</label><select className="w-full border p-3 rounded-lg bg-white outline-none" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}><option value="">Selecione...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}</select></div>
                  <div className="mb-8"><label className="block text-sm font-bold text-gray-700 mb-2">2. Tipo de Documento</label><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div onClick={() => setDocType('advertencia')} className={`border p-4 rounded-xl cursor-pointer transition-all ${docType === 'advertencia' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'hover:bg-gray-50'}`}><span className="text-xl block mb-2">🛡️</span><h4 className="font-bold text-gray-900">Advertência</h4></div>
                          <div onClick={() => setDocType('rescisao')} className={`border p-4 rounded-xl cursor-pointer transition-all ${docType === 'rescisao' ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'hover:bg-gray-50'}`}><span className="text-xl block mb-2">⚠️</span><h4 className="font-bold text-gray-900">Rescisão</h4></div>
                          <div onClick={() => setDocType('epi')} className={`border p-4 rounded-xl cursor-pointer transition-all ${docType === 'epi' ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'hover:bg-gray-50'}`}><span className="text-xl block mb-2">🦺</span><h4 className="font-bold text-gray-900">Recibo EPI</h4></div>
                  </div></div>
                  <button onClick={() => selectedEmpId ? setShowPreview(true) : alert('Selecione um funcionário')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow hover:bg-blue-700 transition">Gerar Documento</button>
              </div>
        </div>
    );
}

// --- LANDING PAGE SaaS (NOVA & INSPIRADA) ---
function LandingPage({ onGoLogin }) {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      
      {/* Estilo para animações suaves exclusivas da Landing Page */}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
      `}} />

      {/* Navbar Landing */}
      <nav className="flex justify-between items-center p-6 lg:px-20 bg-white sticky top-0 z-50 shadow-sm">
          <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded bg-[#303863] flex items-center justify-center text-white font-black text-xl shadow">RH</div>
              <h1 className="text-2xl font-black text-[#303863] tracking-tight">Fast</h1>
          </div>
          <button onClick={onGoLogin} className="bg-[#ffb000] text-[#303863] px-8 py-2.5 rounded-full font-black hover:bg-[#e69f00] transition shadow-md">Acessar</button>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-gradient-to-b from-[#f4f7fb] to-white">
          <h2 className="text-4xl md:text-6xl font-black text-[#2a3052] mb-6 tracking-tight max-w-4xl leading-tight">
              A gestão de RH que <span className="text-blue-600">multiplica o tempo</span> da sua empresa.
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-10">
              Esqueça planilhas confusas e processos manuais. Calcule folhas de diaristas e mensalistas, gere holerites em lote e organize seu DP em um só sistema moderno e inteligente.
          </p>
          <button onClick={onGoLogin} className="bg-[#ffb000] text-[#303863] px-12 py-4 rounded-full text-lg md:text-xl font-black shadow-xl hover:bg-[#e69f00] hover:scale-105 transition-all duration-300">
              Testar Grátis Agora
          </button>
      </div>

      {/* DORES DO MERCADO (Inspirado no roxo) */}
      <div className="bg-[#48286a] py-20 px-6 lg:px-20 text-center">
          <h3 className="text-3xl md:text-4xl font-black text-[#ffb000] mb-4">Desafios do Mercado: problemas que afetam seu caixa</h3>
          <p className="text-white text-lg mb-12 max-w-3xl mx-auto">Muitas empresas perdem dinheiro por não usar um sistema de RH organizado. Veja os principais riscos:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl p-8 hover-lift text-center">
                  <div className="text-red-500 text-5xl mb-4">🗑️</div>
                  <h4 className="text-xl font-bold text-[#48286a] mb-4">Tempo Desperdiçado</h4>
                  <p className="text-gray-600">"Empresas gastam até 20 horas por mês somando diárias, calculando extras e anotando vales em cadernos."</p>
              </div>
              <div className="bg-white rounded-2xl p-8 hover-lift text-center">
                  <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
                  <h4 className="text-xl font-bold text-[#48286a] mb-4">Riscos Trabalhistas</h4>
                  <p className="text-gray-600">"A falta de comprovantes de pagamento e o esquecimento de férias vencidas geram processos caríssimos."</p>
              </div>
              <div className="bg-white rounded-2xl p-8 hover-lift text-center">
                  <div className="text-blue-500 text-5xl mb-4">💸</div>
                  <h4 className="text-xl font-bold text-[#48286a] mb-4">Desorganização Financeira</h4>
                  <p className="text-gray-600">"Pagar funcionários um a um no app do banco gera erros, pagamentos duplicados e dor de cabeça."</p>
              </div>
          </div>
          
          <div className="mt-12 text-white">
              <p className="text-lg mb-6">Está na hora de automatizar sua rotina com um software moderno.</p>
              <button onClick={onGoLogin} className="bg-[#ffb000] text-[#48286a] px-10 py-3 rounded-full font-black hover:bg-[#e69f00] transition shadow-lg">Resolver isso agora</button>
          </div>
      </div>

      {/* FUNCIONALIDADES (Grid clean) */}
      <div className="py-24 px-6 lg:px-20 bg-[#f8fafc]">
          <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-black text-[#2a3052]">Gestão completa em um só sistema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                  <span className="text-3xl text-pink-500 mb-4 block">✉️</span>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Holerites Automáticos</h4>
                  <p className="text-sm text-gray-500">Geração de recibos prontos para impressão ou assinatura digital (PDF).</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                  <span className="text-3xl text-blue-500 mb-4 block">💲</span>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Pagamentos PIX</h4>
                  <p className="text-sm text-gray-500">Lista gerada automaticamente para copiar e pagar todos em lote no banco.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                  <span className="text-3xl text-green-500 mb-4 block">🧮</span>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Cálculo Dinâmico</h4>
                  <p className="text-sm text-gray-500">Controle de Mensalistas e Diaristas com cálculo de extras e faltas num clique.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                  <span className="text-3xl text-purple-500 mb-4 block">🚨</span>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Radar de Férias</h4>
                  <p className="text-sm text-gray-500">Aviso automático na tela quando o funcionário estiver perto de vencer as férias.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                  <span className="text-3xl text-orange-500 mb-4 block">🏦</span>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Cofre de Vales</h4>
                  <p className="text-sm text-gray-500">Lance vales no dia a dia. O sistema debita sozinho na hora de fechar a folha.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover-lift">
                  <span className="text-3xl text-red-500 mb-4 block">📄</span>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Documentos Oficiais</h4>
                  <p className="text-sm text-gray-500">Gere Termos de Rescisão, Recibos de EPI e Advertências já com os dados da empresa.</p>
              </div>

          </div>
      </div>

      {/* DEPOIMENTOS (Quem usa aprova) */}
      <div className="py-24 px-6 lg:px-20 bg-white">
          <div className="text-center mb-16 max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-black text-[#2a3052] mb-4">Quem usa, <span className="text-blue-600">recomenda</span></h3>
              <p className="text-gray-500 text-lg">Veja o que empresários do setor de calçados e e-commerce dizem sobre a nossa plataforma.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-[#f8fafc] p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                  <div className="text-yellow-400 text-xl mb-4">★★★★★</div>
                  <p className="text-gray-600 italic mb-6">"Aqui na fábrica a gente perdia horas somando diárias de montador e revisor. Com o RH Fast, fecho a folha da semana em 5 minutos e imprimo todos os recibos de uma vez. Me salvou demais."</p>
                  <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700">M</div>
                      <div>
                          <p className="font-bold text-gray-900 text-sm">Marcos Silva</p>
                          <p className="text-xs text-gray-500">Dono de Fábrica, Franca-SP</p>
                      </div>
                  </div>
              </div>

              <div className="bg-[#f8fafc] p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                  <div className="text-yellow-400 text-xl mb-4">★★★★★</div>
                  <p className="text-gray-600 italic mb-6">"Uso pro meu E-commerce. O Gerador de PIX em Lote e a facilidade de lançar vales durante a semana me deram um controle que eu nunca tive. Muito organizado e fácil de usar pelo celular."</p>
                  <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center font-bold text-pink-700">A</div>
                      <div>
                          <p className="font-bold text-gray-900 text-sm">Aline Costa</p>
                          <p className="text-xs text-gray-500">Gerente de E-commerce</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* PLANOS */}
      <div className="bg-[#f8fafc] py-24 px-6 lg:px-20 border-t border-gray-100">
          <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-black text-[#2a3052]">Planos simples para o seu tamanho</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col hover-lift">
                  <h4 className="text-xl font-bold text-gray-800">Starter</h4>
                  <p className="text-gray-500 text-sm mb-6">Para quem está começando</p>
                  <p className="text-4xl font-black text-[#2a3052] mb-6">Grátis</p>
                  <ul className="space-y-3 mb-8 flex-grow text-sm text-gray-600">
                      <li className="flex items-center">✅ <span className="ml-2">Até 4 Funcionários</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Cálculo de Folha</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Holerites em PDF</span></li>
                  </ul>
                  <button onClick={onGoLogin} className="w-full bg-blue-50 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-100 transition">Testar Grátis</button>
              </div>

              <div className="bg-white border-2 border-[#ffb000] rounded-2xl p-8 flex flex-col relative shadow-xl md:-translate-y-4">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#ffb000] text-[#303863] px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow">Mais Popular</div>
                  <h4 className="text-xl font-bold text-gray-800">Essencial</h4>
                  <p className="text-gray-500 text-sm mb-6">Para PMEs estruturadas</p>
                  <p className="text-4xl font-black text-[#2a3052] mb-6">R$ 49<span className="text-lg">,90/mês</span></p>
                  <ul className="space-y-3 mb-8 flex-grow text-sm text-gray-600">
                      <li className="flex items-center">✅ <span className="ml-2 font-bold">Até 15 Funcionários</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Tudo do plano Starter</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Copiar PIX em Lote</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Alerta de Férias</span></li>
                  </ul>
                  <button onClick={onGoLogin} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md transition">Assinar Essencial</button>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col hover-lift">
                  <h4 className="text-xl font-bold text-gray-800">Master</h4>
                  <p className="text-gray-500 text-sm mb-6">Fábricas e Indústrias</p>
                  <p className="text-4xl font-black text-[#2a3052] mb-6">R$ 99<span className="text-lg">,90/mês</span></p>
                  <ul className="space-y-3 mb-8 flex-grow text-sm text-gray-600">
                      <li className="flex items-center">✅ <span className="ml-2 font-bold">Funcionários Ilimitados</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Tudo do plano Essencial</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Gerador de Documentos</span></li>
                      <li className="flex items-center">✅ <span className="ml-2">Controle de Vales</span></li>
                  </ul>
                  <button onClick={onGoLogin} className="w-full bg-blue-50 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-100 transition">Assinar Master</button>
              </div>

          </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1e233b] text-center py-10 px-6 text-gray-400 text-sm mt-auto">
          <div className="max-w-4xl mx-auto">
              <p className="font-bold text-white mb-2 text-lg">DRG IMPORTS SAAS LTDA.</p>
              <p className="mb-4">Desenvolvendo soluções inteligentes para empresas modernas.</p>
              <p>© {new Date().getFullYear()} - Todos os direitos reservados. CNPJ: XX.XXX.XXX/XXXX-XX</p>
              <p className="mt-2 text-xs">Franca, São Paulo • Brasil</p>
          </div>
      </footer>
    </div>
  );
}

function AuthScreen({ onBack }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const handleAuth = async () => {
    try { isLogin ? await signInWithEmailAndPassword(auth, email, pass) : await createUserWithEmailAndPassword(auth, email, pass); } 
    catch (e) { alert("Erro: " + e.message); }
  };
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f4f7fb]">
      <div className="w-full md:w-1/2 bg-[#303863] text-white p-8 md:p-16 flex flex-col justify-center items-start relative overflow-hidden">
          <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 rounded bg-white text-[#303863] flex items-center justify-center font-black text-2xl">RH</div>
                  <h1 className="text-4xl font-bold">Gestão Inteligente</h1>
              </div>
              <p className="text-xl mb-6 text-blue-100">Feche a folha de pagamento em minutos, automatize vales e evite processos trabalhistas.</p>
          </div>
      </div>
      <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md bg-white">
          <h2 className="text-3xl font-black mb-2 text-[#2a3052]">{isLogin ? 'Acessar Conta' : 'Criar Conta Grátis'}</h2>
          <div className="space-y-5 mt-8">
              <input className="w-full p-4 border border-gray-300 rounded-xl outline-none" placeholder="E-mail corporativo" onChange={e => setEmail(e.target.value)} />
              <input className="w-full p-4 border border-gray-300 rounded-xl outline-none" type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} />
          </div>
          <button onClick={handleAuth} className="w-full bg-[#ffb000] text-[#303863] py-4 mt-8 rounded-xl font-black text-lg hover:bg-[#e69f00] shadow">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Fazer Login'}</button>
              <br/><button onClick={onBack} className="text-sm text-gray-400 mt-4 font-bold">← Voltar para o Início</button>
          </div>
        </div>
      </div>
    </div>
  );
}