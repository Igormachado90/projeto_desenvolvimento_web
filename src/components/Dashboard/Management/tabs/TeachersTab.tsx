import { useState, useEffect } from 'react';
import { Search, Plus, X, Mail, Phone, GraduationCap, Building2, Loader2, CheckCircle2, Lock, Image as ImageIcon, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { studentService } from '@/lib/studentService';
import { schoolsService } from '@/lib/schoolsService';
import { useAuth } from '@/lib/useAuth';

export const TeachersTab = ({ onUpdate, category }: { onUpdate?: () => void; category?: 'Professor' | 'Profissional de Saúde' }) => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [teacherToDelete, setTeacherToDelete] = useState<any>(null);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        escola_id: '',
        avatar: '',
        isAEE: false,
        telefone: '',
        cid: '',
        registro: '',
        categoria: category || 'Professor'
    });

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const filterEscolaId = isSuperAdmin ? undefined : authUser?.escola_id;
            const queryPlataforma = authUser?.plataforma_id;

            if (!queryPlataforma) {
                setTeachers([]);
                setSchools([]);
                return;
            }

            const [teachersData, schoolsData] = await Promise.all([
                studentService.getAllProfessionals(queryPlataforma, filterEscolaId),
                schoolsService.getAll(queryPlataforma, filterEscolaId)
            ]);
            setTeachers(teachersData || []);
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
            // Pre-preencher escola_id se não for admin
            if (authUser?.tipo !== 'Administrador' && authUser?.escola_id) {
                setFormData(prev => ({ ...prev, escola_id: authUser.escola_id!.toString() }));
            }
        }
    }, [authLoading, authUser?.plataforma_id, authUser?.escola_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleEdit = (teacher: any) => {
        setEditingTeacher(teacher);
        setFormData({
            nome: teacher.Nome,
            email: teacher.Email,
            senha: '',
            escola_id: teacher.Escola_ID?.toString() || '',
            avatar: teacher.Usuarios?.Foto || '',
            isAEE: teacher.Especialidade === 'AEE',
            telefone: teacher.Telefone || '',
            cid: teacher.CID || '',
            registro: teacher.Registro_Profissional || '',
            categoria: teacher.Categoria || 'Professor'
        });
        setIsCreating(true);
    };

    const handleDelete = async () => {
        if (!teacherToDelete) return;
        setIsLoading(true);
        try {
            await studentService.deleteProfessional(teacherToDelete.Professor_ID);
            await fetchData();
            if (onUpdate) onUpdate();
            setTeacherToDelete(null);
        } catch (error: any) {
            alert(`Erro ao excluir professor: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const professionalData = {
                nome: formData.nome,
                email: formData.email,
                especialidade: formData.isAEE ? 'AEE' : 'Educação Regular',
                escola_id: formData.escola_id ? parseInt(formData.escola_id) : undefined,
                avatar: formData.avatar,
                telefone: formData.telefone,
                cid: formData.cid,
                registro: formData.registro,
                categoria: formData.categoria,
                plataforma_id: authUser?.plataforma_id
            };

            console.log('Tentando salvar profissional:', professionalData);
            if (editingTeacher) {
                console.log('ID do Professor:', editingTeacher.Professor_ID);
                await studentService.updateProfessional(editingTeacher.Professor_ID, professionalData);
            } else {
                await studentService.createProfessional(professionalData);
            }

            await fetchData();
            if (onUpdate) onUpdate();
            setIsCreating(false);
            setEditingTeacher(null);
            setFormData({ nome: '', email: '', senha: '', escola_id: '', avatar: '', isAEE: false, telefone: '', cid: '', registro: '', categoria: category || 'Professor' });
            alert('Alterações salvas com sucesso!');
        } catch (error: any) {
            console.error('Erro detalhado ao salvar professor:', error);
            alert(`Falha ao salvar o profissional: ${error.message || 'Erro de conexão ou permissão'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = (t.Nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.Especialidade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.Email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !category || t.Categoria === category;

        return matchesSearch && matchesCategory;
    });


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
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.05] shadow-xl hover:shadow-primary/40 transition-all border-none cursor-pointer"
                >
                    <Plus size={18} strokeWidth={3} />
                    Novo Profissional
                </button>
            </div>

            {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Corpo Docente...</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-[2rem] border-[1.5px] border-slate-100 dark:border-slate-800">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Área / Especialidade</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato / Registro</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredTeachers.length > 0 ? filteredTeachers.map((teacher, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs overflow-hidden">
                                                {teacher.Usuarios?.Foto ? <img src={teacher.Usuarios.Foto} className="size-full object-cover" /> : teacher.Nome.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{teacher.Nome}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                    <Mail size={10} /> {teacher.Email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap size={14} className="text-slate-300" />
                                                <span className="font-bold text-slate-600 dark:text-slate-400">{teacher.Especialidade || teacher.Especialidades || 'Não definida'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building2 size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                                    {teacher.Escolas?.Nome || 'Unidade Geral'}
                                                </span>
                                            </div>
                                            {teacher.CID && (
                                                <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-black text-slate-500 inline-block">
                                                    CID: {teacher.CID}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            {teacher.Telefone && (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Phone size={12} />
                                                    <span className="text-xs font-medium">{teacher.Telefone}</span>
                                                </div>
                                            )}
                                            {teacher.Registro_Profissional && (
                                                <div className="text-[10px] font-black text-primary uppercase tracking-tight">
                                                    Reg: {teacher.Registro_Profissional}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(teacher)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setTeacherToDelete(teacher)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum profissional cadastrado</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            { }
            {teacherToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="size-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center">Excluir Professor?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 font-medium">
                            Você está prestes a excluir <b>{teacherToDelete.Nome}</b>. Esta ação removerá o acesso do profissional ao sistema.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setTeacherToDelete(null)}
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
                                    {editingTeacher ? 'Editar' : 'Novo'} <span className="text-primary">Profissional</span>
                                </h2>
                                <p className="text-xs font-medium text-slate-500">
                                    {editingTeacher ? 'Atualize os dados do profissional' : 'Cadastre um novo profissional na rede'}
                                </p>
                            </div>
                            <button onClick={() => { setIsCreating(false); setEditingTeacher(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Nome do profissional."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Categoria *</label>
                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                >
                                    <option value="Professor">Docente (Professor)</option>
                                    <option value="Profissional de Saúde">Especialista (Saúde/Terapia)</option>
                                    <option value="Tutor">Tutor / Assistente</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Email do profissional."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                                <input
                                    type="text"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Registro Profissional</label>
                                <input
                                    type="text"
                                    name="registro"
                                    value={formData.registro}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="CRM, CRP, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CID</label>
                                <input
                                    type="text"
                                    name="cid"
                                    value={formData.cid}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                    placeholder="Opcional."
                                />
                            </div>

                            {!editingTeacher && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha *</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="password"
                                            name="senha"
                                            value={formData.senha}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                            placeholder="Senha de acesso inicial."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Escola *</label>
                                <select
                                    name="escola_id"
                                    value={formData.escola_id || (authUser?.tipo !== 'Administrador' ? authUser?.escola_id : '')}
                                    onChange={handleChange}
                                    required
                                    disabled={authUser?.tipo !== 'Administrador'}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <option value="">Selecione uma escola</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.nome || s.Nome}</option>)}
                                </select>
                                <p className="text-[10px] text-slate-400 font-medium ml-1">
                                    {authUser?.tipo !== 'Administrador' ? 'Vinculado automaticamente à sua unidade.' : 'Selecione a unidade para vincular o profissional.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Avatar</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                        placeholder="Url da imagem ou gif..."
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 flex items-start gap-4 transition-all hover:bg-primary/10">
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        id="isAEE"
                                        name="isAEE"
                                        checked={formData.isAEE}
                                        onChange={handleChange}
                                        className="size-5 rounded-lg border-2 border-primary text-primary focus:ring-primary h-5 w-5"
                                    />
                                </div>
                                <label htmlFor="isAEE" className="cursor-pointer select-none">
                                    <span className="block font-black text-sm text-slate-900 dark:text-white uppercase tracking-tighter">Professor AEE</span>
                                    <span className="block text-xs text-slate-500 font-medium mt-1">Professores AEE são responsáveis por gerenciar os alunos AEE.</span>
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 md:col-span-2 border-t border-slate-50 dark:border-slate-800">
                                <button type="button" onClick={() => { setIsCreating(false); setEditingTeacher(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingTeacher ? 'Salvar Alterações' : 'Criar Profissional')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
