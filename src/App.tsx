// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
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

  useEffect(() => {
    onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      if(u) setPage('dashboard'); 
    });
  }, []);

  if (!user) {
    return page === 'landing' ? <LandingPage onGoLogin={() => setPage('login')} /> : <AuthScreen onBack={() => setPage('landing')} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans w-full">
      <nav className="bg-[#303863] text-white flex justify-between items-center shadow-md w-full px-8 py-3">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('dashboard')}>
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                <span className="text-[#303863] font-black text-xl leading-none">RH</span>
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">Sistema de Gestão</h1>
                <p className="text-xs text-blue-300">Empresa Conectada</p>
            </div>
        </div>
        
        <div className="flex space-x-2 bg-[#424b7a] rounded-lg p-1">
          <MenuBtn active={page === 'dashboard'} onClick={() => setPage('dashboard')}>Início</MenuBtn>
          <MenuBtn active={page === 'employees'} onClick={() => setPage('employees')}>Equipe</MenuBtn>
          <MenuBtn active={page === 'payroll'} onClick={() => setPage('payroll')}>Calcular</MenuBtn>
          <MenuBtn active={page === 'history'} onClick={() => setPage('history')}>Histórico</MenuBtn>
          <MenuBtn active={page === 'docs'} onClick={() => setPage('docs')}>Documentos</MenuBtn>
        </div>

        <div className="flex items-center space-x-4">
            <button className="hover:text-blue-200">⚙️ Configurações</button>
            <button onClick={() => signOut(auth)} className="text-red-400 hover:text-red-300 flex items-center">Sair 🚪</button>
        </div>
      </nav>

      <main className="p-8 flex-grow w-full max-w-7xl mx-auto">
        {page === 'dashboard' && <Dashboard uid={user.uid} onNavigate={setPage} />}
        {page === 'employees' && <EmployeeManager uid={user.uid} />}
        {page === 'payroll' && <PayrollCalculator uid={user.uid} />}
        {page === 'history' && <PaymentHistory uid={user.uid} />}
        {page === 'docs' && <DocumentGenerator uid={user.uid} />}
      </main>
    </div>
  );
}

