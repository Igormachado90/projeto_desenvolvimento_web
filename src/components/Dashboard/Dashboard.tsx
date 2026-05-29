import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  BarChart3, Users, FileText, Settings, Bell, Search, 
  Moon, Sun, GraduationCap, ArrowRight, BookOpen, 
  Rocket, LogOut, CheckCircle, MoreHorizontal, PlusCircle,
  Briefcase, AlertCircle, TrendingUp, X, Activity,
  Clock, Shield
} from 'lucide-react';
import styles from './Dashboard.module.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';
import { SearchModal } from './SearchModal';
import logo from '../../assets/images/dark.png';
import logoSecundaria from '../../assets/images/logo_segundaria.png';

// Lazy loading views
const StudentsView = lazy(() => import('./Students/StudentsView').then(m => ({ default: m.StudentsView })));
const AdminView = lazy(() => import('./Admin/AdminView').then(m => ({ default: m.AdminView })));
const ManagementView = lazy(() => import('./Management/ManagementView').then(m => ({ default: m.ManagementView })));
const DisciplineView = lazy(() => import('./Discipline/DisciplineView').then(m => ({ default: m.DisciplineView })));
const ReportsView = lazy(() => import('./Reports/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./Settings/SettingsView').then(m => ({ default: m.SettingsView })));
const HelpCenter = lazy(() => import('./HelpCenter').then(m => ({ default: m.HelpCenter })));

type ViewState = 'dashboard' | 'students' | 'admin' | 'management' | 'discipline' | 'reports' | 'settings' | 'help';

