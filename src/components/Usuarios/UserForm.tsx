import React, { useState, useEffect } from 'react';
import styles from './UserForm.module.css';
import { usersService } from '../../lib/usersService';
import { supabase } from '../../lib/supabase';
import { X, UserPlus, Edit2, Shield, Mail, Lock, Building, CreditCard, EyeOff, Eye } from 'lucide-react';

interface UserFormProps {
    onClose: () => void;
    onSuccess?: () => void;
    editingUser?: any | null;
    currentUser?: any;
    showSchoolField?: boolean;
    showPlanField?: boolean;
}

interface Plan {
    plano_id: string;
    nome: string;
    quantidade_alunos: string;
    valor_mensal: string;
    status: string;
}

interface School {
    Escola_ID: number;
    Nome: string;
}

export const UserForm: React.FC<UserFormProps> = ({
    onClose,
    onSuccess,
    editingUser,
    currentUser,
    showSchoolField = true,
    showPlanField = true
}) => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        tipo: 'PROFISSIONAL',
        plano_id: '',
        escola_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [showPassword, setShowPassword] = useState(false);

    const isEditing = !!editingUser;

    useEffect(() => {
        fetchPlans();
        if (showSchoolField) fetchSchools();

        if (isEditing && editingUser) {
            setFormData({
                nome: editingUser.Nome || '',
                email: editingUser.Email || '',
                senha: '',
                confirmarSenha: '',
                tipo: editingUser.Tipo || 'PROFISSIONAL',
                plano_id: editingUser.Plano_ID || '',
                escola_id: editingUser.Escola_ID?.toString() || ''
            });
        }
    }, [editingUser]);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('planos')
                .select('*')
                .eq('status', 'Ativo')
                .order('valor_mensal', { ascending: true });
            if (error) throw error;
            setPlans(data || []);
        } catch (err) {
            console.error('Erro ao buscar planos:', err);
        }
    };

    const fetchSchools = async () => {
        try {
            const { data, error } = await supabase
                .from('Escolas')
                .select('Escola_ID, Nome')
                .order('Nome', { ascending: true });
            if (error) throw error;
            setSchools(data || []);
        } catch (err) {
            console.error('Erro ao buscar escolas:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validações
        if (!formData.nome.trim()) {
            setError('Nome é obrigatório');
            return;
        }
        if (!formData.email.trim()) {
            setError('E-mail é obrigatório');
            return;
        }
        if (!isEditing && !formData.senha) {
            setError('Senha é obrigatória');
            return;
        }
        if (!isEditing && formData.senha !== formData.confirmarSenha) {
            setError('As senhas não coincidem');
            return;
        }
        if (!isEditing && formData.senha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const planoId = formData.plano_id ? parseInt(formData.plano_id) : null;
            const escolaId = formData.escola_id ? parseInt(formData.escola_id) : null;
            if (isEditing) {
                // Atualizar usuário existente
                await usersService.update(editingUser.Usuario_ID, {
                    nome: formData.nome,
                    email: formData.email,
                    tipo: formData.tipo as any,
                    plano_id: planoId || null,
                    escola_id: escolaId || null,
                    status: 'Ativo'
                });
                setSuccess('Usuário atualizado com sucesso!');
            } else {
                // Criar novo usuário
                await usersService.create({
                    nome: formData.nome,
                    email: formData.email,
                    senha: formData.senha,
                    tipo: formData.tipo as 'GESTOR' | 'PROFISSIONAL' | 'FAMILIA' | 'Administrador' | 'Tutor',
                    plano_id: planoId,
                    escola_id: escolaId,
                    plataforma_id: currentUser?.plataforma_id
                });
                setSuccess('Usuário criado com sucesso!');
            }

            // Limpar formulário após sucesso
            if (!isEditing) {
                setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    confirmarSenha: '',
                    tipo: 'PROFISSIONAL',
                    plano_id: '',
                    escola_id: ''
                });
            }

            // Fechar modal após 1.5s
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err?.message || 'Erro ao salvar usuário');
        } finally {
            setLoading(false);
        }
    };

    const getTipoOptions = () => {
        const options = [
            { value: 'Administrador', label: 'Administrador Global', requireAdmin: true },
            { value: 'GESTOR', label: 'Diretor / Coordenador', requireAdmin: false },
            { value: 'PROFISSIONAL', label: 'Profissional / Professor', requireAdmin: false },
            { value: 'Tutor', label: 'Tutor / Auxiliar', requireAdmin: false },
            { value: 'FAMILIA', label: 'Família / Responsável', requireAdmin: false }
        ];
        return options;
    };

    const isAdmin = currentUser?.tipo === 'Administrador';

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerIcon}>
                        {isEditing ? <Edit2 size={20} /> : <UserPlus size={20} />}
                    </div>
                    <h2 className={styles.headerTitle}>
                        {isEditing ? 'Editar Usuário' : 'Cadastrar'}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.body}>
                        {/* Campo Nome */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <UserPlus size={16} />
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Ex: João Silva"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        {/* Campo Email */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <Mail size={16} />
                                E-mail *
                            </label>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="joao@escola.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        {/* Campos de Senha (apenas para novo usuário) */}
                        {!isEditing && (
                            <>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        <Lock size={16} />
                                        Senha *
                                    </label>
                                    <div className={styles.passwordWrapper}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className={styles.input}
                                            placeholder="••••••••"
                                            value={formData.senha}
                                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className={styles.passwordToggle}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <small className={styles.hint}>Mínimo 6 caracteres</small>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        <Lock size={16} />
                                        Confirmar Senha *
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={styles.input}
                                        placeholder="••••••••"
                                        value={formData.confirmarSenha}
                                        onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </>
                        )}

                        {/* Campo Tipo */}
                        <div className={styles.field}>
                            <label className={styles.label}>
                                <Shield size={16} />
                                Tipo de Acesso *
                            </label>
                            <select
                                className={styles.select}
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                disabled={loading}
                            >
                                {getTipoOptions()
                                    .filter(opt => !opt.requireAdmin || isAdmin)
                                    .map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Campo Plano */}
                        {showPlanField && plans.length > 0 && (
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    <CreditCard size={16} />
                                    Plano de Assinatura
                                </label>
                                <select
                                    className={styles.select}
                                    value={formData.plano_id}
                                    onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value="">Selecione um plano...</option>
                                    {plans.map(plan => (
                                        <option key={plan.plano_id} value={plan.plano_id}>
                                            {plan.nome} - R$ {plan.valor_mensal}/mês
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Campo Escola */}
                        {showSchoolField && schools.length > 0 && isAdmin && (
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    <Building size={16} />
                                    Unidade Escolar
                                </label>
                                <select
                                    className={styles.select}
                                    value={formData.escola_id}
                                    onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value="">Plataforma Global (Sem Unidade)</option>
                                    {schools.map(school => (
                                        <option key={school.Escola_ID} value={school.Escola_ID}>
                                            {school.Nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Mensagens */}
                    {error && (
                        <div className={styles.errorMsg}>
                            <span className={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className={styles.successMsg}>
                            <span className={styles.successIcon}>✅</span>
                            {success}
                        </div>
                    )}

                    {/* Botões */}
                    <div className={styles.footer}>
                        <button
                            type="button"
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className={styles.spinner} />
                            ) : isEditing ? (
                                'Atualizar Usuário'
                            ) : (
                                'Criar Usuário'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;