function MenuBtn({ children, active, onClick }) {
    return (
        <button 
            onClick={onClick} 
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${active ? 'bg-white text-[#303863] shadow' : 'text-blue-100 hover:bg-[#505a8a]'}`}
        >
            {children}
        </button>
    );
}

// --- TELAS DO PAINEL INTERNO ---

function Dashboard({ uid, onNavigate }) { 
    const [employeeCount, setEmployeeCount] = useState(0);
    const [employees, setEmployees] = useState([]);
    const [showValeModal, setShowValeModal] = useState(false);
    
    const [vale, setVale] = useState({ employeeId: '', amount: '', date: '', reason: '' });

    useEffect(() => {
        const q = query(collection(db, 'companies', uid, 'employees'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(emps);
            setEmployeeCount(emps.length);
        });
        return () => unsubscribe();
    }, [uid]);

    const folhaEstimada = employees.reduce((total, emp) => {
        const valor = parseFloat(emp.rate) || 0;
        const estimativaMensal = emp.type === 'Diarista' ? (valor * 22) : valor;
        return total + estimativaMensal;
    }, 0);

    const metaDiaria = folhaEstimada > 0 ? (folhaEstimada / 30).toFixed(2) : "0.00";

    const handleLancarVale = async () => {
        if (!vale.employeeId || !vale.amount || !vale.date) {
            return alert("Preencha funcionário, valor e data do desconto.");
        }
        try {
            await addDoc(collection(db, 'companies', uid, 'vales'), {
                employeeId: vale.employeeId,
                amount: parseFloat(vale.amount),
                date: vale.date,
                reason: vale.reason,
                status: 'pendente'
            });
            alert("Vale lançado com sucesso! Será descontado na próxima folha.");
            setShowValeModal(false);
            setVale({ employeeId: '', amount: '', date: '', reason: '' });
        } catch (error) {
            alert("Erro ao lançar vale: " + error.message);
        }
    };

    return (
        <div className="w-full animation-fade-in relative">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#2a3052]">Visão Geral</h2>
                    <p className="text-gray-500">Bem-vindo ao painel de controle da sua empresa.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data de Hoje</p>
                    <p className="text-lg font-medium text-gray-700">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#3b82f6] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <p className="text-blue-100 font-medium mb-1">Funcionários Ativos</p>
                    <p className="text-4xl font-bold">{employeeCount}</p>
                    <span className="absolute right-4 bottom-4 text-5xl opacity-20">👥</span>
                </div>
                
                <div className="bg-[#10b981] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <p className="text-green-100 font-medium mb-1">Folha Estimada (Mês)</p>
                    <p className="text-4xl font-bold">R$ {folhaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <span className="absolute right-4 bottom-4 text-5xl opacity-20">💰</span>
                </div>

                <div className="bg-white border-l-4 border-yellow-400 rounded-xl p-6 text-gray-800 shadow-lg relative">
                    <p className="text-gray-500 text-sm font-bold uppercase mb-1 flex items-center">🐖 Cofrinho Diário (Meta)</p>
                    <p className="text-3xl font-bold text-[#2a3052]">R$ {metaDiaria.replace('.', ',')}</p>
                    <p className="text-xs text-gray-400 mt-2 leading-tight">Guarde este valor por dia no caixa para pagar a folha sem sustos.</p>
                </div>

                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setShowValeModal(true)}>
                    <p className="text-pink-100 font-medium mb-1">Ação Rápida</p>
                    <p className="text-3xl font-bold">Lançar Vale</p>
                    <span className="absolute right-4 bottom-4 text-5xl opacity-20">💸</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => onNavigate('employees')} className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer flex items-center justify-between border border-gray-100 transition-all">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl">👨‍🔧</div>
                        <div>
                            <h3 className="font-bold text-[#2a3052] text-lg">Gerenciar Equipe</h3>
                            <p className="text-gray-500 text-sm">Adicionar, editar ou remover colaboradores.</p>
                        </div>
                    </div>
                    <span className="text-gray-300 text-2xl">➔</span>
                </div>

                <div onClick={() => onNavigate('payroll')} className="bg-white p-6 rounded-xl shadow hover:shadow-md cursor-pointer flex items-center justify-between border border-gray-100 transition-all">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl">🧮</div>
                        <div>
                            <h3 className="font-bold text-[#2a3052] text-lg">Calcular Pagamentos</h3>
                            <p className="text-gray-500 text-sm">Fechar folha, horas extras e gerar holerites.</p>
                        </div>
                    </div>
                    <span className="text-gray-300 text-2xl">➔</span>
                </div>
            </div>

            {showValeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center space-x-2">
                            <span className="bg-orange-100 text-orange-600 p-2 rounded-md">💸</span>
                            <h2 className="text-xl font-bold text-[#2a3052]">Novo Vale</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Funcionário</label>
                                <select 
                                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                                    value={vale.employeeId}
                                    onChange={e => setVale({...vale, employeeId: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</label>
                                    <input type="number" placeholder="0.00" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300" value={vale.amount} onChange={e => setVale({...vale, amount: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Descontar Em</label>
                                    <input type="month" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300" value={vale.date} onChange={e => setVale({...vale, date: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Motivo</label>
                                <input placeholder="Ex: Adiantamento quinzenal" className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300" value={vale.reason} onChange={e => setVale({...vale, reason: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button onClick={() => setShowValeModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium border border-gray-300 bg-white">Cancelar</button>
                            <button onClick={handleLancarVale} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow">Confirmar Lançamento</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ); 
}

function EmployeeManager({ uid }) {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const initialState = { name: '', cpf: '', pix: '', role: '', type: 'Diarista', rate: '', admission: '' };
  const [empForm, setEmpForm] = useState(initialState);

  useEffect(() => {
    const q = query(collection(db, 'companies', uid, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(emps);
    });
    return () => unsubscribe();
  }, [uid]);

  const handleSave = async () => {
      if (!empForm.name || !empForm.rate) return alert("Preencha pelo menos Nome e Valor.");
      try {
          const dataToSave = { ...empForm, rate: parseFloat(empForm.rate) };
          if (editId) {
              await updateDoc(doc(db, 'companies', uid, 'employees', editId), dataToSave);
              alert("Atualizado com sucesso!");
          } else {
              await addDoc(collection(db, 'companies', uid, 'employees'), dataToSave);
              alert("Cadastrado com sucesso!");
          }
          setShowModal(false);
          setEmpForm(initialState);
          setEditId(null);
      } catch (error) {
          alert("Erro: " + error.message);
      }
  };

  const handleDelete = async (id) => {
      if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
          await deleteDoc(doc(db, 'companies', uid, 'employees', id));
      }
  };

  const openEditModal = (emp) => {
      setEmpForm(emp);
      setEditId(emp.id);
      setShowModal(true);
  };

  const openNewModal = () => {
      setEmpForm(initialState);
      setEditId(null);
      setShowModal(true);
  };

  const getMonthsEmployed = (admissionDate) => {
      if (!admissionDate) return 0;
      const start = new Date(admissionDate);
      const now = new Date();
      return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  };

  return (
    <div className="w-full animation-fade-in">
      <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
              <span className="text-3xl bg-blue-100 text-blue-600 p-2 rounded-lg">👥</span>
              <h2 className="text-3xl font-bold text-[#2a3052]">Equipe</h2>
          </div>
          <div className="flex space-x-4">
              <button 
                  onClick={() => alert("Link 'rhfast.com.br/cad/3982' copiado! Envie para o WhatsApp do funcionário para ele preencher os próprios dados.")} 
                  className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow"
              >
                  🔗 Link Auto-Cadastro
              </button>
              <button onClick={openNewModal} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg">
                  + Novo Cadastro
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {employees.map(emp => {
              const monthsEmployed = getMonthsEmployed(emp.admission);
              return (
              <div key={emp.id} className="bg-white rounded-xl shadow p-6 border-t-4 border-blue-500 relative flex flex-col justify-between">
                  <div>
                      {monthsEmployed >= 11 && (
                           <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded animate-pulse">
                               🚨 Férias Vencendo ({monthsEmployed} meses)
                           </div>
                      )}

                      <div className="text-xs font-bold text-blue-500 mb-2 uppercase">{emp.role || 'Sem cargo'}</div>
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{emp.name}</h3>
                      <p className="text-xs text-gray-500 mb-4">{emp.type}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-6">
                      <div>
                          <p className="text-xs text-gray-400">Diária / Base</p>
                          <p className="text-xl font-bold text-[#2a3052]">R$ {emp.rate ? Number(emp.rate).toFixed(2).replace('.',',') : '0,00'}</p>
                      </div>
                      <div className="flex space-x-3">
                          <button onClick={() => openEditModal(emp)} className="text-xl hover:scale-110 transition-transform" title="Editar">✏️</button>
                          <button onClick={() => handleDelete(emp.id)} className="text-xl hover:scale-110 transition-transform opacity-80" title="Excluir">🗑️</button>
                      </div>
                  </div>
              </div>
          )})}
          {employees.length === 0 && <div className="col-span-3 text-center text-gray-400 py-10">Nenhum funcionário cadastrado.</div>}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-[#f4f7fb]">
                      <h2 className="text-xl font-bold text-[#2a3052]">{editId ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div>
                          <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">1. Dados Pessoais</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="Nome Completo" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="CPF" value={empForm.cpf} onChange={e => setEmpForm({...empForm, cpf: e.target.value})} />
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full col-span-2" placeholder="Chave PIX (Telefone, CPF, Email)" value={empForm.pix} onChange={e => setEmpForm({...empForm, pix: e.target.value})} />
                          </div>
                      </div>

                      <div>
                          <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">2. Contrato de Trabalho</h3>
                          <div className="grid grid-cols-4 gap-4">
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full col-span-2" placeholder="Cargo (Ex: Montador)" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} />
                              <select className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full bg-white" value={empForm.type} onChange={e => setEmpForm({...empForm, type: e.target.value})}>
                                  <option>Diarista</option>
                                  <option>Mensalista</option>
                              </select>
                              <input type="number" className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="Valor R$" value={empForm.rate} onChange={e => setEmpForm({...empForm, rate: e.target.value})} />
                              <div className="col-span-2">
                                 <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Data de Admissão</label>
                                 <input type="date" className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" value={empForm.admission} onChange={e => setEmpForm({...empForm, admission: e.target.value})} />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                      <button onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium border border-gray-300 bg-white">Cancelar</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow">Salvar Dados</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// --- NOVO MÓDULO DE CÁLCULO DE FOLHA ---
function PayrollCalculator({ uid }) {
  const [employees, setEmployees] = useState([]);
  const [vales, setVales] = useState([]);
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [inputs, setInputs] = useState({});

  useEffect(() => {
      // Puxar Funcionários
      const unsubEmp = onSnapshot(query(collection(db, 'companies', uid, 'employees')), (snap) => {
          setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Puxar Vales Pendentes
      const unsubVales = onSnapshot(query(collection(db, 'companies', uid, 'vales')), (snap) => {
          setVales(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.status === 'pendente'));
      });
      return () => { unsubEmp(); unsubVales(); };
  }, [uid]);

  const handleInputChange = (empId, field, value) => {
      setInputs(prev => ({
          ...prev,
          [empId]: { ...(prev[empId] || {}), [field]: value }
      }));
  };

  const calculateNet = (emp) => {
      const empInputs = inputs[emp.id] || {};
      const dias = parseFloat(empInputs.dias) || 0;
      const extra = parseFloat(empInputs.extra) || 0;
      const faltas = parseFloat(empInputs.faltas) || 0;

      const baseCalc = emp.type === 'Diarista' ? (dias * parseFloat(emp.rate || 0)) : parseFloat(emp.rate || 0);
      const empVales = vales.filter(v => v.employeeId === emp.id).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

      return baseCalc + extra - faltas - empVales;
  };

  const calculateTotalGeral = () => {
      return employees.reduce((acc, emp) => acc + calculateNet(emp), 0);
  };

  const closePayroll = async () => {
      if(!period.start || !period.end) return alert("Defina o período da folha (Início e Fim).");
      if(employees.length === 0) return alert("Nenhum funcionário cadastrado para processar.");

      try {
          const folhaData = {
              periodStart: period.start,
              periodEnd: period.end,
              totalGeral: calculateTotalGeral(),
              createdAt: new Date().toISOString(),
              details: employees.map(emp => {
                  const empInputs = inputs[emp.id] || {};
                  const empVales = vales.filter(v => v.employeeId === emp.id).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                  return {
                      employeeId: emp.id,
                      name: emp.name,
                      role: emp.role,
                      type: emp.type,
                      rate: emp.rate,
                      dias: empInputs.dias || 0,
                      extra: empInputs.extra || 0,
                      faltas: empInputs.faltas || 0,
                      vales: empVales,
                      net: calculateNet(emp)
                  };
              })
          };

          // Salva folha no histórico
          await addDoc(collection(db, 'companies', uid, 'history'), folhaData);

          // Atualiza vales para pago
          for (const v of vales) {
              await updateDoc(doc(db, 'companies', uid, 'vales', v.id), { status: 'pago' });
          }

          alert("Folha fechada com sucesso! Verifique os recibos na aba Histórico.");
          setInputs({}); 
      } catch(e) {
          alert("Erro ao fechar folha: " + e.message);
      }
  };

  return (
      <div className="w-full animation-fade-in">
          <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                  <span className="text-3xl bg-green-100 text-green-600 p-2 rounded-lg">🧮</span>
                  <div>
                      <h2 className="text-3xl font-bold text-[#2a3052]">Calcular Folha</h2>
                      <p className="text-gray-500">Defina o período e preencha as variáveis do mês.</p>
                  </div>
              </div>
              <div className="flex space-x-4 items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                  <div className="px-2 text-sm font-bold text-gray-400">PERÍODO:</div>
                  <input type="date" className="border-none outline-none text-gray-700 bg-gray-50 p-2 rounded cursor-pointer" value={period.start} onChange={e => setPeriod({...period, start: e.target.value})} />
                  <span className="text-gray-400">até</span>
                  <input type="date" className="border-none outline-none text-gray-700 bg-gray-50 p-2 rounded cursor-pointer" value={period.end} onChange={e => setPeriod({...period, end: e.target.value})} />
              </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
                              <th className="p-4">Colaborador</th>
                              <th className="p-4 text-center">Dias Trab.</th>
                              <th className="p-4 text-center">R$ Extra / Bônus</th>
                              <th className="p-4 text-center">Desc. Faltas</th>
                              <th className="p-4 text-center">Vales Pendentes</th>
                              <th className="p-4 text-right">Líquido Final</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {employees.map(emp => {
                              const empVales = vales.filter(v => v.employeeId === emp.id);
                              const totalVales = empVales.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                              const net = calculateNet(emp);
                              
                              return (
                                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                                      <td className="p-4">
                                          <p className="font-bold text-gray-800">{emp.name}</p>
                                          <p className="text-xs text-gray-400">{emp.role || 'Sem cargo'} • R$ {emp.rate} ({emp.type})</p>
                                      </td>
                                      <td className="p-4 text-center">
                                          <input 
                                              type="number" 
                                              placeholder={emp.type === 'Mensalista' ? "Mês Cheio" : "Dias"} 
                                              disabled={emp.type === 'Mensalista'}
                                              className={`w-20 border p-2 rounded text-center outline-none focus:border-blue-500 ${emp.type === 'Mensalista' ? 'bg-gray-100 text-gray-400' : ''}`}
                                              value={inputs[emp.id]?.dias || ''}
                                              onChange={e => handleInputChange(emp.id, 'dias', e.target.value)}
                                          />
                                      </td>
                                      <td className="p-4 text-center">
                                          <input 
                                              type="number" 
                                              placeholder="0.00" 
                                              className="w-24 border p-2 rounded text-green-600 font-medium text-center outline-none focus:border-blue-500 bg-green-50" 
                                              value={inputs[emp.id]?.extra || ''}
                                              onChange={e => handleInputChange(emp.id, 'extra', e.target.value)}
                                          />
                                      </td>
                                      <td className="p-4 text-center">
                                          <input 
                                              type="number" 
                                              placeholder="0.00" 
                                              className="w-24 border p-2 rounded text-red-600 font-medium text-center outline-none focus:border-blue-500 bg-red-50" 
                                              value={inputs[emp.id]?.faltas || ''}
                                              onChange={e => handleInputChange(emp.id, 'faltas', e.target.value)}
                                          />
                                      </td>
                                      <td className="p-4 text-center">
                                          <div className="flex flex-col items-center">
                                              <input type="text" value={totalVales > 0 ? totalVales.toFixed(2) : "0.00"} className="w-24 border p-2 rounded text-red-600 font-medium text-center outline-none bg-gray-100" readOnly />
                                              <span className="text-[10px] text-gray-400 mt-1">{empVales.length} Vale(s) puxado(s)</span>
                                          </div>
                                      </td>
                                      <td className="p-4 text-right">
                                          <p className="font-black text-lg text-[#2a3052]">R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                      </td>
                                  </tr>
                              );
                          })}
                          {employees.length === 0 && (
                              <tr>
                                  <td colSpan="6" className="p-8 text-center text-gray-500">Nenhum funcionário para calcular.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
              <div className="p-6 bg-gray-50 flex justify-between items-center border-t border-gray-200">
                  <div>
                      <p className="text-sm text-gray-500">Total geral desta folha:</p>
                      <p className="text-2xl font-black text-[#2a3052]">R$ {calculateTotalGeral().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <button onClick={closePayroll} className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg flex items-center space-x-2">
                      <span>✓ Fechar Folha e Gerar Recibos</span>
                  </button>
              </div>
          </div>
      </div>
  );
}

function PaymentHistory({ uid }) {
    return (
        <div className="w-full animation-fade-in text-center p-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-[#2a3052] mb-4">Histórico em Construção</h2>
          <p className="text-gray-500">As folhas fechadas na aba 'Calcular' aparecerão aqui.</p>
      </div>
    );
}

function DocumentGenerator({ uid }) {
    return (
        <div className="w-full animation-fade-in text-center p-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-[#2a3052] mb-4">Documentos em Construção</h2>
          <p className="text-gray-500">Módulo de geração de PDF oficial.</p>
      </div>
    );
}

// --- TELAS PÚBLICAS E AUTENTICAÇÃO ---

function LandingPage({ onGoLogin }) {
  return (
    <div className="text-center p-8 md:p-20 bg-white min-h-screen flex flex-col justify-center items-center w-full">
      <div className="flex items-center space-x-2 mb-6">
          <div className="w-16 h-16 rounded-lg bg-[#303863] flex items-center justify-center text-white font-black text-3xl shadow-lg">RH</div>
          <h1 className="text-6xl font-black text-[#303863] tracking-tight">Fast</h1>
      </div>
      <p className="text-2xl mb-12 text-gray-500 font-medium">Sua gestão de pessoal, rápida e inteligente.</p>
      <button onClick={onGoLogin} className="bg-blue-600 text-white px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all duration-200">
        Entrar no Sistema
      </button>
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
          <h2 className="text-3xl font-black mb-2 text-[#2a3052]">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          <div className="space-y-5 mt-8">
              <input className="w-full p-4 border border-gray-300 rounded-xl outline-none" placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
              <input className="w-full p-4 border border-gray-300 rounded-xl outline-none" type="password" placeholder="Senha" onChange={e => setPass(e.target.value)} />
          </div>
          <button onClick={handleAuth} className="w-full bg-[#303863] text-white py-4 mt-8 rounded-xl font-bold text-lg">{isLogin ? 'Acessar Painel' : 'Criar Conta'}</button>
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">{isLogin ? 'Cadastre-se' : 'Fazer Login'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}