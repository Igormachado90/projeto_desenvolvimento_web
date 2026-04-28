import { useState, useEffect } from 'react';
import { Search, Plus, X, Mail, Phone, GraduationCap, Loader2, Trash2, Edit2, UserCheck } from 'lucide-react';
import { studentService, ProfessionalData } from '@/lib/studentService';
import { useAuth } from '@/lib/useAuth';

export const TeachersTab = ({ category, onUpdate }: { category?: string, onUpdate?: () => void }) => {
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProf, setEditingProf] = useState<any | null>(null);
    const [formData, setFormData] = useState<Partial<ProfessionalData>>({
        nome: '',
        email: '',
        especialidade: '',
        registro: '',
        telefone: '',
        categoria: category || 'Professor'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await studentService.getAllProfessionals(user?.plataforma_id);
            // Filter by category if provided
            const filtered = category 
                ? data?.filter((p: any) => p.Categoria === category) || []
                : data || [];
            setProfessionals(filtered);
        } catch (error) {
            console.error('Erro ao buscar profissionais:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.plataforma_id) fetchData();
    }, [user?.plataforma_id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome || !formData.email) return alert('Nome e e-mail são obrigatórios');
        
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                plataforma_id: user?.plataforma_id,
            } as any;

            if (editingProf?.Professor_ID) {
                await studentService.updateProfessional(editingProf.Professor_ID, payload);
            } else {
                await studentService.createProfessional(payload);
            }
            
            await fetchData();
            if (onUpdate) onUpdate();
            setIsCreating(false);
            setEditingProf(null);
            setFormData({ nome: '', email: '', especialidade: '', registro: '', telefone: '', categoria: 'Professor' });
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Deseja realmente excluir o profissional ${name}?`)) return;
        try {
            await studentService.deleteProfessional(id);
            await fetchData();
            if (onUpdate) onUpdate();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleEdit = (prof: any) => {
        setEditingProf(prof);
        setFormData({
            nome: prof.Nome,
            email: prof.Email,
            especialidade: prof.Especialidade,
            registro: prof.Registro_Profissional,
            telefone: prof.Telefone,
            categoria: prof.Categoria || 'Professor'
        });
        setIsCreating(true);
    };

    const filteredProfs = professionals.filter(p => 
        (p.Nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.Email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.Especialidade || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isCreating) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">
                            {editingProf ? 'Editar' : 'Novo'} <span className="text-primary">Profissional</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-500">Cadastre um novo especialista na rede</p>
                    </div>
                    <button onClick={() => { setIsCreating(false); setEditingProf(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo *</label>
                        <input 
                            type="text" 
                            required
                            value={formData.nome || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Ex: Dra. Mariana Costa" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail *</label>
                        <input 
                            type="email" 
                            required
                            value={formData.email || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="mariana@clinica.com" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Disciplina / Especialidade</label>
                        <input 
                            type="text"
                            value={formData.especialidade || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, especialidade: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Ex: Psicopedagogia" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Registro (CRP/CRM/CREFITO)</label>
                        <input 
                            type="text" 
                            value={formData.registro || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, registro: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="00/000000" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contato Telefônico</label>
                        <input 
                            type="tel" 
                            value={formData.telefone || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="(00) 00000-0000" 
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 md:col-span-2">
                        <button type="button" onClick={() => { setIsCreating(false); setEditingProf(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Descartar</button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Profissional'}
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
                        placeholder="Pesquisar profissionais..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-bold"
                    />
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-blue-500/10"
                >
                    <Plus size={18} strokeWidth={3} />
                    Novo Profissional
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Especialistas...</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-[2rem] border-[1.5px] border-slate-100 dark:border-slate-800">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialista</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Área de Atuação</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredProfs.length > 0 ? filteredProfs.map((prof, i) => (
                                <tr key={prof.Professor_ID || i} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs overflow-hidden">
                                                {prof.Usuarios?.Foto ? (
                                                    <img src={prof.Usuarios.Foto} className="size-full object-cover" />
                                                ) : (
                                                    <UserCheck size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{prof.Nome}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                    <Mail size={10} /> {prof.Email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap size={14} className="text-slate-300" />
                                            <span className="font-bold text-slate-600 dark:text-slate-400">{prof.Especialidade || 'Professor'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(prof)} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(prof.Professor_ID, prof.Nome)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum profissional encontrado</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
