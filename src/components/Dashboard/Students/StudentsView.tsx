import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Users, ArrowUpDown, Loader2, Download, X, Edit3, Trash2, MoreVertical } from 'lucide-react';
import { StudentRegistrationWizard } from './wizards/StudentRegistrationWizard';
import { StudentDetailView } from './StudentDetailView';
import { studentService } from '@/lib/studentService';
import { schoolsService } from '@/lib/schoolsService';
import { classesService } from '@/lib/classesService';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { fetchSchoolPDFData, renderModernHeader, renderModernFooter } from '@/lib/pdfUtils';

interface Student {
    id: string;
    nome: string;
    escola: string;
    status: 'Ativo' | 'Inativo';
    responsavel: string;
    foto?: string;
    cid?: string;
    serie: string;
    dataNascimento: string;
    genero: string;
    dataCadastro: string;
    detalhes?: any;
    escola_id: number;
    familia_id: number;
}

interface StudentsViewProps {
    initialModuloFilter?: string;
}

export const StudentsView = ({ initialModuloFilter }: StudentsViewProps) => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [filterSchool, setFilterSchool] = useState('');
    const [filterSerie, setFilterSerie] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterModulo, setFilterModulo] = useState(initialModuloFilter || '');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const [filterTurma, setFilterTurma] = useState('');
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [isEditingDirect, setIsEditingDirect] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const fetchInitialData = async () => {
        try {
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const filterEscolaId = isSuperAdmin ? undefined : authUser?.escola_id;
            const queryPlataforma = authUser?.plataforma_id;

            if (!queryPlataforma) return;

            const [schoolsData, classesData] = await Promise.all([
                schoolsService.getAll(queryPlataforma, filterEscolaId),
                classesService.getAll(queryPlataforma, filterEscolaId)
            ]);
            setSchools(schoolsData || []);
            setAllClasses(classesData || []);

            // Auto-filtro por escola para não administradores
            if (filterEscolaId && schoolsData?.length > 0) {
                const targetSchool = schoolsData.find((s: any) => s.id === filterEscolaId || s.Escola_ID === filterEscolaId);
                if (targetSchool) setFilterSchool(targetSchool.nome || targetSchool.nome);
            }
        } catch (error) {
            console.error('Erro ao buscar dados iniciais:', error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const queryPlataforma = authUser?.plataforma_id;

            if (!queryPlataforma) {
                setStudents([]);
                return;
            }

            const data = await studentService.getAll(
                queryPlataforma,
                isSuperAdmin ? undefined : authUser?.escola_id,
                (authUser?.tipo === 'Família' || authUser?.tipo === 'FAMILIA') ? authUser?.familia_id : undefined
            );
            const studentList = data || [];
            const mappedStudents: Student[] = await Promise.all(studentList.map(async (s: any) => {
                let fotoUrl = s.Foto;
                if (fotoUrl && !fotoUrl.startsWith('http')) {
                    const signedUrl = await studentService.getSignedPhotoUrl(fotoUrl);
                    if (signedUrl) fotoUrl = signedUrl;
                }

                return {
                    id: s.Aluno_ID,
                    nome: s.Nome,
                    escola: s.Escolas?.Nome || 'Não atribuída',
                    status: s.Status as 'Ativo' | 'Inativo',
                    responsavel: s.Familias?.Nome_responsavel || 'Não informado',
                    foto: fotoUrl,
                    cid: s.CID,
                    serie: s.Serie,
                    dataNascimento: s.Data_nascimento,
                    genero: s.Genero === 'M' ? 'Masculino' : s.Genero === 'F' ? 'Feminino' : 'Outro',
                    dataCadastro: s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : 'Hoje',
                    detalhes: s.Detalhes,
                    escola_id: s.Escola_ID,
                    familia_id: s.Familia_ID
                };
            }));
            setStudents(mappedStudents);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchStudents();
            fetchInitialData();
        }
    }, [authLoading, authUser?.plataforma_id, authUser?.escola_id, initialModuloFilter]);

    useEffect(() => {
        if (initialModuloFilter) {
            setFilterModulo(initialModuloFilter);
            setIsAdvancedFiltersOpen(true);
        }
    }, [initialModuloFilter]);

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.responsavel.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.cid || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
        const matchesSchool = !filterSchool || s.escola === filterSchool;
        const matchesSerie = !filterSerie || s.serie === filterSerie;
        const matchesGender = !filterGender || s.genero === filterGender;
        const matchesModulo = !filterModulo || s.detalhes?.modulo === filterModulo;
        const matchesPeriodo = !filterPeriodo || s.detalhes?.periodo === filterPeriodo;
        const matchesTurma = !filterTurma || s.serie === filterTurma;

        return matchesSearch && matchesStatus && matchesSchool && matchesSerie && matchesGender && matchesModulo && matchesPeriodo && matchesTurma;
    });

    const handleExportPDF = async () => {
        if (filteredStudents.length === 0) return;

        // Dynamic Imports
        const jspdf = await import('jspdf');
        const jsPDF = jspdf.jsPDF || (jspdf as any).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        const width = doc.internal.pageSize.width;
        const height = doc.internal.pageSize.height;

        // --- COLORS & STYLE (Executive Professional - Total White) ---
        const colors = {
            primary: [15, 23, 42] as [number, number, number], // Deep Slate (Corporate)
            accent: [37, 99, 235] as [number, number, number], // Tech Blue
            textMain: [30, 41, 59] as [number, number, number], // Slate 800
            textMuted: [100, 116, 139] as [number, number, number], // Slate 500
            border: [226, 232, 240] as [number, number, number], // Slate 200
            white: [255, 255, 255] as [number, number, number],
        };

        // --- DATA DETECTION (Institution Settings) ---
        let targetSchoolId = authUser?.escola_id;
        if (!targetSchoolId && filterSchool) {
            const selectedSchool = schools.find(s => (s.nome || s.Nome) === filterSchool);
            if (selectedSchool) targetSchoolId = selectedSchool.id;
        }

        if (!targetSchoolId && authUser?.plataforma_id) {
            const { data: qSchool } = await supabase
                .from('Escolas')
                .select('Escola_ID')
                .eq('Plataforma_ID', authUser.plataforma_id)
                .limit(1)
                .maybeSingle();
            if (qSchool) targetSchoolId = qSchool.Escola_ID;
        }

        const schoolData = targetSchoolId ? await fetchSchoolPDFData(targetSchoolId) : null;

        // --- RENDER HEADER (Total White) ---
        let cursorY = 10;
        if (schoolData) {
            cursorY = await renderModernHeader(doc, schoolData);
        } else {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.text("VÍNCULOTEA", 14, 25);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
            doc.text("SISTEMA DE GESTÃO MULTIDISCIPLINAR ESPECIALIZADA", 14, 30);
            cursorY = 40;
        }

        // --- REPORT TITLE BAR ---
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(14, cursorY, 4, 10, 'F'); // Focus Bar

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text("Relatório Geral de Alunos", 22, cursorY + 7);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')}`, 22, cursorY + 13);

        cursorY += 25;

        // --- KPI SUMMARY GRID ---
        const totalNum = filteredStudents.length;
        const activeNum = filteredStudents.filter(s => s.status === 'Ativo').length;
        const inactiveNum = filteredStudents.filter(s => s.status === 'Inativo').length;

        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.1);
        doc.roundedRect(14, cursorY, width - 28, 25, 2, 2, 'D');

        // Total
        doc.setFontSize(9);
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("TOTAL DE ALUNOS", 24, cursorY + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(totalNum.toString(), 24, cursorY + 18);

        // Active
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("ATIVOS", 80, cursorY + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94); // Success Green
        doc.text(activeNum.toString(), 80, cursorY + 18);

        // Inactive
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("INATIVOS", 130, cursorY + 8);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68); // Red
        doc.text(inactiveNum.toString(), 130, cursorY + 18);

        cursorY += 35;

        // --- STUDENT LIST TABLE ---
        autoTable(doc, {
            startY: cursorY,
            head: [['NOME COMPLETO', 'SÉRIE', 'RESPONSÁVEL', 'NASCIMENTO', 'CID']],
            body: filteredStudents.map(s => [
                s.nome || '-',
                s.serie || '-',
                s.responsavel || '-',
                s.dataNascimento ? new Date(s.dataNascimento).toLocaleDateString('pt-BR') : '-',
                s.cid || '-'
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: [248, 250, 252],
                textColor: [15, 23, 42],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [51, 65, 85],
                cellPadding: 4
            },
            alternateRowStyles: {
                fillColor: [252, 253, 255]
            },
            margin: { left: 14, right: 14 }
        });

        // --- FOOTER ---
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            if (schoolData) {
                renderModernFooter(doc, schoolData);
            } else {
                doc.setFontSize(7);
                doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
                doc.text("© VínculoTEA - Gestão Multidisciplinar Autista", 14, height - 10);
                doc.text(`Página ${i} de ${pageCount}`, width - 14, height - 10, { align: 'right' });
            }
        }

        doc.save(`Relatorio_Alunos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleOpenWizard = () => {
        // Obter limite do plano
        const ALUNO_LIMIT = authUser?.tipo === 'Administrador' ? 99999 : (authUser?.limite_alunos || 100);

        if (students.length >= ALUNO_LIMIT) {
            alert(`⚠️ Limite do Plano Atingido: Seu plano atual permite até ${ALUNO_LIMIT} alunos. Para cadastrar mais, por favor realize o upgrade da sua conta.`);
            return;
        }
        setIsRegistering(true);
    };

    const handleDeleteDirect = async (s: Student) => {
        if (confirm(`Tem certeza que deseja excluir o prontuário de ${s.nome}?`)) {
            try {
                await studentService.delete(s.id);
                alert('Aluno excluído!');
                fetchStudents();
            } catch (e) {
                console.error(e);
                alert('Erro ao excluir.');
            }
        }
    };

    if (isRegistering) {
        return (
            <StudentRegistrationWizard
                initialData={{ detalhes: { modulo: initialModuloFilter || '' } }}
                onCancel={() => setIsRegistering(false)}
                onComplete={() => {
                    setIsRegistering(false);
                    fetchStudents();
                }}
            />
        );
    }

    if (selectedStudent) {
        return <StudentDetailView
            student={selectedStudent}
            onBack={(refresh) => {
                setSelectedStudent(null);
                if (refresh) fetchStudents();
            }}
        />;
    }

    if (isEditingDirect && editingStudent) {
        return (
            <StudentRegistrationWizard
                initialData={editingStudent}
                onCancel={() => {
                    setIsEditingDirect(false);
                    setEditingStudent(null);
                }}
                onComplete={() => {
                    setIsEditingDirect(false);
                    setEditingStudent(null);
                    fetchStudents();
                }}
            />
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20">
            {/* 1. Hero Header - Design Dashboard Style */}
            <div className="bg-white dark:bg-slate-800 rounded-[35px] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="relative z-10 text-center md:text-left">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Módulo de Gestão</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                        {initialModuloFilter === 'Pré-escola' ? 'Educação ' : 'Gestão de '}
                        <span className="text-primary italic">{initialModuloFilter === 'Pré-escola' ? 'Infantil' : 'Alunos'}</span>
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="flex flex-col">
                            <span className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary border border-primary/10 rounded-xl text-[11px] font-black uppercase tracking-widest">
                                <Users size={14} strokeWidth={3} />
                                {students.length} / {authUser?.tipo === 'Administrador' ? '∞' : (authUser?.limite_alunos || 100)} Alunos
                            </span>
                        </div>

                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
                    <button
                        onClick={handleExportPDF}
                        disabled={filteredStudents.length === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 hover:bg-white hover:border-primary transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        <Download size={18} className="text-primary" />
                        Exportar Relatório
                    </button>
                    <button
                        onClick={() => {
                            // Secondary fallback
                            handleOpenWizard();
                        }}
                        disabled={authUser?.tipo !== 'Administrador' && students.length >= (authUser?.limite_alunos || 1)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all group border-none ${
                            (authUser?.tipo !== 'Administrador' && students.length >= (authUser?.limite_alunos || 1))
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-xl shadow-blue-900/20 hover:scale-[1.05] active:scale-[0.98] cursor-pointer'
                        }`}
                    >
                        <Plus size={20} strokeWidth={3} className={!(authUser?.tipo !== 'Administrador' && students.length >= (authUser?.limite_alunos || 1)) ? "group-hover:rotate-90 transition-transform" : ""} />
                        Novo Cadastro
                    </button>
                </div>
                
                {/* Background Decoration */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* 2. Search & Filters Bar */}
            <div className="bg-white dark:bg-slate-800/80 p-8 rounded-[35px] border border-slate-100 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex-1 w-full relative group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Pesquisar na base de dados</label>
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nome, responsável ou diagnóstico..."
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-14 pr-4 text-sm font-bold dark:text-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-72">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Status de Matrícula</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            {['Todos', 'Ativo', 'Inativo'].map((st: any) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    data-active={statusFilter === st}
                                    className="flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:text-primary data-[active=true]:bg-white dark:data-[active=true]:bg-slate-800 data-[active=true]:text-primary data-[active=true]:shadow-md"
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAdvancedFiltersOpen(true)}
                        className={`h-[60px] px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all border-2 ${filterSchool || filterSerie || filterGender || filterModulo || filterPeriodo || filterTurma
                            ? 'bg-primary/5 border-primary/30 text-primary'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <Filter size={18} />
                        {filterSchool || filterSerie || filterGender || filterModulo || filterPeriodo || filterTurma ? 'Filtros Ativos' : 'Refinar Busca'}
                    </button>
                </div>

                {isAdvancedFiltersOpen && (
                    <div className="absolute top-full left-0 right-0 mt-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-2xl p-8 max-w-2xl mx-auto ring-4 ring-black/5">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary font-normal">
                                        <Filter size={18} />
                                    </div>
                                    Filtros Avançados
                                </h3>
                                <button onClick={() => setIsAdvancedFiltersOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Escola</label>
                                    <select
                                        value={filterSchool}
                                        onChange={(e) => setFilterSchool(e.target.value)}
                                        disabled={!!(authUser?.escola_id && authUser?.tipo !== 'Administrador')}
                                        className={`w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 rounded-xl py-3 px-4 text-sm font-bold dark:text-white outline-none ${authUser?.escola_id && authUser?.tipo !== 'Administrador' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {!authUser?.escola_id || authUser?.tipo === 'Administrador' ? <option value="">Todas as Escolas</option> : null}
                                        {schools.map(s => <option key={s.id || s.Escola_ID} value={s.nome || s.Nome}>{s.nome || s.Nome}</option>)}
                                    </select>
                                    {authUser?.escola_id && authUser?.tipo !== 'Administrador' && (
                                        <p className="text-[8px] text-slate-400 mt-1 ml-1 font-medium">Vinculado à Unidade: {authUser.escola_nome}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Série / Ciclo</label>
                                    <select
                                        value={filterSerie}
                                        onChange={(e) => setFilterSerie(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 rounded-xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                                    >
                                        <option value="">Todas as Séries</option>
                                        {Array.from(new Set(students.map(s => s.serie))).map(serie => (
                                            <option key={serie} value={serie}>{serie}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
                                    <select
                                        value={filterTurma}
                                        onChange={(e) => setFilterTurma(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 rounded-xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                                    >
                                        <option value="">Todas as Turmas</option>
                                        {allClasses.map(c => <option key={c.id} value={c.nome || c.Nome}>{c.nome || c.Nome}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Módulo</label>
                                    <select
                                        value={filterModulo}
                                        onChange={(e) => setFilterModulo(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 rounded-xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                                    >
                                        <option value="">Todos os Módulos</option>
                                        <option value="Pré-escola">Pré-escola / Infantil</option>
                                        <option value="Fundamental I">Fundamental I</option>
                                        <option value="Fundamental II">Fundamental II</option>
                                        <option value="Ensino Médio">Ensino Médio</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Período (Turno)</label>
                                    <select
                                        value={filterPeriodo}
                                        onChange={(e) => setFilterPeriodo(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 rounded-xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                                    >
                                        <option value="">Todos os Turnos</option>
                                        <option value="Matutino">Matutino</option>
                                        <option value="Vespertino">Vespertino</option>
                                        <option value="Integral">Integral</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                                    <select
                                        value={filterGender}
                                        onChange={(e) => setFilterGender(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-primary/20 rounded-xl py-3 px-4 text-sm font-bold dark:text-white outline-none"
                                    >
                                        <option value="">Todos</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-10 pt-8 border-t border-slate-100 dark:border-slate-700/50">
                                <button
                                    onClick={() => {
                                        setFilterSchool('');
                                        setFilterSerie('');
                                        setFilterGender('');
                                        setFilterModulo('');
                                        setFilterPeriodo('');
                                        setFilterTurma('');
                                    }}
                                    className="flex-1 py-3.5 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"
                                >
                                    Limpar Filtros
                                </button>
                                <button
                                    onClick={() => setIsAdvancedFiltersOpen(false)}
                                    className="flex-[2] py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Students Table List */}
            <div className="bg-white dark:bg-slate-800 rounded-[35px] border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 text-left">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                                        Aluno / Identificação <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Instituição</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-5">
                                            <div className="relative">
                                                <Loader2 size={48} className="text-primary animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                                </div>
                                            </div>
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando Ecossistema...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                <tr key={student.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all cursor-pointer" onClick={() => setSelectedStudent(student)}>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="size-16 rounded-[22px] bg-slate-100 dark:bg-slate-900 text-primary font-black text-xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all relative overflow-hidden ring-4 ring-white dark:ring-slate-800">
                                                {student.foto ? (
                                                    <img src={student.foto} alt={student.nome} className="size-full object-cover" />
                                                ) : (
                                                    <span className="opacity-80">{student.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                                                )}
                                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors text-lg leading-tight mb-1">{student.nome}</p>
                                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-primary/5 text-primary rounded-md">{student.serie}</span>
                                                    {student.cid && <span className="text-primary/60 italic">CID: {student.cid}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="max-w-[200px]">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors uppercase tracking-tight">{student.escola}</p>
                                            <p className="text-[10px] text-slate-400 font-semibold tracking-wider">Unidade Escolar</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-300">{student.responsavel}</p>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Responsável Familiar</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${student.status === 'Ativo' 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                                            : 'bg-slate-50 text-slate-400 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800'
                                            }`}>
                                            <div className={`size-1.5 rounded-full ${student.status === 'Ativo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 rounded-[14px] font-black text-[10px] uppercase tracking-[0.1em] border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary hover:bg-white transition-all shadow-sm group-hover:shadow-md active:scale-95"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedStudent(student);
                                                }}
                                            >
                                                Prontuário
                                            </button>
                                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-2" />
                                            <button
                                                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary/30 rounded-xl transition-all active:scale-90"
                                                title="Editar"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingStudent(student);
                                                    setIsEditingDirect(true);
                                                }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all active:scale-90"
                                                title="Excluir"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDirect(student);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Users size={64} strokeWidth={1} />
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Nenhum aluno encontrado no ecossistema.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
