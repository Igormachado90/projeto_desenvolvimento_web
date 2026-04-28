import { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, Mail, Shield, User as UserIcon, Building2, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { userService } from '@/lib/userService';
import { schoolsService } from '@/lib/schoolsService';
import { useAuth } from '@/lib/useAuth';

export const UsersTab = () => {
    const { user: authUser } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState<any>(null);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'Profissional',
        escola_id: '',
        avatar: ''
    });

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const isSuperAdmin = authUser?.tipo === 'Administrador';
            const filterEscolaId = isSuperAdmin ? undefined : authUser?.escola_id;

            const [usersData, schoolsData] = await Promise.all([
                userService.getAll(authUser?.plataforma_id, filterEscolaId),
                schoolsService.getAll(authUser?.plataforma_id, filterEscolaId)
            ]);
            setUsers(usersData || []);
            setSchools(schoolsData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (authUser?.plataforma_id) {
            fetchData();
        }
    }, [authUser?.plataforma_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            nome: user.Nome,
            email: user.Email,
            senha: '',
            role: user.Tipo_Acesso || 'Profissional',
            escola_id: user.Escola_ID?.toString() || '',
            avatar: user.Foto || ''
        });
        setIsCreating(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsLoading(true);
        try {
            await userService.delete(userToDelete.Usuario_ID);
            await fetchData();
            setUserToDelete(null);
        } catch (error: any) {
            alert(`Erro ao excluir usuário: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDAÇÃO MANUAL
        if (!formData.nome || !formData.email || (!editingUser && !formData.senha)) {
            alert('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Senha).');
            return;
        }

        if (!authUser?.plataforma_id) {
            alert('Erro: Identificação da plataforma não encontrada. Tente recarregar a página.');
            return;
        }

        setIsLoading(true);
        try {
            const userData = {
                ...formData,
                escola_id: formData.escola_id ? parseInt(formData.escola_id) : (authUser?.escola_id || undefined),
                plataforma_id: authUser.plataforma_id
            };

            if (editingUser) {
                await userService.update(editingUser.Usuario_ID, userData);
            } else {
                await userService.create(userData);
            }

            await fetchData();
            setIsCreating(false);
            setEditingUser(null);
            setFormData({ nome: '', email: '', senha: '', role: 'Profissional', escola_id: '', avatar: '' });
            alert('Usuário salvo com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            alert(error.message || 'Falha ao salvar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.Nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.Email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.Tipo_Acesso || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isCreating) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">
                            {editingUser ? 'Gerenciar' : 'Novo'} <span className="text-primary">Usuário</span>
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                            {editingUser ? 'Atualize as permissões e dados do usuário' : 'Cadastre um novo membro na plataforma'}
                        </p>
                    </div>
                    <button onClick={() => { setIsCreating(false); setEditingUser(null); }} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-red-50 hover:text-red-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo *</label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                            placeholder="Ex: João Silva"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={!!editingUser}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                            placeholder="joao@escola.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Acesso *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none"
                        >
                            <option value="Profissional">Profissional / Professor</option>
                            <option value="GESTOR">Diretor / Gestor Escolar</option>
                            <option value="Tutor">Tutor / Família</option>
                        </select>
                    </div>

                    {!editingUser && (
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial *</label>
                            <input
                                type="password"
                                name="senha"
                                value={formData.senha}
                                onChange={handleChange}
                                required
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unidade Escolar</label>
                        <select
                            name="escola_id"
                            value={formData.escola_id || authUser?.escola_id || ''}
                            onChange={handleChange}
                            disabled={authUser?.tipo !== 'Administrador'}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="">Selecione uma escola...</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.nome || s.Nome}</option>)}
                        </select>
                        <p className="text-[10px] text-slate-400 font-medium ml-1">
                            {authUser?.tipo !== 'Administrador' ? 'Vinculado automaticamente à sua unidade.' : 'Selecione a unidade escolar.'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 md:col-span-2">
                        <button type="button" onClick={() => { setIsCreating(false); setEditingUser(null); }} className="flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Descartar</button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (editingUser ? 'Salvar Alterações' : 'Finalizar Cadastro')}
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
                        placeholder="Pesquisar por nome ou e-mail..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-bold"
                    />
                </div>
                <button
                    onClick={() => {
                        const isSuperAdmin = authUser?.tipo === 'Administrador';
                        const USER_LIMIT = isSuperAdmin ? 9999 : (authUser?.limite_usuarios || 5);

                        if (!isSuperAdmin && users.length >= USER_LIMIT) {
                            alert(`Seu plano permite apenas ${USER_LIMIT} usuários cadastrados. Para adicionar mais membros à equipe, entre em contato para upgrade.`);
                            return;
                        }
                        setIsCreating(true);
                    }}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 ${(authUser?.tipo !== 'Administrador' && users.length >= (authUser?.limite_usuarios || 5))
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white hover:scale-[1.05] active:scale-[0.95]'
                        }`}
                >
                    <Plus size={18} strokeWidth={3} />
                    Novo Usuário
                </button>
            </div>

            {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Usuários...</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-[2rem] border-[1.5px] border-slate-100 dark:border-slate-800">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissão</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredUsers.length > 0 ? filteredUsers.map((user, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm overflow-hidden">
                                                {user.Foto ? <img src={user.Foto} className="size-full object-cover" /> : <UserIcon size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user.Nome}</p>
                                                <p className="text-xs text-slate-400 font-medium">{user.Email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${user.Tipo_Acesso === 'Administrador' ? 'bg-purple-100 text-purple-600' :
                                            user.Tipo_Acesso === 'Tutor' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {user.Tipo_Acesso}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setUserToDelete(user)}
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
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum usuário encontrado</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            { }
            {userToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="size-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white text-center">Excluir Usuário?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 font-medium">
                            Você está prestes a excluir <b>{userToDelete.Nome}</b>. Esta ação é irreversível.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setUserToDelete(null)} className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