interface DashboardStats {
  alunosTotal: number;
  alunosAtivos: number;
  alunosObservacao: number;
  PEIsGerados: number;
  PEIsConcluidos: number;
  profissionaisAtivos: number;
  escolasParceiras: number;
  turmasAtivas: number;
  atendimentosHoje: number;
  taxaAtividade: number;
  mediaAlunosTurma: number;
  pendencias: number;
}

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const MetricCard = ({ icon: Icon, label, value, tag, color = '#3b82f6' }: any) => (
  <div className={styles.metricCardRef}>
    <div className={styles.cardTopRow}>
      <div className={styles.miniIconBoxLight} style={{ color }}>
        <Icon size={18} />
      </div>
      <span className={styles.cardTagRef}>{tag}</span>
    </div>
    <div className={styles.cardBodyRef}>
      <span className={styles.cardLabelRef}>{label}</span>
      <span className={styles.cardValueRef}>{value < 10 && typeof value === 'number' ? `0${value}` : value}</span>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ user: authUser, onLogout }) => {
  const { user: profile, permissions, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [isDarkMode]);
  
  const [realStats, setRealStats] = useState<DashboardStats>({
    alunosTotal: 0,
    alunosAtivos: 0,
    alunosObservacao: 0,
    PEIsGerados: 0,
    PEIsConcluidos: 0,
    profissionaisAtivos: 0,
    escolasParceiras: 0,
    turmasAtivas: 0,
    atendimentosHoje: 0,
    taxaAtividade: 0,
    mediaAlunosTurma: 0,
    pendencias: 0
  });

  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentPendencies, setRecentPendencies] = useState<any[]>([]);

  async function fetchStats() {
    const activeUser = profile || authUser;
    const pid = activeUser?.plataforma_id !== undefined ? activeUser.plataforma_id : activeUser?.Plataforma_ID;
    const eid = activeUser?.escola_id !== undefined ? activeUser.escola_id : activeUser?.Escola_ID;
    
    if (pid === undefined || pid === null) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = (table: string) => {
        let builder = supabase.from(table).select('*', { count: 'exact', head: true }).eq('Plataforma_ID', pid);
        if (eid && !activeUser.tipo?.toUpperCase().includes('ADMIN')) {
          builder = builder.eq('Escola_ID', eid);
        }
        return builder;
      };

      const [rTot, rAti, rObs, rPei, rCon, rPro, rEsc, rTur, rAco, rPen] = await Promise.all([
        q('Alunos'),
        q('Alunos').ilike('Status', 'Ativo'),
        q('Alunos').ilike('Status', 'Observação'),
        q('PEIs'),
        q('PEIs').eq('Status', 'Concluído'),
        q('Professores'),
        supabase.from('Escolas').select('*', { count: 'exact', head: true }).eq('Plataforma_ID', pid),
        q('Turmas'),
        q('Acompanhamentos').gte('created_at', today.toISOString()),
        q('PEIs').neq('Status', 'Concluído')
      ]);

      setRealStats({
        alunosTotal: rTot.count || 0,
        alunosAtivos: rAti.count || 0,
        alunosObservacao: rObs.count || 0,
        PEIsGerados: rPei.count || 0,
        PEIsConcluidos: rCon.count || 0,
        profissionaisAtivos: rPro.count || 0,
        escolasParceiras: rEsc.count || 0,
        turmasAtivas: rTur.count || 0,
        atendimentosHoje: rAco.count || 0,
        taxaAtividade: rTot.count ? Math.round(((rAti.count || 0) / rTot.count) * 100) : 0,
        mediaAlunosTurma: rTur.count ? Number(((rTot.count || 0) / rTur.count).toFixed(1)) : 0,
        pendencias: rPen.count || 0
      });

      const { data: pendData } = await supabase
        .from('PEIs')
        .select('*, Alunos(Nome)')
        .eq('Plataforma_ID', pid)
        .neq('Status', 'Concluído')
        .order('PEI_ID', { ascending: false })
        .limit(3);
      
      if (pendData) setRecentPendencies(pendData);

    } catch (error) {
      console.error('Erro crítico na captura de dados do Hub:', error);
    }
  }

  async function fetchRecentData() {
    const activeUser = profile || authUser;
    const pid = activeUser?.plataforma_id || activeUser?.Plataforma_ID;
    if (!pid) return;
    
    try {
      const { data } = await supabase
        .from('Alunos')
        .select('*')
        .eq('Plataforma_ID', pid)
        .order('Aluno_ID', { ascending: false })
        .limit(4);
      if (data) setRecentStudents(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (profile || authUser) {
      fetchStats();
      fetchRecentData();
    }
  }, [profile, authUser]);

  async function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut();
      onLogout();
    }
  }

  function DashboardContent() {
    return (
      <div className={styles.dashboardContent}>
        <div className={styles.metricsRow}>
          <MetricCard icon={Users} label="ALUNOS ATIVOS" value={realStats.alunosAtivos} tag="Total" />
          <MetricCard 
            icon={FileText} 
            label="PEIs CONCLUÍDOS" 
            value={realStats.PEIsConcluidos} 
            tag={`${realStats.PEIsGerados > 0 ? Math.round((realStats.PEIsConcluidos / realStats.PEIsGerados) * 100) : 0}% do total`} 
            color="#10b981" 
          />
          <MetricCard icon={Clock} label="ATENDIMENTOS HOJE" value={realStats.atendimentosHoje} tag="Hoje" color="#8b5cf6" />
          <MetricCard icon={BarChart3} label="MÉDIA ALUNOS/TURMA" value={realStats.mediaAlunosTurma} tag="Estável" color="#f59e0b" />
          <MetricCard icon={TrendingUp} label="TAXA DE ATIVOS" value={`${realStats.taxaAtividade}%`} tag={`${realStats.alunosAtivos}/${realStats.alunosTotal} Alunos`} color="#3b82f6" />
          <MetricCard icon={Bell} label="PENDÊNCIA" value={realStats.pendencias} tag="Atenção" color="#ef4444" />
        </div>

        <div className={styles.welcomeCardMain}>
          <div className={styles.welcomeText}>
            <span className={styles.welSub}>Seja bem vindo</span>
            <h2 className={styles.welTitle}>Olá, {profile?.nome || authUser?.nome || 'Gestor'}!</h2>
            <p className={styles.welDesc}>
              Seu ecossistema de acompanhamento para alunos com TEA está atualizado. Explore os dados recentes e otimize seus planos educacionais agora mesmo.
            </p>
            <button className={styles.welBtn} onClick={() => setActiveView('students')}>
              <span>GERENCIAR ALUNOS</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className={styles.mainGridReference}>
          <div className={styles.atividadesCard}>
            <div className={styles.cardHeaderRef}>
              <h3 className={styles.cardTitleRef}>
                <Clock size={18} className={styles.cardTitleIcon} style={{ color: '#435ebe' }} />
                <span>Atividades Pendentes</span>
              </h3>
            </div>
            <div className={styles.atividadesContent}>
              {recentPendencies.length > 0 ? (
                <div className={styles.pendListReal}>
                  {recentPendencies.map((p, i) => (
                    <div key={i} className={styles.pendItemReal}>
                      <div className={styles.pendInfoReal}>
                        <span className={styles.pendStudent}>{p.Alunos?.Nome || 'Aluno'}</span>
                        <span className={styles.pendStatus}>Status: {p.Status}</span>
                      </div>
                      <ArrowRight size={16} className={styles.pendArrow} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>Nenhuma atividade pendente.</p>
              )}
            </div>
          </div>

          <div className={styles.statusAlunosCard}>
            <div className={styles.cardHeaderRef}>
              <h3 className={styles.cardTitleRef}>
                <Activity size={18} className={styles.cardTitleIcon} style={{ color: '#004183' }} />
                <span>Status dos Alunos</span>
              </h3>
            </div>
            <div className={styles.statusContent}>
              <div className={styles.statusMainCircle}>
                <svg className={styles.circleSvg} viewBox="0 0 120 120">
                  {/* Track Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className={styles.circleTrack}
                  />
                  {/* Active Students Progress (Green) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className={styles.circleProgressActive}
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - (realStats.alunosTotal > 0 ? realStats.alunosAtivos / realStats.alunosTotal : 0))}
                  />
                  {/* Observation Students Progress (Yellow) */}
                  {realStats.alunosTotal > 0 && realStats.alunosObservacao > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className={styles.circleProgressObs}
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - realStats.alunosObservacao / realStats.alunosTotal)}
                      transform={`rotate(${(realStats.alunosAtivos / realStats.alunosTotal) * 360 - 90} 60 60)`}
                    />
                  )}
                </svg>
                <div className={styles.circleValue}>
                  <span className={styles.circleNum}>{realStats.alunosTotal}</span>
                  <span className={styles.circleLabel}>TOTAL</span>
                </div>
              </div>
              <div className={styles.statusMetricsGrid}>
                <div className={styles.statusMetricItem}>
                  <div className={styles.statusIconBox} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <CheckCircle size={14} />
                  </div>
                  <div className={styles.statusInfoBox}>
                    <span className={styles.statusLabel}>Ativos</span>
                    <span className={styles.statusValue}>{realStats.alunosAtivos}</span>
                  </div>
                </div>
                <div className={styles.statusMetricItem}>
                  <div className={styles.statusIconBox} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Activity size={14} />
                  </div>
                  <div className={styles.statusInfoBox}>
                    <span className={styles.statusLabel}>Observação</span>
                    <span className={styles.statusValue}>{realStats.alunosObservacao}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: BarChart3 },
    ...(permissions?.canViewStudents ? [{ id: 'students', label: 'Gestão de Alunos', icon: GraduationCap }] : []),
    ...(permissions?.canViewGerenciamento ? [{ id: 'management', label: 'Gestão Escolar', icon: Briefcase }] : []),
    ...(permissions?.canViewDisciplines ? [{ id: 'discipline', label: 'Disciplinas', icon: BookOpen }] : []),
    ...(permissions?.canViewReports ? [{ id: 'reports', label: 'Relatórios', icon: FileText }] : []),
    { id: 'help', label: 'Central de Ajuda', icon: Rocket },
    ...(permissions?.canViewSettings ? [{ id: 'settings', label: 'Ajustes de Perfil', icon: Settings }] : []),
    ...(permissions?.canManageUsers ? [{ id: 'admin', label: 'Painel Administrativo', icon: Shield }] : []),
  ];


  return (
    <div className={`${styles.dashboardWrapper} ${isDarkMode ? styles.dark : ''}`}>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectResult={() => setIsSearchOpen(false)} />

      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <img src={logoSecundaria} alt="VinculoTEA" className={styles.sidebarImg} />
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={`${styles.sidebarItem} ${activeView === item.id ? styles.sidebarItemActive : ''}`}
            >
              <div className={styles.itemIconBox}><item.icon size={18} /></div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarHelp}>
          <div className={styles.helpIcon}><AlertCircle size={20} /></div>
          <p>Documentação</p>
          <span>Acesse o guia do usuário</span>
          <button className={styles.helpBtn} onClick={() => setActiveView('help')}>ABRIR MANUAL</button>
        </div>
      </aside>

      <main className={styles.mainArea}>
        <header className={styles.topBar}>
          <div className={styles.topBreadcrumbs}>
            <span className={styles.bcLabel}>Páginas</span>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcActive}>{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</span>
          </div>

          <div className={styles.topActionGroup}>
            <div className={styles.searchWrap} onClick={() => setIsSearchOpen(true)}>
              <Search size={16} className={styles.searchIcon} />
              <input type="text" placeholder="Pesquisar..." readOnly />
            </div>

            <div className={styles.userSection}>
              <div className={styles.userBadge}>
                <div className={styles.userAvatar}>
                  <Users size={16} />
                </div>
                <div className={styles.userBadgeInfo}>
                  <span className={styles.userName}>{profile?.nome || authUser?.nome || 'Usuário'}</span>
                  <span className={styles.userPlan}>{profile?.tipo || 'Administrador'}</span>
                </div>
              </div>

              <div className={styles.actionDivider} />

              <div className={styles.iconActions}>
                <button className={styles.iconBtn} onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div style={{ position: 'relative' }}>
                  <button className={styles.iconBtn} onClick={() => setShowNotifications(!showNotifications)}>
                    <Bell size={18} />
                    <span className={styles.notifDot} />
                  </button>
                  {showNotifications && (
                    <div className={styles.notifDropdown}>
                      <div className={styles.notifHeader}>Notificações</div>
                      <div className={styles.notifList}>
                        <div className={styles.notifItem}>
                          <div className={styles.notifPoint} />
                          <p>Bem-vindo ao novo Dashboard!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button className={`${styles.iconBtn} ${styles.logoutBtn}`} onClick={handleLogout}>
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className={styles.viewContainer}>
          {activeView === 'dashboard' ? <DashboardContent /> : (
            <Suspense fallback={<div>Carregando...</div>}>
              {activeView === 'students' && <StudentsView />}
              {activeView === 'admin' && <AdminView />}
              {activeView === 'management' && <ManagementView />}
              {activeView === 'discipline' && <DisciplineView />}
              {activeView === 'reports' && <ReportsView />}
              {activeView === 'settings' && <SettingsView />}
              {activeView === 'help' && <HelpCenter />}
            </Suspense>
          )}
        </section>
      </main>
    </div>
  );
};
