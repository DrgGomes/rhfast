// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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
      {/* HEADER PRINCIPAL (Baseado no visual enviado) */}
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
        
        {/* MENU DE NAVEGAÇÃO SUPERIOR */}
        <div className="flex space-x-2 bg-[#424b7a] rounded-lg p-1">
          <MenuBtn active={page === 'dashboard'} onClick={() => setPage('dashboard')}>Início</MenuBtn>
          <MenuBtn active={page === 'employees'} onClick={() => setPage('employees')}>Equipe</MenuBtn>
          <MenuBtn active={page === 'payroll'} onClick={() => setPage('payroll')}>Calcular</MenuBtn>
          <MenuBtn active={page === 'history'} onClick={() => setPage('history')}>Histórico</MenuBtn>
          <MenuBtn active={page === 'docs'} onClick={() => setPage('docs')}>Documentos</MenuBtn>
        </div>

        <div className="flex items-center space-x-4">
            <button className="hover:text-blue-200">⚙️ Configurações</button>
            <button onClick={() => signOut(auth)} className="text-red-400 hover:text-red-300 flex items-center">
               Sair 🚪
            </button>
        </div>
      </nav>

      {/* ÁREA DE TRABALHO */}
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

// Subcomponente de botão do menu superior
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
    // Mocks simulando dados do banco para ilustrar as Killer Features
    const folhaEstimada = 14250.00;
    const metaDiaria = (folhaEstimada / 30).toFixed(2);

    return (
        <div className="w-full animation-fade-in">
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

            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#3b82f6] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <p className="text-blue-100 font-medium mb-1">Funcionários Ativos</p>
                    <p className="text-4xl font-bold">12</p>
                    <span className="absolute right-4 bottom-4 text-5xl opacity-20">👥</span>
                </div>
                
                <div className="bg-[#10b981] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <p className="text-green-100 font-medium mb-1">Folha Estimada (Mês)</p>
                    <p className="text-4xl font-bold">R$ {folhaEstimada.toLocaleString('pt-BR')}</p>
                    <span className="absolute right-4 bottom-4 text-5xl opacity-20">💰</span>
                </div>

                {/* KILLER FEATURE 1: COFRINHO DIÁRIO */}
                <div className="bg-white border-l-4 border-yellow-400 rounded-xl p-6 text-gray-800 shadow-lg relative">
                    <p className="text-gray-500 text-sm font-bold uppercase mb-1 flex items-center">
                        🐖 Cofrinho Diário (Meta)
                    </p>
                    <p className="text-3xl font-bold text-[#2a3052]">R$ {metaDiaria}</p>
                    <p className="text-xs text-gray-400 mt-2 leading-tight">Guarde este valor por dia no caixa para pagar a folha sem sustos no dia 5.</p>
                </div>

                {/* AÇÃO RÁPIDA */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => alert("Abre modal de Novo Vale")}>
                    <p className="text-pink-100 font-medium mb-1">Ação Rápida</p>
                    <p className="text-3xl font-bold">Lançar Vale</p>
                    <span className="absolute right-4 bottom-4 text-5xl opacity-20">💸</span>
                </div>
            </div>

            {/* ATALHOS RÁPIDOS */}
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
        </div>
    ); 
}

