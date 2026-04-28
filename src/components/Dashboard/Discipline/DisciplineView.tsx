import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, BookOpen, X, Check, Trash2, Edit2, Users, Loader2, AlertCircle, Mail, Phone, GraduationCap } from 'lucide-react';
import { disciplinesService, Discipline } from '@/lib/disciplinesService';
import { studentService } from '@/lib/studentService';
import { useAuth } from '@/lib/useAuth';

export const DisciplineView = () => {
    const { user, loading: authLoading } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTeachersModal, setShowTeachersModal] = useState<Discipline | null>(null);
    const [selectedTeachersIds, setSelectedTeachersIds] = useState<string[]>([]);

    const [isLinkingMode, setIsLinkingMode] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        status: 'Ativo'
    });
    const [linkForm, setLinkForm] = useState({
        professor_id: '',
        student_ids: [] as string[],
        searchStudent: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const isSuperAdmin = user?.tipo === 'Administrador';
            const filterEscolaId = isSuperAdmin ? undefined : user?.escola_id;
            const queryPlataforma = user?.plataforma_id;

            if (!queryPlataforma) {
                setDisciplines([]);
                setTeachers([]);
                setStudents([]);
                return;
            }

            const [discsData, teachersData, studentsData] = await Promise.all([
                disciplinesService.getAll(queryPlataforma),
                studentService.getAllProfessionals(queryPlataforma, filterEscolaId),
                studentService.getAll(queryPlataforma, filterEscolaId)
            ]);
            setDisciplines(discsData || []);
            setTeachers(teachersData || []);
            setStudents(studentsData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [authLoading, user?.plataforma_id, user?.escola_id]);

    const filteredDisciplines = useMemo(() => {
        const query = search.toLowerCase();
        return disciplines.filter(d =>
            d.nome.toLowerCase().includes(query) ||
            (d.descricao?.toLowerCase().includes(query))
        );
    }, [disciplines, search]);

    const handleEdit = (disc: Discipline) => {
        setEditingDiscipline(disc);
        setFormData({
            nome: disc.nome,
            descricao: disc.descricao || '',
            status: disc.status || 'Ativo'
        });
        setSelectedTeachersIds(disc.professores || []);
        setIsCreating(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;
        try {
            await disciplinesService.delete(id);
            fetchData();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir disciplina. Verifique se existem dependências.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSave = {
                ...formData,
                plataforma_id: user?.plataforma_id,
                professores: selectedTeachersIds
            };
            if (editingDiscipline) {
                await disciplinesService.update(editingDiscipline.id, dataToSave);
            } else {
                await disciplinesService.create(dataToSave);
            }
            setIsCreating(false);
            setEditingDiscipline(null);
            setFormData({ nome: '', descricao: '', status: 'Ativo' });
            setSelectedTeachersIds([]);
            fetchData();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar disciplina.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTeacherSelection = (id: string) => {
        setSelectedTeachersIds(prev =>
            prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
        );
    };

    const getTeachersForDiscipline = (disc: Discipline) => {

        const linkedByRecord = teachers.filter(t =>
            disc.professores?.includes(t.Professor_ID?.toString() || t.id)
        );

        if (linkedByRecord.length > 0) return linkedByRecord;


        return teachers.filter(t =>
            t.Especialidade?.toLowerCase().includes(disc.nome.toLowerCase()) ||
            t.Especialidades?.toLowerCase().includes(disc.nome.toLowerCase())
        );
    };

    const handleBulkLink = async () => {
        if (!showTeachersModal) return;
        if (linkForm.student_ids.length === 0) {
            alert('Selecione pelo menos um aluno.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Process links in parallel
            await Promise.all(linkForm.student_ids.map(studentId =>
                studentService.linkStudentDiscipline(
                    studentId,
                    showTeachersModal.id,
                    linkForm.professor_id || undefined,
                    user?.plataforma_id
                )
            ));

            alert(`${linkForm.student_ids.length} alunos vinculados com sucesso!`);
            setIsLinkingMode(false);
            setLinkForm({ professor_id: '', student_ids: [], searchStudent: '' });
        } catch (error) {
            console.error('Erro ao vincular alunos:', error);
            alert('Erro ao realizar o vínculo em massa.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStudentSelection = (id: string) => {
        setLinkForm(prev => ({
            ...prev,
            student_ids: prev.student_ids.includes(id)
                ? prev.student_ids.filter(sid => sid !== id)
                : [...prev.student_ids, id]
        }));
    };

    const filteredStudents = students.filter(s =>
        s.Nome.toLowerCase().includes(linkForm.searchStudent.toLowerCase())
    );



    return (
        <div className="animate-in fade-in duration-700 space-y-10 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Matriz <span className="text-primary italic">Curricular</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                            <div className="size-2 bg-primary rounded-full animate-pulse" />
                            {disciplines.length} Matérias Registradas
                        </p>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Organização por competências</p>
                    </div>
                </div>

                <button
                    onClick={() => { setIsCreating(true); setEditingDiscipline(null); setFormData({ nome: '', descricao: '', status: 'Ativo' }); setSelectedTeachersIds([]); }}
                    className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:scale-[1.05] active:scale-[0.95] transition-all border-none cursor-pointer"
                >
                    <Plus size={22} strokeWidth={3} />
                    Nova Disciplina
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={22} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar por nome ou docente..."
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-[2px] border-transparent focus:border-primary/20 rounded-[1.5rem] py-5 pl-16 pr-6 text-sm font-bold dark:text-white outline-none transition-all shadow-inner font-sans"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Matriz Curricular...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {filteredDisciplines.length > 0 ? filteredDisciplines.map((disc) => {
                        const relatedTeachers = getTeachersForDiscipline(disc);
                        return (
                            <div key={disc.id} className="group bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 relative flex flex-col items-center text-center">
                                <div className={`size-20 rounded-[2rem] ${disc.status === 'Ativo' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all mb-8`}>
                                    <BookOpen size={36} />
                                </div>

                                <div className="absolute top-8 right-8 flex gap-2">
                                    <button onClick={() => handleEdit(disc)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-primary transition-all">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(disc.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter group-hover:text-primary transition-colors italic">{disc.nome}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-10 max-w-[240px] line-clamp-3">
                                    {disc.descricao || 'Sem descrição cadastrada para esta disciplina.'}
                                </p>

                                <div className="w-full pt-8 border-t border-slate-50 dark:border-slate-700 flex flex-col items-center gap-5 mt-auto">
                                    <div className="flex items-center -space-x-4">
                                        {relatedTeachers.slice(0, 3).map((t, i) => (
                                            <div key={i} className="size-10 rounded-2xl bg-white dark:bg-slate-900 border-[3px] border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-xl overflow-hidden" title={t.Nome}>
                                                {t.Usuarios?.Foto ? (
                                                    <img src={t.Usuarios.Foto} className="size-full object-cover" />
                                                ) : (
                                                    <span className="uppercase">{t.Nome?.charAt(0)}</span>
                                                )}
                                            </div>
                                        ))}
                                        {relatedTeachers.length > 3 && (
                                            <div className="size-10 rounded-2xl bg-primary text-white border-[3px] border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black shadow-xl shadow-primary/20 z-10">
                                                +{relatedTeachers.length - 3}
                                            </div>
                                        )}
                                        {relatedTeachers.length === 0 && (
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum docente</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowTeachersModal(disc)}
                                        className="text-[10px] font-black text-slate-400 group-hover:text-primary uppercase tracking-[0.3em] transition-colors flex items-center gap-2"
                                    >
                                        <Users size={14} /> {disc.professores && disc.professores.length > 0 ? 'Ver Docentes' : 'Gerenciar Docentes'}
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 text-center">
                            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Nenhuma disciplina encontrada</p>
                        </div>
                    )}
                </div>
            )}

            { }
            {showTeachersModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Gerenciar <span className="text-primary italic">{showTeachersModal.nome}</span></h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Docentes e Alunos Vinculados</p>
                            </div>
                            <button onClick={() => setShowTeachersModal(null)} className="p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-8 pt-6 pb-2 flex gap-4 shrink-0">
                            <button
                                onClick={() => setIsLinkingMode(false)}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isLinkingMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                Lista de Docentes
                            </button>
                            <button
                                onClick={() => setIsLinkingMode(true)}
                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLinkingMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                Vincular Alunos
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            {!isLinkingMode ? (
                                <div className="space-y-4">
                                    {getTeachersForDiscipline(showTeachersModal).length > 0 ? (
                                        getTeachersForDiscipline(showTeachersModal).map((teacher, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-primary/20 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs overflow-hidden">
                                                        {teacher.Usuarios?.Foto ? (
                                                            <img src={teacher.Usuarios.Foto} className="size-full object-cover" />
                                                        ) : teacher.Nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{teacher.Nome}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                                            <GraduationCap size={10} /> {teacher.Especialidade || teacher.Especialidades}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {teacher.Telefone && (
                                                        <a href={`tel:${teacher.Telefone}`} title="Ligar" className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm">
                                                            <Phone size={14} />
                                                        </a>
                                                    )}
                                                    <a href={`mailto:${teacher.Email}`} title="E-mail" className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm">
                                                        <Mail size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <Users className="mx-auto text-slate-200 mb-4" size={40} />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum docente vinculado a esta especialidade</p>
                                            <p className="text-xs font-medium text-slate-400 mt-2">Os docentes são vinculados automaticamente baseados em suas áreas de atuação.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Professor Responsável</label>
                                        <select
                                            value={linkForm.professor_id}
                                            onChange={e => setLinkForm({ ...linkForm, professor_id: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 px-6 py-4 rounded-2xl font-bold border-2 border-transparent focus:border-primary/20 outline-none transition-all text-sm appearance-none"
                                        >
                                            <option value="">-- Padrão da Disciplina (Todos) --</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.Nome} - {t.Especialidade}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione os Alunos ({linkForm.student_ids.length})</label>
                                            <span className="text-xs text-primary font-bold cursor-pointer hover:underline" onClick={() => setLinkForm(prev => ({ ...prev, student_ids: [] }))}>Limpar seleção</span>
                                        </div>

                                        <div className="relative mb-2">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Buscar aluno..."
                                                value={linkForm.searchStudent}
                                                onChange={e => setLinkForm({ ...linkForm, searchStudent: e.target.value })}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-primary/20"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                                <button
                                                    key={student.Aluno_ID}
                                                    onClick={() => toggleStudentSelection(student.Aluno_ID.toString())}
                                                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${linkForm.student_ids.includes(student.Aluno_ID.toString()) ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-200'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-500 overflow-hidden">
                                                            {student.Foto ? <img src={student.Foto} className="size-full object-cover" /> : student.Nome.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 dark:text-white leading-none mb-1">{student.Nome}</p>
                                                            <p className="text-[8px] font-black uppercase text-slate-400">{student.Serie || 'Série não informada'}</p>
                                                        </div>
                                                    </div>
                                                    {linkForm.student_ids.includes(student.Aluno_ID.toString()) && <Check size={16} className="text-primary" />}
                                                </button>
                                            )) : (
                                                <p className="text-center py-4 text-xs text-slate-400">Nenhum aluno encontrado.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4 shrink-0">
                            {!isLinkingMode ? (
                                <button
                                    onClick={() => {
                                        setShowTeachersModal(null);
                                        // alert('Para adicionar ou editar docentes, utilize a aba "Gestão Administrativa > Professores"');
                                    }}
                                    className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    Fechar
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsLinkingMode(false)}
                                        className="flex-1 py-4 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleBulkLink}
                                        disabled={isSubmitting || linkForm.student_ids.length === 0}
                                        className="flex-[2] py-4 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 border-none cursor-pointer"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} strokeWidth={3} />}
                                        Confirmar Vínculos
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            { }
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">
                                    {editingDiscipline ? 'Editar' : 'Nova'} <span className="text-primary">Disciplina</span>
                                </h2>
                                <p className="text-xs font-medium text-slate-500">{editingDiscipline ? 'Atualize os dados da disciplina' : 'Cadastre uma nova matéria base para a rede de ensino'}</p>
                            </div>
                            <button onClick={() => { setIsCreating(false); setEditingDiscipline(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Disciplina *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        placeholder="Ex: Matemática"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 focus:border-primary/50 rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all dark:text-white"
                                    />
                                </div>

                                <div className="flex items-center pt-8">
                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="peer hidden"
                                                checked={formData.status === 'Ativo'}
                                                onChange={e => setFormData({ ...formData, status: e.target.checked ? 'Ativo' : 'Inativo' })}
                                            />
                                            <div className="size-7 rounded-xl bg-slate-100 dark:bg-slate-900 border-[1.5px] border-slate-200 dark:border-slate-700 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                                <Check size={16} className="text-white scale-0 peer-checked:scale-100 transition-transform" strokeWidth={4} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Disciplina Ativa</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Descrição opcional da disciplina..."
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 focus:border-primary/50 rounded-[2rem] py-4 px-5 text-sm font-bold outline-none transition-all dark:text-white min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professores Registrados na Plataforma</label>
                                    <span className="text-primary font-bold text-[10px] lowercase">{selectedTeachersIds.length} professor(es) selecionado(s)</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                    {teachers.length > 0 ? teachers.map((teacher) => (
                                        <button
                                            type="button"
                                            key={teacher.Professor_ID || teacher.id}
                                            onClick={() => toggleTeacherSelection(teacher.Professor_ID?.toString() || teacher.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-[1.5px] transition-all text-left ${selectedTeachersIds.includes(teacher.Professor_ID?.toString() || teacher.id)
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-200/50 dark:hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedTeachersIds.includes(teacher.Professor_ID?.toString() || teacher.id) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {teacher.Usuarios?.Foto ? (
                                                        <img src={teacher.Usuarios.Foto} className="size-full object-cover" />
                                                    ) : teacher.Nome.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{teacher.Nome}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px]">({teacher.Especialidade || teacher.Especialidades})</p>
                                                </div>
                                            </div>
                                            {selectedTeachersIds.includes(teacher.Professor_ID?.toString() || teacher.id) && (
                                                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white">
                                                    <Check size={14} strokeWidth={4} />
                                                </div>
                                            )}
                                        </button>
                                    )) : (
                                        <div className="col-span-2 py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center gap-2">
                                            <Users className="text-slate-300" size={24} />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nenhum professor registrado na plataforma</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-5">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setEditingDiscipline(null); }}
                                    className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-4 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 border-none cursor-pointer"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingDiscipline ? 'Atualizar Disciplina' : 'Salvar Disciplina')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
