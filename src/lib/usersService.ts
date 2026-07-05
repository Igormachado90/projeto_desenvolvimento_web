import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export interface UserData {
    id?: number | null;
    nome: string;
    email: string;
    tipo: 'GESTOR' | 'PROFISSIONAL' | 'FAMILIA' | 'Administrador' | 'Tutor';
    Telefone?: string | null;
    Foto?: string | null;
    status?: string;
    plataforma_id?: number | null;
    escola_id?: number | null;
    plano_id?: number | null;
    auth_uid?: string; // uuid
    preferencias?: {
        onboarding_completed: boolean;
        config: any;
    };
}

// Interface para o retorno do Supabase
interface UsuarioRow {
    Usuario_ID: number;
    Plataforma_ID: number | null;
    Nome: string;
    Email: string;
    Tipo: string;
    Telefone: string | null;
    Foto: string | null;
    Data_criacao: string;
    Status: string;
    auth_uid: string;
    preferencias: any;
    Plano_ID: number | null;
    Escola_ID: number | null;
}

// Função para verificar se email já existe
async function checkUserExists(email: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('Usuarios')
            .select('Usuario_ID')
            .eq('Email', email)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao verificar usuário:', error);
        }

        return !!data;
    } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        return false;
    }
}

// Função para buscar usuário auth_uid (UUID)
async function getUserByAuthUid(authUid: string): Promise<UsuarioRow | null> {
    try {
        const { data, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('auth_uid', authUid)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        console.error('Erro ao buscar usuário por auth_uid:', error);
        return null;
    }
}

export const usersService = {
    async getAll() {
        // Buscar todos os usuários ordenados por Nome
        const { data, error } = await supabase
            .from('Usuarios')
            .select('*')
            .order('Nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.Usuario_ID,
            nome: item.Nome,
            email: item.Email,
            tipo: item.Tipo,
            status: item.Status || 'Ativo',
            plataforma_id: item.Plataforma_ID,
            escola_id: item.Escola_ID,
            plano_id: item.Plano_ID,
            preferencias: item.preferencias || { onboarding_completed: false, config: {} }
        }));
    },

    async create(user: UserData & { senha?: string }) {
        // =====================================================
        // ETAPA 1 - Início do cadastro
        // =====================================================
        console.log("[CADASTRO] Iniciando criação de usuário...");
        console.log("Dados recebidos:", {
            nome: user.nome,
            email: user.email,
            tipo: user.tipo
        });

        // Validação dos campos obrigatórios
        if (!user.senha) throw new Error('A senha é obrigatória para criar um novo acesso.');
        if (!user.email) throw new Error('O e-mail é obrigatório.');
        if (!user.nome) throw new Error('O nome é obrigatório.');

        // =====================================================
        // ETAPA 2 - Verificar se o usuário já existe
        // =====================================================
        console.log("[VERIFICAÇÃO] Verificando e-mail no banco...");
        const exists = await checkUserExists(user.email);
        if (exists) {
            console.warn("E-mail já cadastrado.");
            throw new Error("Este e-mail já está cadastrado no sistema.");
        }
        console.log("✅ E-mail disponível.");

        try {
            // =====================================================
            // ETAPA 3 - Criar usuário no Supabase Auth
            // =====================================================
            console.log("[AUTH] Criando usuário no Supabase Auth...");
            const { data: authData, error: authError } = await authClient.auth.signUp({
                email: user.email,
                password: user.senha,
                options: {
                    data: {
                        full_name: user.nome,
                        role: user.tipo,
                        plataforma_id: user.plataforma_id
                    }
                }
            });

            if (authError) {
                console.error('Erro no Auth:', authError);
                if (authError.message.includes('already registered')) {
                    throw new Error('Este e-mail já está registrado no sistema.');
                }
                throw new Error(`Erro ao criar credenciais de login: ${authError.message}`);
            }

            if (!authData.user) {
                throw new Error('Falha ao criar usuário no Auth.');
            }

            console.log("[AUTH] Usuário criado no Auth.");
            console.log("[AUTH] Auth UID:", authData.user.id);
            console.log("[AUTH] Email confirmado:", authData.user.email_confirmed_at);

            // =====================================================
            // ETAPA 4 - Preparar dados do perfil
            // =====================================================
            // console.log("[PERFIL] Preparando dados do perfil...");
            const insertData: any = {
                auth_uid: authData.user.id,
                Nome: user.nome,
                Email: user.email,
                Tipo: user.tipo,
                Status: 'Ativo',
                Data_criacao: new Date().toISOString(),
                preferencias: {
                    onboarding_completed: false,
                    config: {}
                }
            };

            // Adicionar campos opcionais apenas se fornecidos
            if (user.plataforma_id !== undefined && user.plataforma_id !== null) insertData.Plataforma_ID = user.plataforma_id;

            if (user.escola_id !== undefined && user.escola_id !== null) insertData.Escola_ID = user.escola_id;

            if (user.plano_id !== undefined && user.plano_id !== null) insertData.Plano_ID = user.plano_id;

            // =====================================================
            // ETAPA 5 - Salvar perfil no banco
            // =====================================================
            // console.log("[PERFIL] Salvando perfil na tabela Usuarios...");
            const { data, error } = await supabase
                .from('Usuarios')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('Erro ao salvar perfil:', error);

                // Tentar limpar o usuário do Auth se falhar no banco
                try {
                    console.log("Removendo usuário do Auth...");
                    await authClient.auth.admin?.deleteUser(authData.user.id);
                } catch (e) {
                    console.warn('Não foi possível remover usuário do Auth:', e);
                }
                throw new Error(`Login criado, mas houve erro no perfil: ${error.message}`);
            }
            console.log("[CADASTRO] Usuario concluído com sucesso!");
            console.log("🆔 ID do usuário:", data.Usuario_ID);
            return data;
        } catch (error: any) {
            console.error('Erro no create:', error);
            throw error;
        }
    },

    async update(id: string, user: Partial<UserData>) {
        const { data, error } = await supabase
            .from('Usuarios')
            .update({
                Nome: user.nome,
                Email: user.email,
                Tipo: user.tipo,
                Status: user.status
            })
            .eq('Usuario_ID', id)
            .select();

        if (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
        return data ? data[0] : null;
    },

    async delete(id: string) {
        try {
            // 1. Buscar o usuário para obter o auth_uid
            const { data: userData, error: findError } = await supabase
                .from('Usuarios')
                .select('auth_uid')
                .eq('Usuario_ID', id)
                .single();

            if (findError && findError.code !== 'PGRST116') {
                throw findError;
            }
            //
            const { error: deleteError } = await supabase
                .from('Usuarios')
                .delete()
                .eq('Usuario_ID', id);

            if (deleteError) throw deleteError;

            // Se tiver auth_uid, tentar deletar do Auth
            if (userData?.auth_uid) {
                try {
                    const { error: authError } = await authClient.auth.admin?.deleteUser(userData.auth_uid);
                    if (authError) {
                        console.warn('Erro ao deletar do Auth:', authError);
                    }
                } catch (authErr) {
                    console.warn('Não foi possível deletar do Auth:', authErr);
                }
            }

            return true;
        } catch (error: any) {
            console.error('Erro ao excluir usuário:', error);
            throw error;
        }
    },

    // // Atualizar preferências (jsonb) usando Usuario_ID (INTEGER)
    // async updatePreferences(userId: string | number, prefs: any) {
    //     try {
    //         const { data, error } = await supabase
    //             .from('Usuarios')
    //             .update({
    //                 preferencias: prefs
    //             })
    //             .eq('Usuario_ID', userId)
    //             .select()
    //             .single();

    //         if (error) throw error;

    //         return data;

    //     } catch (error) {
    //         console.error('Erro ao atualizar Preferences:', error);
    //         throw error;
    //     }
    // },

    // Buscar preferências por auth_uid (UUID)
    async getPreferencesByAuthUid(authUid: string): Promise<any> {
        try {
            const { data: user, error: userError } = await supabase
                .from('Usuarios')
                .select('preferencias')
                .eq('auth_uid', authUid)
                .maybeSingle();

            if (userError && userError.code !== 'PGRST116') {
                console.error('Erro ao buscar preferências por auth_uid:', userError);
                return { config: {}, onboarding_completed: false };
            }

            if (!user) {
                console.warn('Usuário não encontrado para o auth_uid:', authUid);
                return { config: {}, onboarding_completed: false };
            }

            return user.preferencias || {
                config: {}, onboarding_completed: false
            };
        } catch (error) {
            console.error('Erro ao buscar preferências por auth_uid:', error);
            return { config: {}, onboarding_completed: false };
        }
    },

    // Buscar preferências (jsonb) usando Usuario_ID (INTEGER)
    async getPreferences(userId: number | string): Promise<any> {
        try {
            // Se for string, verificar se é um número válido
            if (typeof userId === 'string') {
                // Se a string contém hífen, é um UUID, não um número
                if (userId.includes('-')) {
                    console.warn('getPreferences recebeu UUID em vez de Usuario_ID:', userId);
                    // Redirecionar para a função correta
                    return this.getPreferencesByAuthUid(userId);
                }
                // Tentar converter para número
                userId = parseInt(userId);
                if (isNaN(userId)) {
                    console.warn('ID inválido para getPreferences:', userId);
                    return { config: {}, onboarding_completed: false };
                }
            }

            const { data, error } = await supabase
                .from('Usuarios')
                .select('preferencias')
                .eq('Usuario_ID', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            return data?.preferencias || { config: {}, onboarding_completed: false };

        } catch (error: any) {
            console.error('Erro ao buscar preferências:', error);
            return { config: {}, onboarding_completed: false };
        }
    },

    // Atualizar preferências por auth_uid (UUID)
    async updatePreferencesByAuthUid(authUid: string, prefs: any): Promise<UsuarioRow | null> {
        try {
            const updatedPrefs = {
                config: prefs.config || {},
                onboarding_completed: prefs.onboarding_completed ?? false
            };

            const { data, error } = await supabase
                .from('Usuarios')
                .update({ preferencias: updatedPrefs })
                .eq('auth_uid', authUid)
                .select()
                .maybeSingle();

            if (error) {
                console.error('Erro ao atualizar preferências por auth_uid:', error);
                throw error;
            }

            if (!data) {
                console.warn('Usuário não encontrado para o auth_uid:', authUid);
                return null;
            }

            return data;
        } catch (error: any) {
            console.error('Erro ao atualizar preferências por auth_uid:', error);
            throw error;
        }
    },

    // Atualizar preferências por Usuario_ID (INTEGER)
    async updatePreferences(userId: number | string, prefs: any): Promise<UsuarioRow | null> {
        try {
            // Se for string, verificar se é um UUID
            if (typeof userId === 'string') {
                if (userId.includes('-')) {
                    // É um UUID, redirecionar para a função correta
                    return this.updatePreferencesByAuthUid(userId, prefs);
                }
                // Tentar converter para número
                userId = parseInt(userId);
                if (isNaN(userId)) {
                    throw new Error('ID inválido para updatePreferences: ' + userId);
                }
            }

            // Garantir que o objeto de preferências tenha a estrutura correta
            const updatedPrefs = {
                config: prefs.config || {},
                onboarding_completed: prefs.onboarding_completed ?? false
            };

            // Primeiro, verificar se o usuário existe
            const { data: existingUser, error: findError } = await supabase
                .from('Usuarios')
                .update({ preferencias: updatedPrefs })
                .eq('Usuario_ID', userId)
                .select()
                .maybeSingle();

            if (findError) {
                console.error('Erro ao verificar usuário:', findError);
                throw new Error('Erro ao verificar existência do usuário');
            }

            if (!existingUser) {
                console.warn('Usuário não encontrado para o ID:', userId);
                throw new Error(`Usuário com ID ${userId} não encontrado`);
            }

            return existingUser;
        } catch (error: any) {
            console.error('Erro ao atualizar preferências:', error);
            throw error;
        }
    },

    // Buscar usuário por auth_uid (UUID)
    async getUserByAuthUid(authUid: string): Promise<UsuarioRow | null> {
        return getUserByAuthUid(authUid);
    },

    // Buscar usuário por ID (Usuario_ID - INTEGER)
    async getUserById(userId: number | string): Promise<UsuarioRow | null> {
        try {
            if (typeof userId === 'string') {
                if (userId.includes('-')) {
                    return this.getUserByAuthUid(userId);
                }
                userId = parseInt(userId);
                if (isNaN(userId)) {
                    return null;
                }
            }

            const { data, error } = await supabase
                .from('Usuarios')
                .select('*')
                .eq('Usuario_ID', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            return null;
        }
    },

    // Buscar usuário por email
    async getUserByEmail(email: string): Promise<UsuarioRow | null> {
        try {
            const { data, error } = await supabase
                .from('Usuarios')
                .select('*')
                .eq('Email', email)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            return null;
        }
    },

    // Função para verificar se email existe (exposta publicamente)
    async checkUserExists(email: string): Promise<boolean> {
        return checkUserExists(email);
    },

    // Atualizar onboarding_completed
    async completeOnboarding(userId: number | string): Promise<void> {
        try {
            if (typeof userId === 'string' && userId.includes('-')) {
                return this.completeOnboardingByAuthUid(userId);
            }
            const prefs = await this.getPreferences(userId);
            prefs.onboarding_completed = true;
            await this.updatePreferences(userId, prefs);
        } catch (error: any) {
            console.error('Erro ao completar onboarding:', error);
            throw error;
        }
    },

    // Atualizar onboarding_completed por auth_uid
    async completeOnboardingByAuthUid(authUid: string): Promise<void> {
        try {
            const prefs = await this.getPreferencesByAuthUid(authUid);
            prefs.onboarding_completed = true;
            await this.updatePreferencesByAuthUid(authUid, prefs);
        } catch (error: any) {
            console.error('Erro ao completar onboarding por auth_uid:', error);
            throw error;
        }
    }
};

export default usersService;
