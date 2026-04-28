import { useState, useEffect } from 'react';
import { Search, Plus, X, Users, Building, Loader2, ArrowRight, BookOpen, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { classesService } from '@/lib/classesService';
import { schoolsService } from '@/lib/schoolsService';
import { useAuth } from '@/lib/useAuth';

export const ClassesTab = ({ onUpdate }: { onUpdate?: () => void }) => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [classToDelete, setClassToDelete] = useState<any>(null);

    const [formData, setFormData] = useState({
        nome: '',
        serie: '',
        turno: 'Manhã',
        escola_id: ''
    });

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const filterEscolaId = isSuperAdmin ? undefined : authUser?.escola_id;
            const queryPlataforma = authUser?.plataforma_id;

            if (!queryPlataforma) {
                setClasses([]);
                setSchools([]);
                return;
            }

            const [classesData, schoolsData] = await Promise.all([
                classesService.getAll(queryPlataforma, filterEscolaId),
                schoolsService.getAll(queryPlataforma, filterEscolaId)
            ]);
            setClasses(classesData || []);
            setSchools(schoolsData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [authLoading, authUser?.plataforma_id, authUser?.escola_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEdit = (cls: any) => {
        setEditingClass(cls);
        const [nomePart, seriePart] = (cls.nome || '').split(' - ');
        setFormData({
            nome: nomePart || '',
            serie: seriePart || '',
            turno: cls.turno || 'Manhã',
            escola_id: cls.escola_id?.toString() || ''
        });
        setIsCreating(true);
    };

    const handleDelete = async () => {
        if (!classToDelete) return;
        setIsLoading(true);
        try {
            await classesService.delete(classToDelete.id);
            await fetchData();
            if (onUpdate) onUpdate();
            setClassToDelete(null);
        } catch (error: any) {
            alert(`Erro ao excluir turma: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const finalName = formData.serie ? `${formData.nome} - ${formData.serie}` : formData.nome;
            const finalEscolaId = authUser?.tipo === 'Administrador'
                ? (formData.escola_id ? parseInt(formData.escola_id) : null)
                : authUser?.escola_id;

            const classData = {
                nome: finalName,
                turno: formData.turno,
                ano_letivo: new Date().getFullYear().toString(),
                escola_id: finalEscolaId,
                plataforma_id: authUser?.plataforma_id
            };

            if (editingClass) {
                await classesService.update(editingClass.id, classData);
            } else {
                await classesService.create(classData);
            }

            await fetchData();
            if (onUpdate) onUpdate();
            setIsCreating(false);
            setEditingClass(null);
            setFormData({
                nome: '',
                serie: '',
                turno: 'Manhã',
                escola_id: ''
            });
        } catch (error: any) {
            console.error('Erro ao salvar turma:', error);
            alert(`Falha ao criar a turma: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClasses = classes.filter(c =>
        (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.escola_nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="relative w-full sm:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar turmas..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-bold"
                    />
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.05] shadow-xl hover:shadow-primary/40 transition-all border-none cursor-pointer"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nova Turma
                </button>
            </div>

            {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Turmas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.length > 0 ? filteredClasses.map((cls, i) => (
                        <div key={i} className="group p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent hover:border-primary/20 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setClassToDelete(cls); }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{cls.nome}</h3>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                                    <Building size={12} /> {cls.escola_nome || 'Unidade Geral'}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${cls.turno === 'Manhã' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {cls.turno}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500">Ciclo {cls.ano_letivo}</span>
                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="md:col-span-2 lg:col-span-3 py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma turma encontrada</p>
                        </div>
                    )}
                </div>
            )}

            { }
            {classToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="size-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center">Excluir Turma?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 font-medium">
                            Você está prestes a excluir a turma <b>{classToDelete.nome}</b>. Esta ação é irreversível.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setClassToDelete(null)}
                                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            { }
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">
                                    {editingClass ? 'Editar' : 'Nova'} <span className="text-primary">Turma</span>
                                </h2>
                                <p className="text-xs font-medium text-slate-500">Organize os alunos em novos agrupamentos vinculados a uma escola</p>
                            </div>
                            <button onClick={() => { setIsCreating(false); setEditingClass(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Turma *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Ex: Turma A, 1º Ano A, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Série/Ano</label>
                                <input
                                    type="text"
                                    name="serie"
                                    value={formData.serie}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Ex: 1º Ano, 2º Ano, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Período *</label>
                                <select
                                    name="turno"
                                    value={formData.turno}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none"
                                >
                                    <option value="Manhã">Manhã</option>
                                    <option value="Tarde">Tarde</option>
                                    <option value="Noite">Noite</option>
                                    <option value="Integral">Integral</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Escola *</label>
                                <select
                                    name="escola_id"
                                    value={formData.escola_id || authUser?.escola_id?.toString() || ''}
                                    onChange={handleChange}
                                    disabled={authUser?.tipo !== 'Administrador'}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none disabled:opacity-75"
                                >
                                    <option value="">Selecione uma escola</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.nome || s.Nome}</option>)}
                                </select>
                                <p className="text-[10px] text-slate-400 font-medium ml-1">
                                    {authUser?.tipo !== 'Administrador' ? 'Vinculado automaticamente à sua unidade.' : 'Selecione a unidade escolar.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 md:col-span-2 border-t border-slate-50 dark:border-slate-800">
                                <button type="button" onClick={() => { setIsCreating(false); setEditingClass(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">Descartar</button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingClass ? 'Salvar Alterações' : 'Criar Turma')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
