import React, { useState, useEffect } from 'react';
import styles from './LoginForm.module.css';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Carregar e-mail salvo se existir
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setError(null);

    console.log("============= LOGIN =============");
    console.log("[LOGIN] Iniciando autenticação...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[LOGIN] Erro:", error.message);
      setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
      setLoading(false);
    } else {
      // Login sucesso - Gerenciar "Lembre-se"
      console.log("[LOGIN] Usuário:", data.user.email);
      console.log("[LOGIN] Auth UID do Usuário:", data.user.id);
      console.log("[LOGIN] JWT gerado:", data.session?.access_token);
      console.log("[LOGIN] Refresh Token:", data.session?.refresh_token);
      console.log("[LOGIN] Expira em:", data.session?.expires_at);
      console.log("[LOGIN] Usuário autenticado com sucesso.");

      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      navigate('/dashboard');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>E-mail Institucional</label>
        <input
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className={styles.passwordRow}>
        <div className={styles.fieldGroup} style={{ flex: 1 }}>
          <label className={styles.label}>Senha</label>
          <div className={styles.inputContainer}>
            <input
              type={showPassword ? "text" : "password"}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <label className={styles.rememberArea}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Lembre-se
        </label>
      </div>

      <div>
        <button
          type="button"
          className={styles.forgotLink}
          onClick={onForgotPassword}
        >
          esqueci a senha
        </button>
      </div>

      {error && <div className={styles.errorText}>{error}</div>}

      <div className={styles.submitArea}>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Carregando...' : 'Entrar na plataforma'}
        </button>
      </div>

      <p className={styles.signupText}>
        Ainda não faz parte? <span className={styles.signupLink} onClick={() => navigate('/cadastro')}>solicite uma demonstração</span>
      </p>
    </form>
  );
};