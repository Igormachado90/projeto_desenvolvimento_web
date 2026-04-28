import { useState, useEffect } from 'react';
import { School, GraduationCap, Users, Building2, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { SchoolsTab } from './tabs/SchoolsTab';
import { TeachersTab } from './tabs/TeachersTab';
import { ClassesTab } from './tabs/ClassesTab';
import { schoolsService } from '../../../lib/schoolsService';
import { studentService } from '../../../lib/studentService';
import { classesService } from '../../../lib/classesService';
import { useAuth } from '../../../lib/useAuth';
import styles from './ManagementView.module.css';

type Tab = 'escolas' | 'professores' | 'profissionais' | 'turmas';

export const ManagementView = () => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('escolas');
    const [schoolCount, setSchoolCount] = useState(0);
    const [teacherCount, setTeacherCount] = useState(0);
    const [specialistCount, setSpecialistCount] = useState(0);
    const [classCount, setClassCount] = useState(0);

    const fetchCounts = async () => {
        try {
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const filterEscolaId = isSuperAdmin ? undefined : authUser?.escola_id;
            const queryPlataforma = authUser?.plataforma_id;

            if (!queryPlataforma) return;

            const [schools, allProfessionals, classes] = await Promise.all([
                schoolsService.getAll(queryPlataforma, filterEscolaId),
                studentService.getAllProfessionals(queryPlataforma, filterEscolaId),
                classesService.getAll(queryPlataforma, filterEscolaId)
            ]);

            setSchoolCount(schools?.length || 0);

            const teachers = allProfessionals?.filter((p: any) => p.Categoria === 'Professor') || [];
            const specialists = allProfessionals?.filter((p: any) => p.Categoria === 'Profissional de Saúde') || [];

            setTeacherCount(teachers.length);
            setSpecialistCount(specialists.length);
            setClassCount(classes?.length || 0);
        } catch (error) {
            console.error('Error fetching counts:', error);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchCounts();
        }
    }, [authLoading, authUser?.plataforma_id, authUser?.escola_id]);

    const handleUpdate = () => {
        fetchCounts();
    };

    const tabs = [
        { id: 'escolas' as const, label: 'Unidades', icon: Building2, desc: 'Gerencie suas unidades parceiras' },
        { id: 'professores' as const, label: 'Docentes', icon: GraduationCap, desc: 'Gestão de professores e educadores' },
        { id: 'profissionais' as const, label: 'Especialistas', icon: Users, desc: 'Profissionais de saúde e apoio' },
        { id: 'turmas' as const, label: 'Turmas', icon: BookOpen, desc: 'Controle de turmas e classes' },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20 px-2 sm:px-4">
            {/* 1. Hero Header - Design Dashboard Style */}
            <div className="bg-white dark:bg-slate-800 rounded-[35px] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden mb-10">
                <div className="relative z-10 text-center md:text-left">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Módulo Institucional</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                        Gestão <span className="text-primary italic">Escolar</span>
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="flex flex-col">
                            <span className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary border border-primary/10 rounded-xl text-[11px] font-black uppercase tracking-widest">
                                <Layers size={14} strokeWidth={3} />
                                Visão Administrativa Global
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs font-semibold italic">Controle de unidades, equipes e turmas</p>
                    </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className={styles.metricsRow}>
                <div className={styles.metricCardMini}>
                    <div>
                        <span className={styles.miniLabel}>Unidades</span>
                        <span className={styles.miniValue}>{schoolCount}</span>
                    </div>
                    <div className={styles.miniIconBox} style={{ color: '#4E96E8' }}><Building2 size={20} /></div>
                </div>
                <div className={styles.metricCardMini}>
                    <div>
                        <span className={styles.miniLabel}>Professores</span>
                        <span className={styles.miniValue}>{teacherCount}</span>
                    </div>
                    <div className={styles.miniIconBox} style={{ color: '#B2D47E' }}><GraduationCap size={20} /></div>
                </div>
                <div className={styles.metricCardMini}>
                    <div>
                        <span className={styles.miniLabel}>Especialistas</span>
                        <span className={styles.miniValue}>{specialistCount}</span>
                    </div>
                    <div className={styles.miniIconBox} style={{ color: '#E4B43B' }}><Users size={20} /></div>
                </div>
                <div className={styles.metricCardMini}>
                    <div>
                        <span className={styles.miniLabel}>Turmas Ativas</span>
                        <span className={styles.miniValue}>{classCount}</span>
                    </div>
                    <div className={styles.miniIconBox} style={{ color: '#9AD0EE' }}><BookOpen size={20} /></div>
                </div>
            </div>

            <div className={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? styles.tabIconActive : ''} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.contentCard}>
                <div className={styles.cardInner}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <p className={styles.cardSub}>
                            {tabs.find(t => t.id === activeTab)?.desc}.
                        </p>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeTab === 'escolas' && <SchoolsTab onUpdate={handleUpdate} />}
                        {activeTab === 'professores' && <TeachersTab onUpdate={fetchCounts} category="Professor" />}
                        {activeTab === 'profissionais' && <TeachersTab onUpdate={fetchCounts} category="Profissional de Saúde" />}
                        {activeTab === 'turmas' && <ClassesTab onUpdate={handleUpdate} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
