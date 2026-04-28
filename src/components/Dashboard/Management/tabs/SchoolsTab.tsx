import { useState, useEffect } from 'react';
import { Search, Plus, X, Building2, MapPin, Phone, GraduationCap, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { schoolsService } from '@/lib/schoolsService';
import { useAuth } from '@/lib/useAuth';

export const SchoolsTab = ({ onUpdate }: { onUpdate?: () => void }) => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [editingSchool, setEditingSchool] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [schools, setSchools] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [schoolToDelete, setSchoolToDelete] = useState<any>(null);

    const [formData, setFormData] = useState({
        nome: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: 'SP',
        telefone: ''
    });

    const fetchSchools = async () => {
        try {
            setLoadingData(true);
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const queryPlataforma = authUser?.plataforma_id;

            if (!queryPlataforma) {
                setSchools([]);
                return;
            }

            const data = await schoolsService.getAll(
                queryPlataforma,
                isSuperAdmin ? undefined : authUser?.escola_id
            );
            setSchools(data || []);
        } catch (error) {
            console.error('Erro ao buscar escolas:', error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchSchools();
        }
    }, [authLoading, authUser?.plataforma_id, authUser?.escola_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEdit = (school: any) => {
        setEditingSchool(school);
        const [logradouroPart, rest] = (school.endereco || '').split(', ');
        const [numeroPart, rest2] = (rest || '').split(' - ');
        const [bairroPart, rest3] = (rest2 || '').split(', ');
        const [cidadePart, estadoPart] = (rest3 || '').split(' - ');

        setFormData({
            nome: school.nome,
            logradouro: logradouroPart || '',
            numero: numeroPart || '',
            bairro: bairroPart || '',
            cidade: cidadePart || '',
            estado: estadoPart || 'SP',
            telefone: school.telefone || ''
        });
        setIsCreating(true);
    };

    const handleDelete = async () => {
        if (!schoolToDelete) return;
        setIsLoading(true);
        try {
            await schoolsService.delete(schoolToDelete.id);
            await fetchSchools();
            if (onUpdate) onUpdate();
            setSchoolToDelete(null);
        } catch (error: any) {
            alert(`Erro ao excluir escola: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;

            if (editingSchool) {
                await schoolsService.update(editingSchool.id, {
                    nome: formData.nome,
                    telefone: formData.telefone,
                    endereco: fullAddress,
                    plataforma_id: authUser?.plataforma_id
                });
            } else {
                await schoolsService.create({
                    nome: formData.nome,
                    telefone: formData.telefone,
                    endereco: fullAddress,
                    plataforma_id: authUser?.plataforma_id
                });
            }

            await fetchSchools();
            if (onUpdate) onUpdate();
            setIsCreating(false);
            setEditingSchool(null);
            setFormData({
                nome: '',
                logradouro: '',
                numero: '',
                bairro: '',
                cidade: '',
                estado: 'SP',
                telefone: ''
            });
        } catch (error: any) {
            console.error('Erro ao salvar escola:', error);
            alert(`Falha ao salvar a unidade escolar: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSchools = schools.filter(s =>
        (s.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.endereco || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                        placeholder="Pesquisar unidades..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-bold"
                    />
                </div>
                <button
                    onClick={() => {
                        const isSuperAdmin = authUser?.tipo === 'Administrador';
                        const UNIDADE_LIMIT = isSuperAdmin ? 999 : (authUser?.limite_unidades || 1);
                        if (!isSuperAdmin && schools.length >= UNIDADE_LIMIT) {
                            return; // Alert is not strictly necessary if disabled, but kept fallback
                        }
                        setIsCreating(true);
                    }}
                    disabled={authUser?.tipo !== 'Administrador' && schools.length >= (authUser?.limite_unidades || 1)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-none ${
                        (authUser?.tipo !== 'Administrador' && schools.length >= (authUser?.limite_unidades || 1))
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-xl shadow-blue-900/20 hover:scale-[1.05] active:scale-[0.95] cursor-pointer'
                        }`}
                >
                    <Plus size={18} strokeWidth={3} className={!(authUser?.tipo !== 'Administrador' && schools.length >= (authUser?.limite_unidades || 1)) ? "group-hover:rotate-90 transition-transform" : ""} />
                    Adicionar Escola
                </button>
            </div>

            {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Unidades...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSchools.length > 0 ? filteredSchools.map((school, i) => (
                        <div key={i} className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Building2 size={80} />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                        <Building2 className="text-primary" size={28} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(school); }}
                                            className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSchoolToDelete(school); }}
                                            className="p-3 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
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
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Unidade Real</span>
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
                    )) : (
                        <div className="lg:col-span-2 py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhuma unidade encontrada</p>
                        </div>
                    )}
                </div>
            )}

            { }
            {schoolToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="size-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center">Excluir Unidade?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 font-medium">
                            Você está prestes a excluir <b>{schoolToDelete.nome}</b>. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setSchoolToDelete(null)}
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
                                    {editingSchool ? 'Editar' : 'Nova'} <span className="text-primary">Unidade Escolar</span>
                                </h2>
                                <p className="text-xs font-medium text-slate-500">
                                    {editingSchool ? 'Atualize as informações da instituição' : 'Registre uma nova instituição no sistema'}
                                </p>
                            </div>
                            <button onClick={() => { setIsCreating(false); setEditingSchool(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            <div className="space-y-2 md:col-span-6">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Escola *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Digite o nome da escola"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro</label>
                                <input
                                    type="text"
                                    name="logradouro"
                                    value={formData.logradouro}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Rua, Av, etc."
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                <input
                                    type="text"
                                    name="numero"
                                    value={formData.numero}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Nº"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                                <input
                                    type="text"
                                    name="bairro"
                                    value={formData.bairro}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Bairro"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                                <input
                                    type="text"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Cidade"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none"
                                >
                                    <option value="AC">Acre</option>
                                    <option value="AL">Alagoas</option>
                                    <option value="AP">Amapá</option>
                                    <option value="AM">Amazonas</option>
                                    <option value="BA">Bahia</option>
                                    <option value="CE">Ceará</option>
                                    <option value="DF">Distrito Federal</option>
                                    <option value="ES">Espírito Santo</option>
                                    <option value="GO">Goiás</option>
                                    <option value="MA">Maranhão</option>
                                    <option value="MT">Mato Grosso</option>
                                    <option value="MS">Mato Grosso do Sul</option>
                                    <option value="MG">Minas Gerais</option>
                                    <option value="PA">Pará</option>
                                    <option value="PB">Paraíba</option>
                                    <option value="PR">Paraná</option>
                                    <option value="PE">Pernambuco</option>
                                    <option value="PI">Piauí</option>
                                    <option value="RJ">Rio de Janeiro</option>
                                    <option value="RN">Rio Grande do Norte</option>
                                    <option value="RS">Rio Grande do Sul</option>
                                    <option value="RO">Rondônia</option>
                                    <option value="RR">Roraima</option>
                                    <option value="SC">Santa Catarina</option>
                                    <option value="SP">São Paulo</option>
                                    <option value="SE">Sergipe</option>
                                    <option value="TO">Tocantins</option>
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-6">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                                <input
                                    type="tel"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="(00) 0000-0000"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 md:col-span-6 border-t border-slate-50 dark:border-slate-800">
                                <button type="button" onClick={() => { setIsCreating(false); setEditingSchool(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">Descartar</button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Unidade'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