function EmployeeManager({ uid }) {
  const [showModal, setShowModal] = useState(false);
  
  // Mocks de funcionários baseados na realidade da fábrica
  const team = [
      { id: 1, name: "ANTONIO EXPEDITO", role: "MONTADOR", type: "Diarista", rate: 133.00, pix: "5721232803", admission: "2024-01-15" },
      { id: 2, name: "DAVI GABRIEL DE FREITAS", role: "APONTADOR DE SOLA", type: "Diarista", rate: 166.19, pix: "000000000", admission: "2023-08-10" }, // 11 meses = ALERTA FÉRIAS
      { id: 3, name: "GUILERME MORETTI SILVA", role: "AUXILIAR", type: "Diarista", rate: 100.00, pix: "111111111", admission: "2025-02-01" },
  ];

  return (
    <div className="w-full animation-fade-in">
      <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
              <span className="text-3xl bg-blue-100 text-blue-600 p-2 rounded-lg">👥</span>
              <h2 className="text-3xl font-bold text-[#2a3052]">Equipe</h2>
          </div>
          <div className="flex space-x-4">
              {/* FUNÇÃO LINK DE AUTO-CADASTRO */}
              <button 
                  onClick={() => alert("Link 'rhfast.com.br/cad/3982' copiado! Envie para o WhatsApp do funcionário para ele preencher os próprios dados.")} 
                  className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow"
              >
                  🔗 Link Auto-Cadastro
              </button>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg">
                  + Novo Cadastro
              </button>
          </div>
      </div>

      {/* GRID DE FUNCIONÁRIOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map(emp => (
              <div key={emp.id} className="bg-white rounded-xl shadow p-6 border-t-4 border-blue-500 relative">
                  
                  {/* KILLER FEATURE 2: RADAR DE FÉRIAS */}
                  {emp.name === "DAVI GABRIEL DE FREITAS" && (
                       <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded animate-pulse">
                           🚨 Férias Vencendo (11 meses)
                       </div>
                  )}

                  <div className="text-xs font-bold text-blue-500 mb-2 uppercase">{emp.role}</div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{emp.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">8.45h/dia • {emp.type}</p>
                  
                  <div className="flex justify-between items-end mt-6">
                      <div>
                          <p className="text-xs text-gray-400">Diária / Base</p>
                          <p className="text-xl font-bold text-[#2a3052]">R$ {emp.rate.toFixed(2).replace('.',',')}</p>
                      </div>
                      <div className="flex space-x-2">
                          <button className="text-blue-500 hover:text-blue-700">✏️</button>
                          <button className="text-red-400 hover:text-red-600">🗑️</button>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* MODAL DE CADASTRO (Avançado) */}
      {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-center bg-[#f4f7fb]">
                      <h2 className="text-xl font-bold text-[#2a3052]">Cadastrar/Editar Funcionário</h2>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      {/* DADOS BÁSICOS */}
                      <div>
                          <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">1. Dados Pessoais</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="Nome Completo" />
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="CPF" />
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full col-span-2" placeholder="Chave PIX (Telefone, CPF, Email)" />
                          </div>
                      </div>

                      {/* CONTRATO */}
                      <div>
                          <h3 className="font-bold text-gray-700 mb-3 border-b pb-1">2. Contrato de Trabalho</h3>
                          <div className="grid grid-cols-3 gap-4">
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="Cargo (Ex: Montador)" />
                              <select className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full bg-white">
                                  <option>Diarista</option>
                                  <option>Mensalista</option>
                              </select>
                              <input className="border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="Valor R$ (Diária/Mês)" />
                          </div>
                      </div>

                      {/* KILLER FEATURE 4 & 6: PILOTO AUTOMÁTICO E BANQUEIRO */}
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                          <h3 className="font-bold text-indigo-900 mb-2 flex items-center">
                              🤖 Piloto Automático (Recorrências)
                          </h3>
                          <p className="text-sm text-indigo-700 mb-4">Adicione valores que se repetem todo mês para este funcionário. O sistema fará o cálculo sozinho na hora de fechar a folha.</p>
                          
                          <div className="flex space-x-2 mb-2">
                              <select className="border p-2 rounded-lg w-1/3">
                                  <option>Desconto Fixo (VT/VR)</option>
                                  <option>Bônus Fixo (Ajuda Custo)</option>
                                  <option>Empréstimo (Parcelado)</option>
                              </select>
                              <input className="border p-2 rounded-lg w-1/3" placeholder="Valor R$" />
                              <input className="border p-2 rounded-lg w-1/3" placeholder="Descrição (Ex: Convênio)" />
                              <button className="bg-indigo-600 text-white px-4 rounded-lg font-bold">+</button>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                      <button onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                      <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow">Salvar Dados</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

function PayrollCalculator({ uid }) {
  const closePayroll = async () => {
      alert("Cálculo processado e salvo no Histórico!");
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
                  <input type="date" className="border-none outline-none text-gray-700 bg-gray-50 p-2 rounded cursor-pointer" />
                  <span className="text-gray-400">até</span>
                  <input type="date" className="border-none outline-none text-gray-700 bg-gray-50 p-2 rounded cursor-pointer" />
              </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
                          <th className="p-4">Colaborador</th>
                          <th className="p-4">Dias Trab.</th>
                          <th className="p-4">Hrs Ext.</th>
                          <th className="p-4">R$ Extra</th>
                          <th className="p-4">Desc. Faltas</th>
                          <th className="p-4">Adiantamento (Vales)</th>
                          <th className="p-4 text-right">Líquido Final</th>
                      </tr>
                  </thead>
                  <tbody className="text-sm">
                      {/* LINHA EXEMPLO */}
                      <tr className="border-b hover:bg-gray-50">
                          <td className="p-4">
                              <p className="font-bold text-gray-800">ANTONIO EXPEDITO</p>
                              <p className="text-xs text-gray-400">MONTADOR • R$ 133,00/dia</p>
                          </td>
                          <td className="p-4"><input type="number" defaultValue="10" className="w-16 border p-2 rounded text-center outline-none focus:border-blue-500" /></td>
                          <td className="p-4"><input type="number" defaultValue="2" className="w-16 border p-2 rounded text-center outline-none focus:border-blue-500" /></td>
                          <td className="p-4"><input type="text" placeholder="0,00" className="w-24 border p-2 rounded text-green-600 font-medium outline-none focus:border-blue-500 bg-green-50" /></td>
                          <td className="p-4"><input type="text" placeholder="0,00" className="w-24 border p-2 rounded text-red-600 font-medium outline-none focus:border-blue-500 bg-red-50" /></td>
                          <td className="p-4">
                              <div className="flex flex-col">
                                  <input type="text" defaultValue="200,00" className="w-24 border p-2 rounded text-red-600 font-medium outline-none bg-gray-100" readOnly title="Valor puxado automaticamente dos vales lançados no mês" />
                                  <span className="text-[10px] text-gray-400 mt-1">1 Vale(s) no período</span>
                              </div>
                          </td>
                          <td className="p-4 text-right">
                              <p className="font-black text-lg text-[#2a3052]">R$ 1.161,48</p>
                          </td>
                      </tr>
                  </tbody>
              </table>
              <div className="p-6 bg-gray-50 flex justify-between items-center border-t border-gray-200">
                  <div>
                      <p className="text-sm text-gray-500">Total calculado até agora:</p>
                      <p className="text-2xl font-black text-[#2a3052]">R$ 1.161,48</p>
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
        <div className="w-full animation-fade-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                  <span className="text-3xl bg-purple-100 text-purple-600 p-2 rounded-lg">🕒</span>
                  <h2 className="text-3xl font-bold text-[#2a3052]">Histórico de Pagamentos</h2>
              </div>
            </div>

            <div className="space-y-4">
                {/* CARD DE HISTÓRICO */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl">✓</div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Pagamento Quinzenal (Dezembro)</h3>
                            <p className="text-sm text-gray-500">Ref: 10/12/2025 a 25/12/2025 • 3 funcionários processados</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold">TOTAL PAGO</p>
                            <p className="text-xl font-black text-[#2a3052]">R$ 4.234,88</p>
                        </div>
                        <div className="flex space-x-2">
                            {/* KILLER FEATURE 3: GERADOR REMESSA PIX */}
                            <button onClick={() => alert("Chaves PIX e Valores copiados! Cole direto na área PIX em Lote do seu banco.")} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200 transition text-sm flex items-center space-x-1">
                                <span>📄 Copiar PIX</span>
                            </button>
                            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition text-sm">
                                Visualizar Detalhes
                            </button>
                        </div>
                    </div>
                </div>

                {/* KILLER FEATURE 1: ASSINATURA & 5: COFRE COMPROVANTES */}
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mt-8">
                    <h3 className="font-bold text-blue-900 mb-2">Acesso Rápido a Recibos (Holerites)</h3>
                    <p className="text-sm text-blue-700 mb-4">Selecione um pagamento acima para abrir a tela de recibos. Lá você poderá:</p>
                    <ul className="list-disc pl-5 text-sm text-blue-800 space-y-2 font-medium">
                        <li><span className="bg-blue-200 px-1 rounded">Assinatura na Tela:</span> Virar o celular para o funcionário assinar o holerite com o dedo na mesma hora.</li>
                        <li><span className="bg-blue-200 px-1 rounded">Cofre de Comprovantes:</span> Anexar o PDF/Print do PIX do banco direto no card do funcionário para nunca mais perder.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function DocumentGenerator({ uid }) {
    return (
        <div className="w-full animation-fade-in max-w-4xl mx-auto">
             <div className="flex items-center space-x-3 mb-8">
                  <span className="text-3xl bg-orange-100 text-orange-600 p-2 rounded-lg">📄</span>
                  <div>
                      <h2 className="text-3xl font-bold text-[#2a3052]">Gerador de Documentos</h2>
                      <p className="text-gray-500">Crie documentos oficiais em PDF com 1 clique.</p>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">1. Selecione o Funcionário</label>
                      <select className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Selecione da lista...</option>
                          <option>ANTONIO EXPEDITO - Montador</option>
                      </select>
                  </div>

                  <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-700 mb-2">2. Tipo de Documento</label>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="border border-red-200 bg-red-50 p-4 rounded-xl cursor-pointer hover:border-red-400 transition">
                              <span className="text-red-500 text-xl block mb-2">⚠️</span>
                              <h4 className="font-bold text-red-900">Termo de Rescisão</h4>
                              <p className="text-xs text-red-700 mt-1">Quitação final e dispensa</p>
                          </div>
                          <div className="border border-orange-200 bg-orange-50 p-4 rounded-xl cursor-pointer hover:border-orange-400 transition">
                              <span className="text-orange-500 text-xl block mb-2">🛡️</span>
                              <h4 className="font-bold text-orange-900">Advertência Escrita</h4>
                              <p className="text-xs text-orange-700 mt-1">Aviso disciplinar formal</p>
                          </div>
                          <div className="border-2 border-blue-500 bg-blue-50 p-4 rounded-xl cursor-pointer">
                              <span className="text-blue-500 text-xl block mb-2">📋</span>
                              <h4 className="font-bold text-blue-900">Declaração de Trabalho</h4>
                              <p className="text-xs text-blue-700 mt-1">Comprovante de vínculo para bancos</p>
                          </div>
                          <div className="border border-green-200 bg-green-50 p-4 rounded-xl cursor-pointer hover:border-green-400 transition">
                              <span className="text-green-500 text-xl block mb-2">🦺</span>
                              <h4 className="font-bold text-green-900">Recibo de EPI</h4>
                              <p className="text-xs text-green-700 mt-1">Entrega de uniformes/botinas</p>
                          </div>
                      </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:bg-blue-700 transition">
                      Gerar Documento (PDF)
                  </button>
              </div>
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
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) { 
      alert("Erro: " + e.message); 
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f4f7fb]">
      <div className="w-full md:w-1/2 bg-[#303863] text-white p-8 md:p-16 flex flex-col justify-center items-start relative overflow-hidden">
          {/* Efeitos de Fundo Visual */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

          <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 rounded bg-white text-[#303863] flex items-center justify-center font-black text-2xl">RH</div>
                  <h1 className="text-4xl font-bold">Gestão Inteligente</h1>
              </div>
              <p className="text-xl mb-6 text-blue-100">Feche a folha de pagamento em minutos, automatize vales e evite processos trabalhistas.</p>
              
              <ul className="space-y-4 text-blue-200 mt-8 font-medium">
                  <li className="flex items-center space-x-2"><span>✅</span> <span>Cálculo automático de Diaristas/Mensalistas</span></li>
                  <li className="flex items-center space-x-2"><span>✅</span> <span>Assinatura Digital de Recibos na Tela</span></li>
                  <li className="flex items-center space-x-2"><span>✅</span> <span>Gerador de Arquivo PIX para Bancos</span></li>
              </ul>
          </div>
      </div>

      <div className="w-full md:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-20">
        <div className="w-full max-w-md bg-white">
          <h2 className="text-3xl font-black mb-2 text-[#2a3052]">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-gray-500 mb-8">{isLogin ? 'Insira suas credenciais para acessar o painel.' : 'Comece a simplificar seu RH agora mesmo.'}</p>
          
          <div className="space-y-5">
              <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">E-mail Corporativo</label>
                  <input 
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 transition" 
                      placeholder="ex: contato@suaempresa.com.br" 
                      onChange={e => setEmail(e.target.value)} 
                  />
              </div>
              <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Senha de Acesso</label>
                  <input 
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 transition" 
                      type="password" 
                      placeholder="••••••••" 
                      onChange={e => setPass(e.target.value)} 
                  />
              </div>
          </div>

          <div className="text-right mt-3">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Esqueceu a senha?</button>
          </div>
          
          <button 
              onClick={handleAuth} 
              className="w-full bg-[#303863] text-white py-4 mt-8 rounded-xl font-bold text-lg hover:bg-[#424b7a] shadow-lg transition-all duration-200 transform hover:-translate-y-1"
          >
            {isLogin ? 'Acessar Painel ➔' : 'Criar Conta Grátis'}
          </button>
          
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
              {isLogin ? (
                  <p className="text-gray-600 font-medium">
                      Ainda não usa o RH Fast? <button onClick={() => setIsLogin(false)} className="text-blue-600 font-bold hover:underline">Cadastre-se</button>
                  </p>
              ) : (
                  <p className="text-gray-600 font-medium">
                      Já possui conta? <button onClick={() => setIsLogin(true)} className="text-blue-600 font-bold hover:underline">Fazer Login</button>
                  </p>
              )}
              <button onClick={onBack} className="text-sm font-semibold text-gray-400 hover:text-gray-600 mt-4 block mx-auto">← Voltar para Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}