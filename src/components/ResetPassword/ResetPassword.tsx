import { useState } from 'react'
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ResetPasswordProps {
  onSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const data = { password, confirmPassword };
    console.log(data);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      console.log("[PASSWORD] Alterando senha...");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("[PASSWORD] Sessão antes:", sessionData.session?.refresh_token);

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });
      console.log("[PASSWORD] senha alterada.", data);
      const { data: sessionAfterData, error: sessionAfterError } = await supabase.auth.getSession();
      console.log("[PASSWORD] Depois da sessão:", sessionAfterData.session?.refresh_token);

      if (updateError) {
        setError(updateError.message);
      } else {
        console.log("✅ Senha atualizada com sucesso.");
        console.log("👤 Usuário:", data.user?.email);
        setSuccess(true);
        setTimeout(() => onSuccess(), 3000);
      }
    } catch (err) {
      setError('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="size-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Senha alterada!</h2>
        <p className="text-slate-500 mb-8 text-sm">Sua senha foi atualizada com sucesso. Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-black text-slate-900 mb-2">Nova senha</h2>
      <p className="text-slate-500 mb-8 text-sm">Defina uma nova senha segura para sua conta.</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-xs font-bold">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nova Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-12 pr-12 font-semibold focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Confirmar Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-12 pr-4 font-semibold focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          disabled={isLoading} 
          type="submit" 
          className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Atualizar senha'}
        </button>
      </form>
    </div>
  );
};