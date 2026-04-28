import { useState, useEffect } from 'react';
import { Search, Plus, X, Building2, MapPin, Phone, GraduationCap, Loader2, Trash2, Edit2 } from 'lucide-react';
import { schoolsService, SchoolData } from '@/lib/schoolsService';
import { useAuth } from '@/lib/useAuth';

export const SchoolsTab = ({ onUpdate }: { onUpdate?: () => void }) => {
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
    const [formData, setFormData] = useState<Partial<SchoolData>>({
        nome: '',
        cnpj: '',
        telefone: '',
        endereco: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await schoolsService.getAll(user?.plataforma_id);
            setSchools(data || []);
        } catch (error) {
            console.error('Erro ao buscar escolas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.plataforma_id) fetchData();
    }, [user?.plataforma_id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome) return alert('Nome é obrigatório');
        
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                plataforma_id: user?.plataforma_id,
                status: 'Ativo'
            } as any;

            if (editingSchool?.id) {
                await schoolsService.update(editingSchool.id, payload);
            } else {
                await schoolsService.create(payload);
            }
            
            await fetchData();
            if (onUpdate) onUpdate();
            setIsCreating(false);
            setEditingSchool(null);
            setFormData({ nome: '', cnpj: '', telefone: '', endereco: '' });
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Deseja realmente excluir a escola ${name}?`)) return;
        try {
            await schoolsService.delete(id);
            await fetchData();
            if (onUpdate) onUpdate();
        } catch (error: any) {
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const handleEdit = (school: SchoolData) => {
        setEditingSchool(school);
        setFormData({
            nome: school.nome,
            cnpj: school.cnpj,
            telefone: school.telefone,
            endereco: school.endereco
        });
        setIsCreating(true);
    };

    const filteredSchools = schools.filter(s => 
        (s.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cnpj || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isCreating) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">
                            {editingSchool ? 'Editar' : 'Nova'} <span className="text-primary">Unidade Escolar</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-500">Registre uma nova instituição no sistema</p>
                    </div>
                    <button onClick={() => { setIsCreating(false); setEditingSchool(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Instituição</label>
                        <input 
                            type="text" 
                            required
                            value={formData.nome || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Ex: Escola Municipal Paulo Freire" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ / Identificador</label>
                        <input 
                            type="text" 
                            value={formData.cnpj || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="00.000.000/0000-00" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                        <input 
                            type="tel" 
                            value={formData.telefone || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="(00) 0000-0000" 
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                        <input 
                            type="text" 
                            value={formData.endereco || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none" 
                            placeholder="Rua, Número, Bairro, Cidade - UF" 
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 md:col-span-2">
                        <button type="button" onClick={() => { setIsCreating(false); setEditingSchool(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Descartar</button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Unidade'}
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
                        placeholder="Pesquisar unidades..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-bold"
                    />
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-blue-500/10"
                >
                    <Plus size={18} strokeWidth={3} />
                    Adicionar Escola
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Escolas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSchools.map((school, i) => (
                        <div key={school.id || i} className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent hover:border-primary/20 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Building2 size={80} />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                        <Building2 className="text-primary" size={28} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(school)} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(school.id!, school.nome)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{school.nome}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 mt-1 font-medium text-xs">
                                        <MapPin size={14} />
                                        {school.endereco || 'Endereço não informado'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <GraduationCap size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase">CNPJ: {school.cnpj?.slice(0, 5) || 'S/N'}...</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <Phone size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{school.telefone || 'Sem contato'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredSchools.length === 0 && (
                        <div className="lg:col-span-2 py-20 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma unidade escolar encontrada</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
