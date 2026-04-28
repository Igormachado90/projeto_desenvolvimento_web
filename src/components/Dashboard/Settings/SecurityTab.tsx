import { useState, useEffect } from 'react';
import { Shield, Smartphone, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const SecurityTab = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [sessionInfo, setSessionInfo] = useState<any>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSessionInfo(session);
        };
        getSession();
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            alert('A nova senha e a confirmação não coincidem.');
            return;
        }

        if (passwords.new.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;

            alert('Senha atualizada com sucesso!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            alert(`Erro ao atualizar senha: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOutOthers = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut({ scope: 'others' });
            if (error) throw error;
            alert('Outras sessões encerradas com sucesso.');
        } catch (error: any) {
            alert(`Erro ao encerrar sessões: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 max-w-4xl space-y-12">
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic">Segurança da <span className="text-primary">Conta</span></h2>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
                </div>

                <form onSubmit={handlePasswordChange} className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-[1.5px] border-transparent hover:border-primary/20 transition-all">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 px-1">Alterar Senha de Acesso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nova Senha</label>
                            <input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                placeholder="Nova senha forte"
                                required
                                className="w-full bg-white dark:bg-slate-900 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                placeholder="Repita a nova senha"
                                required
                                className="w-full bg-white dark:bg-slate-900 border-[1.5px] border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary/50 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-8">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Atualizar Credenciais'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic">Sessões e <span className="text-primary">Dispositivos</span></h2>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-[1.5px] border-transparent transition-all space-y-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Shield size={28} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white">Autenticação Segura</p>
                                <p className="text-xs font-medium text-slate-500">Sua conta está protegida por criptografia de ponta a ponta.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOutOthers}
                            disabled={isLoading}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-xl disabled:opacity-50"
                        >
                            {isLoading ? 'Aguarde...' : 'Encerrar Outras Sessões'}
                        </button>
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase">
                                    Dispositivo Atual
                                    <span className="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full tracking-widest font-black">ATIVO</span>
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    {sessionInfo?.user?.email || 'Sessão Ativa'} • Vinculado ao seu perfil
                                </p>
                            </div>
                        </div>
                        <LogOut size={18} className="text-slate-300 pointer-events-none" />
                    </div>
                </div>
            </section>
        </div>
    );
};
