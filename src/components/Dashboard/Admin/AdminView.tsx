import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { userService } from '../../../lib/userService';
import {
  Users,
  Settings,
  Globe,
  Cpu,
  Zap,
  Lock,
  Clock,
  Bell,
  FileText,
  BarChart3,
  Search,
  X,
  Coins,
  Database,
  Shield,
  AlertTriangle,
  Edit2,
  Trash2,
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import styles from './AdminView.module.css';

import { usersService, authClient } from '../../../lib/usersService';
import { useAuth } from '../../../lib/useAuth';

type UserProfile = {
  Plataforma_ID: null;
  Usuario_ID: string;
  Nome: string;
  Email: string;
  Tipo: string;
  Plano_ID?: string;
  Status: string;
  Data_criacao?: string;
  planos?: Plan;
};

type Plan = {
  plano_id: string; // Usado internamente como ID
  id?: string; // Compatibilidade com lógica anterior
  nome: string;
  quantidade_alunos: string;
  valor_mensal: string;
  valor_onboarding: string;
  valor_unitario: string;
  valor_aluno_excedente: string;
  status: string;
  descricao?: string;
};

type Tab = 'usuarios' | 'stats' | 'planos' | 'relatorios' | 'config' | 'config_unidade';

export const AdminView = () => {
  const { user: currentUser, permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tipo: 'Profissional',
    senha: '',
    escola_id: '',
    plano_id: ''
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchPlans();
      await fetchUsers();
      await fetchSchools();
      await fetchConfigs();
      if (currentUser?.tipo === 'GESTOR' && currentUser?.escola_id) {
        fetchSchoolSettings();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (plans.length > 0 && users.length > 0) {
      fetchStats();
    }
  }, [plans, users]);

  const [planData, setPlanData] = useState({
    nome: '',
    qtdAlunos: '',
    valorMensal: '',
    valorOnboarding: '',
    valorUnitario: '',
    valorExcedente: '',
    ativo: true,
    descricao: ''
  });
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [statsData, setStatsData] = useState({
    clientesAtivos: 0,
    totalUsuarios: 0,
    receitaMensal: 0,
    clientesPorPlano: [] as any[],
    recentes: [] as any[]
  });

  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  const [configs, setConfigs] = useState({
    id: 1,
    manutencao: false,
    cadastroPublico: true,
    iaPei: true,
    debugLogs: false,
    backupDiario: true,
    comunicadoGlobal: '',
    timeoutSessao: 60
  });

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase.from('configuracoes_globais').select('*').eq('id', 1).single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for 'No rows found'
      if (data) {
        setConfigs({
          id: data.id,
          manutencao: !!data.manutencao,
          cadastroPublico: !!data.cadastroPublico,
          iaPei: !!data.iaPei,
          debugLogs: !!data.debugLogs,
          backupDiario: !!data.backupDiario,
          comunicadoGlobal: data.comunicadoGlobal || '',
          timeoutSessao: data.timeoutSessao || 60
        });
      }
    } catch (e) {
      console.error('Erro ao buscar configuracoes_globais:', e);
    }
  };

  const fetchSchoolSettings = async () => {
    if (!currentUser?.escola_id) return;
    try {
      const { data, error } = await supabase
        .from('Escolas')
        .select('*')
        .eq('Escola_ID', currentUser.escola_id)
        .single();
      if (error) throw error;
      setSchoolSettings(data);
    } catch (e) {
      console.error('Erro ao buscar escola:', e);
    }
  };

  const handleUpdateSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolSettings || !currentUser?.escola_id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('Escolas')
        .update({
          Nome: schoolSettings.Nome,
          Razao_Social: schoolSettings.Razao_Social,
          CNPJ: schoolSettings.CNPJ,
          Telefone: schoolSettings.Telefone,
          Endereco: schoolSettings.Endereco,
          Logo: schoolSettings.Logo
        })
        .eq('Escola_ID', currentUser.escola_id);
      
      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('Configurações da unidade salvas com sucesso!');
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('planos').select('*').order('plano_id', { ascending: true });
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('Escolas')
        .select('*')
        .order('Nome', { ascending: true });
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Erro ao buscar escolas:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('Usuarios')
        .select('*, planos(*)')
        .order('Nome', { ascending: true });

      // Isola os dados por escola para Gestores/Diretores
      if (currentUser?.tipo === 'GESTOR' && currentUser?.escola_id) {
        query = query.eq('Escola_ID', currentUser.escola_id);
      } else if (!permissions?.canViewAllSchools && currentUser?.plataforma_id) {
        // Se não for admin global, filtra pela plataforma
        query = query.eq('Plataforma_ID', currentUser.plataforma_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // 1. Total Alunos (Filtrado por Escola se for Gestor)
      let alunosQuery = supabase.from('Alunos').select('*', { count: 'exact', head: true });
      if (currentUser?.tipo === 'GESTOR' && currentUser?.escola_id) {
        alunosQuery = alunosQuery.eq('Escola_ID', currentUser.escola_id);
      } else if (currentUser?.plataforma_id) {
        alunosQuery = alunosQuery.eq('Plataforma_ID', currentUser.plataforma_id);
      }
      const { count: alunosCount } = await alunosQuery;
      setTotalAlunos(alunosCount || 0);

      // 2. Usuarios e Receita
      let usersQuery = supabase.from('Usuarios').select('*, planos(valor_mensal)');
      if (currentUser?.tipo === 'GESTOR' && currentUser?.escola_id) {
        usersQuery = usersQuery.eq('Escola_ID', currentUser.escola_id);
      } else if (currentUser?.plataforma_id) {
        usersQuery = usersQuery.eq('Plataforma_ID', currentUser.plataforma_id);
      }
      const { data: usersData } = await usersQuery;
      
      const gestores = usersData?.filter(u => u.Tipo === 'GESTOR' || u.Tipo === 'Administrador' || u.Tipo === 'PROFISSIONAL') || [];

      const receita = gestores.reduce((acc, curr) => {
        // @ts-ignore
        const val = curr.planos?.valor_mensal || 0;
        return acc + Number(val);
      }, 0);

      const porPlano = plans.map(p => ({
        nome: p.nome,
        count: usersData?.filter(u => u.Plano_ID?.toString() === p.plano_id?.toString()).length || 0
      })).filter(x => x.count > 0);

      setStatsData({
        clientesAtivos: gestores.filter(u => u.Status === 'Ativo').length,
        totalUsuarios: usersData?.length || 0,
        receitaMensal: receita,
        clientesPorPlano: porPlano,
        recentes: usersData?.sort((a, b) => new Date(b.Data_criacao || 0).getTime() - new Date(a.Data_criacao || 0).getTime()).slice(0, 8) || []
      });
    } catch (e) {
      console.error('Erro ao processar stats:', e);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUserId) {
        // Update existing user
        const payload = {
          Nome: formData.nome,
          Email: formData.email,
          Tipo: formData.tipo,
          Plano_ID: formData.plano_id || null,
          Status: 'Ativo'
        };
        const { error } = await supabase.from('Usuarios').update(payload).eq('Usuario_ID', editingUserId);
        if (error) throw error;
        alert('Usuário atualizado com sucesso!');
      } else {
        // Create new user:
        // 1. Create in Supabase Auth first (using silent client to not logout admin)
        const { data: authData, error: authError } = await authClient.auth.signUp({
            email: formData.email,
            password: formData.senha || 'Vinculo@2026',
            options: {
                data: {
                    nome: formData.nome,
                    role: formData.tipo
                }
            }
        });

        if (authError) throw authError;

        // 2. Insert into Usuarios table with the new auth_uid
        const payload = {
          auth_uid: authData.user?.id,
          Nome: formData.nome,
          Email: formData.email,
          Tipo: formData.tipo,
          Plano_ID: formData.plano_id || null,
          Status: 'Ativo',
          Plataforma_ID: currentUser?.plataforma_id || users[0]?.Plataforma_ID || null,
          Escola_ID: currentUser?.tipo === 'GESTOR' ? currentUser?.escola_id : (formData.escola_id ? parseInt(formData.escola_id) : null)
        };

        const { error } = await supabase.from('Usuarios').insert([payload]);
        if (error) throw error;
        alert('Usuário cadastrado com sucesso!');
      }

      setIsAddingUser(false);
      setEditingUserId(null);
      fetchUsers();
      setFormData({ nome: '', email: '', tipo: 'Profissional', senha: '', escola_id: '', plano_id: '' });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar: ' + (error.message || 'Verifique o console'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (u: any) => {
    setFormData({
      nome: u.Nome,
      email: u.Email,
      tipo: u.Tipo,
      senha: '',
      escola_id: u.Escola_ID || '',
      plano_id: u.Plano_ID || ''
    });
    setEditingUserId(u.Usuario_ID);
    setIsAddingUser(true);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o usuário ${name}?`)) return;
    try {
      setLoading(true);
      await userService.delete(id);
      setUsers(users.filter(u => u.Usuario_ID !== id));
      alert('Usuário excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir: ' + (error.message || 'Verifique o console'));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      nome: planData.nome,
      quantidade_alunos: planData.qtdAlunos,
      valor_mensal: planData.valorMensal,
      valor_onboarding: planData.valorOnboarding,
      valor_unitario: planData.valorUnitario,
      valor_aluno_excedente: planData.valorExcedente,
      status: planData.ativo ? 'Ativo' : 'Inativo',
    };

    try {
      if (editingPlanId) {
        const { error } = await supabase.from('planos').update(payload).eq('plano_id', editingPlanId);
        if (error) throw error;
        alert('Plano atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('planos').insert([payload]);
        if (error) throw error;
        alert('Plano criado com sucesso!');
      }

      setIsAddingPlan(false);
      setEditingPlanId(null);
      fetchPlans();
      setPlanData({
        nome: '', qtdAlunos: '', valorMensal: '', valorOnboarding: '',
        valorUnitario: '', valorExcedente: '', ativo: true, descricao: ''
      });
    } catch (error: any) {
      alert('Erro ao salvar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (p: Plan) => {
    setPlanData({
      nome: p.nome,
      qtdAlunos: p.quantidade_alunos,
      valorMensal: p.valor_mensal,
      valorOnboarding: p.valor_onboarding,
      valorUnitario: p.valor_unitario,
      valorExcedente: p.valor_aluno_excedente,
      ativo: p.status === 'Ativo',
      descricao: p.descricao || ''
    });
    setEditingPlanId(p.plano_id);
    setIsAddingPlan(true);
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Excluir o plano ${name}? Contas vinculadas a este plano podem ser afetadas.`)) return;
    try {
      const { error } = await supabase.from('planos').delete().eq('plano_id', id);
      if (error) throw error;
      setPlans(plans.filter(p => p.plano_id !== id));
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const toggleConfig = (key: keyof typeof configs) => {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateConfigValue = (key: keyof typeof configs, value: string | number) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfigs = async () => {
    setLoading(true);
    try {
      const payload = { ...configs, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('configuracoes_globais').upsert(payload, { onConflict: 'id' });
      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela configuracoes_globais não existe no banco Supabase. Dados salvos localmente na sessão.');
        } else {
          throw error;
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar configs:', error);
      alert('Erro ao salvar as configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isGlobalAdmin = permissions?.canViewAllSchools;

  const tabs = [
    { id: 'usuarios' as const, label: 'Usuários', icon: Users },
    ...(isGlobalAdmin ? [{ id: 'planos' as const, label: 'Planos SaaS', icon: Zap }] : []),
    { id: 'stats' as const, label: isGlobalAdmin ? 'Estatísticas Globais' : 'Estatísticas da Unidade', icon: BarChart3 },
    ...(isGlobalAdmin ? [{ id: 'relatorios' as const, label: 'Relatórios do Sistema', icon: ClipboardList }] : []),
    ...(isGlobalAdmin ? [{ id: 'config' as const, label: 'Configurações', icon: Settings }] : []),
    { id: 'config_unidade' as const, label: 'Configurações da Unidade', icon: Settings },
  ];

  return (
    <div className={styles.adminWrapper}>
      <header className={styles.headerRow}>
        <h1 className={styles.titleMain}>
          Painel <span className={styles.titleHighlight}>Administrativo</span>
        </h1>
        <p className={styles.titleSub}>Gestão Global do Ecossistema VínculoTEA</p>
      </header>

      <nav className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={styles.contentRow}>
        {activeTab === 'usuarios' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>Contas de Usuários</h3>
                <p className={styles.cardDesc}>Visualize e gerencie todos os acessos do ecossistema</p>
              </div>
              <button className={styles.btnPrimary} onClick={() => setIsAddingUser(true)}>Novo Usuário</button>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>USUÁRIO</th>
                      <th>TIPO</th>
                      <th>PLANO</th>
                      <th>STATUS</th>
                      <th>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.Usuario_ID}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>{u.Nome?.charAt(0) || 'U'}</div>
                            <div>
                              <div className={styles.userNameText}>{u.Nome}</div>
                              <div className={styles.userEmailText}>{u.Email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={styles.badge}>{u.Tipo}</span></td>
                        <td><span className={styles.planText}>{u.planos?.nome || 'Sem Plano'}</span></td>
                        <td><span className={u.Status === 'Ativo' ? styles.statusAtivo : styles.statusPendente}>{u.Status}</span></td>
                        <td>
                          <div className={styles.actionGroup} style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.btnIcon} onClick={() => handleEditUser(u)} title="Editar"><Edit2 size={16} /></button>
                            <button className={styles.btnIcon} onClick={() => handleDeleteUser(u.Usuario_ID, u.Nome)} style={{ color: '#e53e3e' }}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planos' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>Planos SaaS</h3>
                <p className={styles.cardDesc}>Gerencie os níveis de assinatura e recursos</p>
              </div>
              <button className={styles.btnPrimary} onClick={() => setIsAddingPlan(true)}>Criar Novo Plano</button>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.plansGrid}>
                {plans.map((p) => (
                  <div key={p.plano_id} className={styles.planCard}>
                    <div className={styles.planBadge}>{p.status?.toUpperCase()}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 className={styles.planName}>{p.nome}</h4>
                        <div className={styles.planPriceLabel}>
                          <span className={styles.currencySymbol}>R$</span>
                          <span className={styles.priceMain}>{p.valor_mensal}</span>
                          <span className={styles.pricePeriod}>/mês</span>
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <button className={styles.btnActionEdit} onClick={() => handleEditPlan(p)}><Edit2 size={16} /></button>
                        <button className={styles.btnActionDel} onClick={() => handleDeletePlan(p.plano_id, p.nome)}><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className={styles.planDetailsGrid}>
                      <div className={styles.detailItem}>
                        <Users size={14} className={styles.detailIcon} />
                        <span>{p.quantidade_alunos} alunos</span>
                      </div>
                      <div className={styles.detailItem}>
                        <Coins size={14} className={styles.detailIcon} />
                        <span>Excedente: R$ {p.valor_aluno_excedente}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <Database size={14} className={styles.detailIcon} />
                        <span>Setup: R$ {p.valor_onboarding}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div>
                  <span className={styles.statLabel}>Clientes Ativos</span>
                  <h4 className={styles.statValue}>{statsData.clientesAtivos}</h4>
                </div>
                <div className={styles.statIcon} style={{ background: '#e6fffa', color: '#38b2ac' }}><Users size={24} /></div>
              </div>
              <div className={styles.statCard}>
                <div>
                  <span className={styles.statLabel}>Total de Alunos</span>
                  <h4 className={styles.statValue}>{totalAlunos}</h4>
                </div>
                <div className={styles.statIcon} style={{ background: '#ebf8ff', color: '#4299e1' }}><Database size={24} /></div>
              </div>
              <div className={styles.statCard}>
                <div>
                  <span className={styles.statLabel}>Total de Usuários</span>
                  <h4 className={styles.statValue}>{statsData.totalUsuarios}</h4>
                </div>
                <div className={styles.statIcon} style={{ background: '#fffaf0', color: '#ed8936' }}><Shield size={24} /></div>
              </div>
              <div className={styles.statCard}>
                <div>
                  <span className={styles.statLabel}>Receita Mensal</span>
                  <h4 className={styles.statValue}>R$ {statsData.receitaMensal.toLocaleString()}</h4>
                </div>
                <div className={styles.statIcon} style={{ background: 'rgba(0, 65, 131, 0.1)', color: '#004183' }}><Coins size={24} /></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '13fr 7fr', gap: '1.5rem' }}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Gestão de Faturamento</h3>
                  <div className={styles.badge}>MENSAL</div>
                </div>
                <div className={styles.statsBox}>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Total a Receber</span>
                    <span className={styles.miniStatVal}>R$ {statsData.receitaMensal.toLocaleString()}</span>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Total Recebido</span>
                    <span className={styles.miniStatVal} style={{ color: '#004183' }}>R$ {(statsData.receitaMensal * 0.85).toLocaleString()}</span>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Contas Ativas</span>
                    <span className={styles.miniStatVal}>{statsData.clientesAtivos}</span>
                  </div>
                </div>
                <div className={styles.cardBody} style={{ padding: 0 }}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>CLIENTE</th>
                          <th>PLANO</th>
                          <th>BASE</th>
                          <th>ADIC.</th>
                          <th>EXCED.</th>
                          <th>TOTAL</th>
                          <th>VENC.</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.Tipo === 'GESTOR' || u.Tipo === 'Administrador' || u.Tipo === 'PROFISSIONAL').slice(0, 5).map(u => (
                          <tr key={u.Usuario_ID}>
                            <td><strong>{u.Nome}</strong></td>
                            <td><span className={styles.planText}>{u.planos?.nome || 'N/A'}</span></td>
                            <td>R$ {u.planos?.valor_mensal || '0,00'}</td>
                            <td>0</td>
                            <td>R$ 0,00</td>
                            <td><strong>R$ {u.planos?.valor_mensal || '0,00'}</strong></td>
                            <td>10/05/26</td>
                            <td><span className={u.Status === 'Ativo' ? styles.statusAtivo : styles.statusPendente}>{u.Status?.toUpperCase()}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Performance SaaS</h3>
                  <BarChart3 size={18} color="#96d268" />
                </div>
                <div className={styles.cardBody}>
                  {statsData.clientesPorPlano.map((p, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#4a5568' }}>
                        <span>{p.nome}</span>
                        <span style={{ color: '#96d268' }}>{p.count}</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(p.count / (statsData.totalUsuarios || 1)) * 100}%`, height: '100%', background: '#96d268' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '2.5rem' }}>
                    <h4 className={styles.miniStatLabel} style={{ marginBottom: '1rem', color: '#2d3748' }}>Usuários Recentes</h4>
                    {statsData.recentes.map((u, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#96d268' }}>{u.Nome.charAt(0)}</div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2d3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.Nome}</div>
                          <div style={{ fontSize: '0.65rem', color: '#a0aec0', fontWeight: 600 }}>{u.Email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: '1.5rem' }}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Custos Operacionais</h3>
                <div className={styles.badge}>PLATAFORMA</div>
              </div>
              <p style={{ padding: '0 2rem', fontSize: '0.7rem', color: '#a0aec0', marginBottom: '1rem' }}>
                * Valores baseados nas taxas atuais de infraestrutura e consumo de API (OpenAI/Cloud).
              </p>
              <div className={styles.cardBody} style={{ padding: 0 }}>
                <div className={styles.tableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>DESCRIÇÃO</th>
                        <th>VALOR</th>
                        <th>VENCIMENTO</th>
                        <th>PAGAMENTO</th>
                        <th>STATUS</th>
                        <th>AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>


                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>Configurações do Ecossistema</h3>
                  <p className={styles.cardDesc}>Gerencie o comportamento global da plataforma VinculoTEA</p>
                </div>
                <Settings size={20} color="#96d268" />
              </div>
              <div className={styles.cardBody}>

                <div style={{ marginBottom: '3.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#004183', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Globe size={18} /> Sistema e Acesso
                  </h4>
                  <div className={styles.plansGrid}>
                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ paddingRight: '1rem' }}>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Modo de Manutenção</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Bloqueia o acesso de usuários comuns para manutenção programada.</p>
                        </div>
                        <div className={`${styles.toggle} ${configs.manutencao ? styles.toggleActive : ''}`} onClick={() => toggleConfig('manutencao')} style={{ flexShrink: 0 }}>
                          <div className={`${styles.toggleCircle} ${configs.manutencao ? styles.toggleCircleActive : ''}`} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ paddingRight: '1rem' }}>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Cadastro Público</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Permite que novos usuários se cadastrem livremente na plataforma.</p>
                        </div>
                        <div className={`${styles.toggle} ${configs.cadastroPublico ? styles.toggleActive : ''}`} onClick={() => toggleConfig('cadastroPublico')} style={{ flexShrink: 0 }}>
                          <div className={`${styles.toggleCircle} ${configs.cadastroPublico ? styles.toggleCircleActive : ''}`} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem', justifyContent: 'space-between' }}>
                        <div>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Comunicado Global</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Mensagem exibida no topo para todos os usuários.</p>
                        </div>
                        <input 
                          type="text" 
                          className={styles.input} 
                          style={{ width: '100%' }} 
                          placeholder="Ex: Manutenção prevista para 02:00..." 
                          value={configs.comunicadoGlobal}
                          onChange={(e) => handleUpdateConfigValue('comunicadoGlobal', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '3.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#004183', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Cpu size={18} /> Inteligência Artificial
                  </h4>
                  <div className={styles.plansGrid}>
                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ paddingRight: '1rem' }}>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Motor IA (GPT-4)</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Habilita o motor de IA para sugestões automáticas nos relatórios.</p>
                        </div>
                        <div className={`${styles.toggle} ${configs.iaPei ? styles.toggleActive : ''}`} onClick={() => toggleConfig('iaPei')} style={{ flexShrink: 0 }}>
                          <div className={`${styles.toggleCircle} ${configs.iaPei ? styles.toggleCircleActive : ''}`} />
                        </div>
                      </div>
                    </div>
                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ paddingRight: '1rem' }}>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Logs de Depuração</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Registra interações de IA para análise técnica detalhada.</p>
                        </div>
                        <div className={`${styles.toggle} ${configs.debugLogs ? styles.toggleActive : ''}`} onClick={() => toggleConfig('debugLogs')} style={{ flexShrink: 0 }}>
                          <div className={`${styles.toggleCircle} ${configs.debugLogs ? styles.toggleCircleActive : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#004183', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={18} /> Segurança e Dados
                  </h4>
                  <div className={styles.plansGrid}>
                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1.5rem', justifyContent: 'space-between' }}>
                        <div>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Timeout de Sessão</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Encerrar sessão após inatividade em minutos.</p>
                        </div>
                        <input 
                          type="number" 
                          className={styles.input} 
                          style={{ width: '120px' }} 
                          value={configs.timeoutSessao} 
                          onChange={(e) => handleUpdateConfigValue('timeoutSessao', parseInt(e.target.value) || 60)}
                        />
                      </div>
                    </div>
                    <div className={styles.planCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ paddingRight: '1rem' }}>
                          <h4 className={styles.planName} style={{ fontSize: '1.1rem' }}>Backup Automático</h4>
                          <p className={styles.configDesc} style={{ marginTop: '0.5rem' }}>Cópia de segurança de todas as tabelas a cada 24h.</p>
                        </div>
                        <div className={`${styles.toggle} ${configs.backupDiario ? styles.toggleActive : ''}`} onClick={() => toggleConfig('backupDiario')} style={{ flexShrink: 0 }}>
                          <div className={`${styles.toggleCircle} ${configs.backupDiario ? styles.toggleCircleActive : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.actions} style={{ marginTop: '3rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                  {saveSuccess && <span style={{ color: '#96d268', fontSize: '0.8rem', fontWeight: 700, animation: 'fadeIn 0.3s', marginRight: '1rem' }}>Configurações salvas com sucesso!</span>}
                  <button
                    className={styles.btnPrimary}
                    onClick={handleSaveConfigs}
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.dangerZone} style={{ marginTop: '2rem' }}>
              <div className={styles.dangerTitle}><AlertTriangle size={16} /> Zona Crítica</div>
              <p className={styles.dangerDesc}>Mudanças no Motor de IA ou Modo de Manutenção afetam todos os usuários conectados instantaneamente. Use com cautela.</p>
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={styles.headerRow} style={{ marginBottom: '2rem' }}>
              <h2 className={styles.titleMain}>Relatórios <span className={styles.titleHighlight}>Administrativos</span></h2>
              <p className={styles.titleSub}>Métricas globais de faturamento e uso da plataforma</p>
            </div>
            
            <div className={styles.plansGrid}>
              {[
                { title: 'Crescimento de Usuários', desc: 'Análise mensal de novos cadastros e churn.', icon: Users, color: '#004183' },
                { title: 'Faturamento SaaS', desc: 'Resumo de receitas por plano e cobranças pendentes.', icon: Coins, color: '#96d268' },
                { title: 'Uso de IA', desc: 'Consumo de tokens e interações com o motor GPT-4.', icon: Cpu, color: '#fcce40' },
                { title: 'Saúde do Servidor', desc: 'Status de latência e backups do banco de dados.', icon: Database, color: '#004183' }
              ].map((rep, idx) => (
                <div key={idx} className={styles.planCard} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className={styles.statIcon} style={{ background: `${rep.color}10`, color: rep.color }}>
                        <rep.icon size={24} />
                      </div>
                      <div className={styles.badge} style={{ fontSize: '0.6rem' }}>DISPONÍVEL</div>
                    </div>
                    <div>
                      <h4 className={styles.planName} style={{ fontSize: '1.2rem' }}>{rep.title}</h4>
                      <p className={styles.configDesc} style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{rep.desc}</p>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: rep.color, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Visualizar Dados <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'config_unidade' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={styles.headerRow} style={{ marginBottom: '2rem' }}>
              <h2 className={styles.titleMain}>Configurações da <span className={styles.titleHighlight}>Unidade</span></h2>
              <p className={styles.titleSub}>Personalize os dados da sua instituição para relatórios e cabeçalhos PDF</p>
            </div>

            <div className={styles.configGrid}>
              <div className={styles.configCardMain}>
                <div className={styles.cardHeader}>
                  <div className={styles.statIcon} style={{ background: '#00418310', color: '#004183' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>Identidade Institucional</h3>
                    <p className={styles.configDesc}>Estes dados controlam a marca da sua escola em relatórios, PEIs e documentos exportados.</p>
                  </div>
                </div>

                {schoolSettings ? (
                  <form onSubmit={handleUpdateSchoolSettings} style={{ marginTop: '2rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.5rem', border: '1px dashed #cbd5e1', marginBottom: '2rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Prévia do Cabeçalho PDF</p>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        {schoolSettings.Logo ? (
                          <img src={schoolSettings.Logo} alt="Logo" style={{ height: '50px', maxWidth: '120px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ height: '50px', width: '50px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '10px', color: '#94a3b8' }}>LOGO</div>
                        )}
                        <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>{schoolSettings.Nome || 'NOME DA INSTITUIÇÃO'}</h4>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{schoolSettings.Endereco || 'Endereço não configurado'}</p>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>CNPJ: {schoolSettings.CNPJ || '00.000.000/0000-00'} | Tel: {schoolSettings.Telefone || '(00) 00000-0000'}</p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.gridForm}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Nome da Escola (Fantasia) *</label>
                        <input
                          type="text"
                          className={styles.input}
                          required
                          value={schoolSettings.Nome || ''}
                          onChange={(e) => setSchoolSettings({ ...schoolSettings, Nome: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Razão Social</label>
                        <input
                          type="text"
                          className={styles.input}
                          value={schoolSettings.Razao_Social || ''}
                          onChange={(e) => setSchoolSettings({ ...schoolSettings, Razao_Social: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>CNPJ</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="00.000.000/0000-00"
                          value={schoolSettings.CNPJ || ''}
                          onChange={(e) => setSchoolSettings({ ...schoolSettings, CNPJ: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Telefone de Contato</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="(00) 00000-0000"
                          value={schoolSettings.Telefone || ''}
                          onChange={(e) => setSchoolSettings({ ...schoolSettings, Telefone: e.target.value })}
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.label}>Endereço Completo</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Rua, Número, Bairro, Cidade - UF"
                          value={schoolSettings.Endereco || ''}
                          onChange={(e) => setSchoolSettings({ ...schoolSettings, Endereco: e.target.value })}
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.label}>URL da Logomarca (PNG/JPG)</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            className={styles.input}
                            style={{ flex: 1 }}
                            placeholder="https://sua-escola.com/logo.png"
                            value={schoolSettings.Logo || ''}
                            onChange={(e) => setSchoolSettings({ ...schoolSettings, Logo: e.target.value })}
                          />
                          {schoolSettings.Logo && (
                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                              <img src={schoolSettings.Logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.actions} style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                      <button type="submit" className={styles.btnPrimary} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Dados da Unidade'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando dados da unidade...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mantendo os modais existentes */}
        {isAddingUser && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.cardTitle}>{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button className={styles.btnIcon} onClick={() => { setIsAddingUser(false); setEditingUserId(null); }}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <form className={styles.gridForm} onSubmit={handleSaveUser}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nome Completo *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: João Silva"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>E-mail *</label>
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="joao@escola.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo de Acesso *</label>
                    <select
                      className={styles.select}
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    >
                      {isGlobalAdmin && <option value="Administrador">Administrador Global</option>}
                      <option value="Gestor">Diretor / Coordenador</option>
                      <option value="Profissional">Profissional / Professor</option>
                      <option value="Tutor">Tutor / Auxiliar</option>
                      <option value="Família">Família / Responsável</option>
                    </select>
                  </div>
                  {isGlobalAdmin && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Plano do Usuário</label>
                      <select
                        className={styles.input}
                        value={formData.plano_id}
                        onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
                      >
                        <option value="">Selecione um plano...</option>
                        {plans.map(p => (
                          <option key={p.plano_id} value={p.plano_id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isGlobalAdmin && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Unidade Escolar</label>
                      <select
                        className={styles.input}
                        value={formData.escola_id}
                        onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                      >
                        <option value="">Plataforma Global (Sem Unidade)</option>
                        {schools.map(s => (
                          <option key={s.Escola_ID} value={s.Escola_ID}>{s.Nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Senha Inicial *</label>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="••••••••"
                      required
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull} ${styles.actions}`}>
                    <button type="button" className={styles.btnSec} onClick={() => setIsAddingUser(false)}>Descartar</button>
                    <button type="submit" className={styles.btnPrimary} disabled={loading}>
                      {loading ? 'Salvando...' : 'Finalizar Cadastro'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isAddingPlan && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.cardTitle}>{editingPlanId ? 'Editar Plano SaaS' : 'Novo Plano SaaS'}</h3>
                <button className={styles.btnIcon} onClick={() => { setIsAddingPlan(false); setEditingPlanId(null); }}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <form className={styles.gridForm} onSubmit={handleSavePlan}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nome do Plano *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: 5 Alunos"
                      required
                      value={planData.nome}
                      onChange={(e) => setPlanData({ ...planData, nome: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Quantidade de Alunos *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: 5"
                      required
                      value={planData.qtdAlunos}
                      onChange={(e) => setPlanData({ ...planData, qtdAlunos: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Valor Mensal (R$) *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: 125,00"
                      required
                      value={planData.valorMensal}
                      onChange={(e) => setPlanData({ ...planData, valorMensal: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Valor Onboarding (R$)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="3497,00"
                      value={planData.valorOnboarding}
                      onChange={(e) => setPlanData({ ...planData, valorOnboarding: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Valor Unitário (R$)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: 25,00"
                      value={planData.valorUnitario}
                      onChange={(e) => setPlanData({ ...planData, valorUnitario: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Valor por Aluno Excedente (R$)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ex: 23,00"
                      value={planData.valorExcedente}
                      onChange={(e) => setPlanData({ ...planData, valorExcedente: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <div className={styles.configItem} style={{ borderBottom: 'none', padding: '1rem 0' }}>
                      <div className={styles.configInfo}>
                        <span className={styles.configTitle}>Plano Ativo</span>
                        <span className={styles.configDesc}>Este plano ficará disponível para novas contratações no ecossistema.</span>
                      </div>
                      <div className={`${styles.toggle} ${planData.ativo ? styles.toggleActive : ''}`} onClick={() => setPlanData({ ...planData, ativo: !planData.ativo })}>
                        <div className={`${styles.toggleCircle} ${planData.ativo ? styles.toggleCircleActive : ''}`} />
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.formGroup} ${styles.formGroupFull} ${styles.actions}`}>
                    <button type="button" className={styles.btnSec} onClick={() => setIsAddingPlan(false)}>Cancelar</button>
                    <button type="submit" className={styles.btnPrimary} disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Plano'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
