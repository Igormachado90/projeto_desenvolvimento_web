import { useState } from 'react'
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';


interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const data = { email };
    
    try {
      console.log("[RESET] Enviando email de recuperação...");
      console.log(data);
      const { data: linkReset, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      console.log("[RESET] Email enviado.", linkReset);

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);

        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch {
      setError('Erro ao processar solicitação. Tente novamente mais tarde.');
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

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          E-mail enviado!
        </h2>

        <p className="text-slate-500 mb-6 text-sm">
          Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.
        </p>

        <span className="text-xs text-slate-400 font-bold">
          Redirecionando...
        </span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest mb-6 hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <h2 className="text-2xl font-black text-slate-900 mb-2">
        Recuperar senha
      </h2>

      <p className="text-slate-500 mb-8 text-sm">
        Informe seu e-mail institucional para receber o link de redefinição.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-xs font-bold">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            E-mail Institucional
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-12 pr-4 font-semibold focus:border-primary outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            'Enviar instruções'
          )}
        </button>
      </form>
    </div>
  );
};
