import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface UserProfile {
    id: string;
    nome: string;
    email: string;
    tipo: 'Administrador' | 'Profissional' | 'Tutor' | 'Família' | 'GESTOR' | 'PROFISSIONAL' | 'FAMILIA';
    escola_id?: number;
    escola_nome?: string;
    familia_id?: number;
    plataforma_id?: number;
    limite_alunos?: number;
    limite_unidades?: number;
    limite_usuarios?: number;
    num_alunos?: number;
    foto?: string;
}

export interface Permissions {
    canViewStudents: boolean;
    canEditStudents: boolean;
    canDeleteStudents: boolean;
    canViewGerenciamento: boolean;
    canEditSchools: boolean;
    canEditTeachers: boolean;
    canEditClasses: boolean;
    canViewReports: boolean;
    canExportReports: boolean;
    canViewSettings: boolean;
    canManageUsers: boolean;
    canViewDisciplines: boolean;
    canEditDisciplines: boolean;
    canViewAllSchools: boolean;
}

const ROLE_PERMISSIONS: Record<string, Permissions> = {
    'Administrador': {
        canViewStudents: true,
        canEditStudents: true,
        canDeleteStudents: true,
        canViewGerenciamento: true,
        canEditSchools: true,
        canEditTeachers: true,
        canEditClasses: true,
        canViewReports: true,
        canExportReports: true,
        canViewSettings: true,
        canManageUsers: true,
        canViewDisciplines: true,
        canEditDisciplines: true,
        canViewAllSchools: true
    },
    'GESTOR': {
        canViewStudents: true,
        canEditStudents: true,
        canDeleteStudents: true,
        canViewGerenciamento: true,
        canEditSchools: true,
        canEditTeachers: true,
        canEditClasses: true,
        canViewReports: true,
        canExportReports: true,
        canViewSettings: true,
        canManageUsers: true,
        canViewAllSchools: false,
        canViewDisciplines: true,
        canEditDisciplines: true
    },
    'Profissional': {
        canViewStudents: true,
        canEditStudents: true,
        canDeleteStudents: false,
        canViewGerenciamento: true,
        canEditSchools: false,
        canEditTeachers: false,
        canEditClasses: true,
        canViewReports: true,
        canExportReports: true,
        canViewSettings: false,
        canManageUsers: false,
        canViewDisciplines: true,
        canEditDisciplines: true,
        canViewAllSchools: false
    },
    'PROFISSIONAL': {
        canViewStudents: true,
        canEditStudents: true,
        canDeleteStudents: false,
        canViewGerenciamento: true,
        canEditSchools: false,
        canEditTeachers: false,
        canEditClasses: true,
        canViewReports: true,
        canExportReports: true,
        canViewSettings: false,
        canManageUsers: false,
        canViewDisciplines: true,
        canEditDisciplines: true,
        canViewAllSchools: false
    },
    'Tutor': {
        canViewStudents: true,
        canEditStudents: false,
        canDeleteStudents: false,
        canViewGerenciamento: false,
        canEditSchools: false,
        canEditTeachers: false,
        canEditClasses: false,
        canViewReports: true,
        canExportReports: false,
        canViewSettings: false,
        canManageUsers: false,
        canViewDisciplines: false,
        canEditDisciplines: false,
        canViewAllSchools: false
    },
    'FAMILIA': {
        canViewStudents: true,
        canEditStudents: false,
        canDeleteStudents: false,
        canViewGerenciamento: false,
        canEditSchools: false,
        canEditTeachers: false,
        canEditClasses: false,
        canViewReports: true,
        canExportReports: false,
        canViewSettings: false,
        canManageUsers: false,
        canViewDisciplines: false,
        canEditDisciplines: false,
        canViewAllSchools: false
    },
    'Família': {
        canViewStudents: true,
        canEditStudents: false,
        canDeleteStudents: false,
        canViewGerenciamento: false,
        canEditSchools: false,
        canEditTeachers: false,
        canEditClasses: false,
        canViewReports: true,
        canExportReports: false,
        canViewSettings: false,
        canManageUsers: false,
        canViewDisciplines: false,
        canEditDisciplines: false,
        canViewAllSchools: false
    }
};

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    setUser(null);
                    setPermissions(null);
                    setLoading(false);
                    return;
                }


                const { data: profileData } = await supabase
                    .from('Usuarios')
                    .select('*, Professores(Escola_ID, Escolas(Nome)), Plataformas(Configuracoes), planos(*)')
                    .eq('auth_uid', authUser.id)
                    .single();

                if (profileData) {
                    let familiaId: number | undefined;
                    // Fallback para Escola_ID da tabela Usuarios se não houver no Professores join
                    let escolaId: number | undefined = profileData.Professores?.[0]?.Escola_ID || profileData.Escola_ID;
                    let escolaNome = profileData.Professores?.[0]?.Escolas?.Nome;

                    if (profileData.Tipo === 'Família' || profileData.Tipo === 'Tutor') {
                        const { data: familyData } = await supabase
                            .from('Familias')
                            .select('Familia_ID')
                            .eq('Email', profileData.Email)
                            .maybeSingle();
                        familiaId = familyData?.Familia_ID;

                        if (familiaId) {
                            const { data: studentData } = await supabase
                                .from('Alunos')
                                .select('Escola_ID')
                                .eq('Familia_ID', familiaId)
                                .limit(1)
                                .maybeSingle();
                            if (studentData) {
                                escolaId = studentData.Escola_ID;
                            }
                        }
                    }

                    // Buscar nome da escola se tivermos o ID mas não o nome do join
                    if (escolaId && !escolaNome) {
                        const { data: school } = await supabase.from('Escolas').select('Nome').eq('Escola_ID', escolaId).single();
                        if (school) escolaNome = school.Nome;
                    }

                    const config = (profileData as any).Plataformas?.Configuracoes || {};
                    const plano = (profileData as any).planos || {};

                    // Buscar contagem atual de alunos para controle de limites
                    // Se o usuário estiver vinculado a uma escola, contar apenas os daquela escola.
                    // Se não, contar da plataforma inteira.
                    const countMatch: any = {};
                    if (escolaId) {
                        countMatch.Escola_ID = escolaId;
                    } else if (profileData.Plataforma_ID) {
                        countMatch.Plataforma_ID = profileData.Plataforma_ID;
                    }

                    const { count: studentCount } = await supabase
                        .from('Alunos')
                        .select('*', { count: 'exact', head: true })
                        .match(countMatch);

                    const userProfile: UserProfile = {
                        id: profileData.Usuario_ID,
                        nome: profileData.Nome,
                        email: profileData.Email,
                        tipo: profileData.Tipo,
                        escola_id: escolaId,
                        escola_nome: escolaNome,
                        familia_id: familiaId,
                        plataforma_id: profileData.Plataforma_ID,
                        // Priorizar limites do Plano se disponíveis
                        limite_alunos: plano.quantidade_alunos || config.limite_alunos || 100,
                        limite_unidades: plano.quantidade_escolas || config.limite_unidades || 1,
                        limite_usuarios: config.limite_usuarios || 5,
                        num_alunos: studentCount || 0,
                        foto: profileData.Foto
                    };

                    setUser(userProfile);
                    setPermissions(ROLE_PERMISSIONS[profileData.Tipo] || ROLE_PERMISSIONS['Família']);
                }
            } catch (error) {
                console.error('Erro ao carregar perfil:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();


        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUserProfile();
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, permissions, loading };
};

export const getPermissions = (tipo: string): Permissions => {
    return ROLE_PERMISSIONS[tipo] || ROLE_PERMISSIONS['Família'];
};
