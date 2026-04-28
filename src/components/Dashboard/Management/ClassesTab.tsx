import { useState, useEffect } from 'react';
import { Search, Plus, X, Users, Building, Loader2, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { classesService } from '@/lib/classesService';
import { schoolsService } from '@/lib/schoolsService';
import { useAuth } from '@/lib/useAuth';

export const ClassesTab = ({ onUpdate }: { onUpdate?: () => void }) => {
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingClass, setEditingClass] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        escola_id: '',
        serie: '',
        status: 'Ativo',
        turno: 'Matutino',
        ano_letivo: new Date().getFullYear().toString()
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [classesData, schoolsData] = await Promise.all([
                classesService.getAll(user?.plataforma_id),
                schoolsService.getAll(user?.plataforma_id)
            ]);
            setClasses(classesData || []);
            setSchools(schoolsData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.plataforma_id) fetchData();
    }, [user?.plataforma_id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome || !formData.escola_id) return alert('Nome e Escola são obrigatórios');
        
        setIsSaving(true);
        try {
            const payload = {
                nome: formData.nome,
                escola_id: parseInt(formData.escola_id),
                serie: formData.serie,
                status: formData.status,
                turno: formData.turno,
                ano_letivo: formData.ano_letivo,
                plataforma_id: user?.plataforma_id
            };

            if (editingClass?.Turma_ID) {
                await classesService.update(editingClass.Turma_ID, payload);
            } else {
                await classesService.create(payload);
            }
            
            await fetchData();
            if (onUpdate) onUpdate();
            setIsCreating(false);
            setEditingClass(null);
            setFormData({ 
                nome: '', 
                escola_id: '', 
                serie: '', 
                status: 'Ativo',
                turno: 'Matutino',
                ano_letivo: new Date().getFullYear().toString()
            });
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Deseja realmente excluir a turma ${name}?`)) return;
        try {
            await classesService.delete(id);
            await fetchData();
            if (onUpdate) onUpdate();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleEdit = (cls: any) => {
        setEditingClass(cls);
        setFormData({
            nome: cls.Nome,
            escola_id: cls.Escola_ID.toString(),
            serie: cls.Serie || '',
            status: cls.Status || 'Ativo',
            turno: cls.Turno || 'Matutino',
            ano_letivo: cls.Ano_Letivo || new Date().getFullYear().toString()
        });
        setIsCreating(true);
    };

    const filteredClasses = classes.filter(c => 
        (c.Nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.Escolas?.Nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isCreating) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">
                            {editingClass ? 'Editar' : 'Nova'} <span className="text-primary">Turma</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-500">Organize os alunos em novos agrupamentos</p>
                    </div>
                    <button onClick={() => { setIsCreating(false); setEditingClass(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Identificação da Turma *</label>
                        <input 
                            type="text" 
                            required
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Ex: 5º Ano B - Matutino" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unidade Escolar *</label>
                        <select 
                            required
                            value={formData.escola_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, escola_id: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none"
                        >
                            <option value="">Selecione a escola</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Série / Nível</label>
                        <input 
                            type="text"
                            value={formData.serie}
                            onChange={(e) => setFormData(prev => ({ ...prev, serie: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Ex: 5º Ano" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Turno *</label>
                        <select 
                            required
                            value={formData.turno}
                            onChange={(e) => setFormData(prev => ({ ...prev, turno: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none"
                        >
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                            <option value="Noturno">Noturno</option>
                            <option value="Integral">Integral</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ano Letivo *</label>
                        <input 
                            type="text"
                            required
                            value={formData.ano_letivo}
                            onChange={(e) => setFormData(prev => ({ ...prev, ano_letivo: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Ex: 2024" 
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 md:col-span-2">
                        <button type="button" onClick={() => { setIsCreating(false); setEditingClass(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Descartar</button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Turma'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

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
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-blue-500/10"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nova Turma
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Turmas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((cls, i) => (
                        <div key={cls.Turma_ID || i} className="group p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent hover:border-primary/20 transition-all relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(cls)} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cls.Turma_ID, cls.Nome)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{cls.Nome}</h3>
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                                    <Building size={12} /> {cls.Escolas?.Nome || 'Unidade não informada'}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-slate-500">{cls.Serie || 'Geral'}</span>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                    {filteredClasses.length === 0 && (
                        <div className="lg:col-span-3 py-20 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma turma encontrada</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
