import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;


const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export interface UserProfile {
    id: string;
    nome: string;
    email: string;
    role: 'Admin' | 'Tutor' | 'Profissional';
    foto?: string;
    escola_id?: number;
}

export const userService = {
    async getAll(plataforma_id?: number, escola_id?: number) {
        let query = supabase
            .from('Usuarios')
            .select('*');

        if (plataforma_id) {
            query = query.eq('Plataforma_ID', plataforma_id);
        }

        if (escola_id) {
            query = query.eq('Escola_ID', escola_id);
        }

        const { data, error } = await query.order('Nome', { ascending: true });

        if (error) throw error;

        return data.map(u => ({
            ...u,
            Tipo_Acesso: u.Tipo
        }));
    },

    async create(userData: any) {
        if (!userData.email || !userData.senha || !userData.nome || !userData.plataforma_id) {
            throw new Error('E-mail, senha, nome e plataforma são obrigatórios.');
        }

        const cleanEmail = userData.email.trim().toLowerCase();

        // VALIDATION: E-mail regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail)) {
            throw new Error(`O e-mail "${cleanEmail}" não segue o padrão aceito.`);
        }


        try {
            const { data, error } = await supabase.functions.invoke('create-admin', {
                body: {
                    email: cleanEmail,
                    senha: userData.senha,
                    nome: userData.nome,
                    role: userData.role || 'Profissional',
                    plataforma_id: userData.plataforma_id,
                    escola_id: userData.escola_id,
                    plano_id: userData.role === 'Administrador' ? 15 : userData.plano_id
                }
            });

            if (error) {
                let errorMessage = 'Erro desconhecido na criação do usuário';

                if (error instanceof FunctionsHttpError) {
                    // Extrair o corpo JSON da resposta da Edge Function
                    try {
                        const errorBody = await error.context.json();
                        errorMessage = errorBody?.error || errorMessage;
                    } catch {
                        errorMessage = 'Erro na Edge Function. Verifique os logs do servidor.';
                    }
                } else if (error instanceof FunctionsRelayError) {
                    errorMessage = 'Erro de conexão com a Edge Function. Tente novamente.';
                } else if (error instanceof FunctionsFetchError) {
                    errorMessage = 'Erro de rede ao chamar a Edge Function. Verifique sua conexão.';
                } else {
                    errorMessage = error.message || errorMessage;
                }

                throw new Error(errorMessage);
            }

            // Verificar se data contém erro
            if (data?.error) {
                throw new Error(data.error);
            }

            // Sync local profile state
            const { data: newUser } = await supabase
                .from('Usuarios')
                .select('*')
                .eq('Email', cleanEmail)
                .single();

            return newUser;
        } catch (error: any) {
            console.error("User Creation Error:", error);
            
            // Helpful error for orphan accounts
            if (error.message?.includes('already registered') || error.message?.includes('usuário já existe')) {
                throw new Error('Este e-mail já possui um acesso ativo no sistema de autenticação (Auth), mas o perfil não foi encontrado. Por favor, acesse o painel do Supabase para excluir o usuário orfão do Auth ou contate o suporte.');
            }
            
            throw new Error(error.message || 'Erro ao criar usuário');
        }
    },

    async update(id: string, updates: any) {
        const { error } = await supabase
            .from('Usuarios')
            .update({
                Nome: updates.nome,
                Tipo: updates.role,
                Foto: updates.avatar,
                Plano_ID: updates.role === 'Administrador' ? 15 : updates.plano_id,
                Escola_ID: updates.escola_id || null
            })
            .eq('Usuario_ID', id);

        if (error) throw error;


        if ((updates.role === 'Profissional' || updates.role === 'GESTOR') && updates.escola_id) {
            await supabase
                .from('Professores')
                .update({ Escola_ID: updates.escola_id })
                .eq('Usuario_ID', id);
        }

        return true;
    },

    async delete(id: string) {
        // 1. Get user details to see if we have an auth_uid
        const { data: userProfile } = await supabase
            .from('Usuarios')
            .select('auth_uid, Nome')
            .eq('Usuario_ID', id)
            .single();

        // 2. Handle linked teacher role and sub-data
        const { data: teacher } = await supabase
            .from('Professores')
            .select('Professor_ID')
            .eq('Usuario_ID', id)
            .maybeSingle();

        if (teacher) {
            const profId = teacher.Professor_ID;

            await supabase.from('Disponibilidade').delete().eq('Professor_ID', profId);
            await supabase.from('Turmas').update({ Professor_ID: null }).eq('Professor_ID', profId);
            await supabase.from('Aulas').update({ Professor_ID: null }).eq('Professor_ID', profId);
            await supabase.from('Relatorios_PEI').update({ Professor_ID: null }).eq('Professor_ID', profId);
            await supabase.from('Avaliacoes').update({ Professor_ID: null }).eq('Professor_ID', profId);

            await supabase.from('Professores').delete().eq('Professor_ID', profId);
        }

        await supabase.from('Anotacoes').delete().eq('Usuario_ID', id);

        // 3. Delete from Supabase Auth if linked
        if (userProfile?.auth_uid) {
            console.log(`🌐 Chamando Edge Function para apagar ${userProfile.Nome} do Auth...`);
            try {
                const { error: functionError } = await supabase.functions.invoke('delete-user', {
                    body: { user_id: userProfile.auth_uid }
                });

                if (functionError) {
                    console.warn('⚠️ Falha ao apagar do Auth (pode ser necessário implantar a Edge Function):', functionError);
                    // We continue anyway to at least clean up the DB
                }
            } catch (err) {
                console.error('❌ Erro na Edge Function:', err);
            }
        }

        // 4. Finally delete from Usuarios table
        const { error } = await supabase
            .from('Usuarios')
            .delete()
            .eq('Usuario_ID', id);

        if (error) throw error;
        return true;
    }
};
