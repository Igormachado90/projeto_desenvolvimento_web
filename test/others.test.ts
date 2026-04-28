import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notesService } from '@/lib/notesService';
import { userService } from '@/lib/userService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
            signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'new-auth-id' } }, error: null }),
        },
    },
}));

// Mock authClient (internal to userService)
vi.mock('@supabase/supabase-js', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        createClient: vi.fn(() => ({
            auth: {
                signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'new-auth-id' } }, error: null }),
            },
        })),
    };
});

describe('Notes and User Gerenciamento Services', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Notes Service', () => {
        it('should create a note with mapped type', async () => {
            const mockData = [{ Anotacao_ID: '1', Tipo: 'GERAL', Conteudo: 'Teste' }];
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await notesService.create({
                student_id: '1',
                tipo: 'Geral',
                data: '2024-02-14',
                conteudo: 'Teste'
            });
            expect(result.Tipo).toBe('GERAL');
        });

        it('should delete a note', async () => {
            (supabase.from as any).mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            const result = await notesService.delete('1');
            expect(result).toBe(true);
        });
    });

    describe('User Service', () => {
        it('should create a user (profile + auth link)', async () => {
            const userData = {
                nome: 'Novo User',
                email: 'novo@user.com',
                senha: 'password123',
                role: 'Profissional',
                plataforma_id: 1
            };

            // Mock profile insert
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'Usuarios') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // Email check
                        insert: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { Usuario_ID: 'u100', ...userData }, error: null }),
                        update: vi.fn().mockReturnThis(),
                    };
                }
                return {
                    insert: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: {}, error: null })
                };
            });

            const result = await userService.create(userData);
            expect(result.Usuario_ID).toBe('u100');
        });

        it('should delete a user and its associations', async () => {
            (supabase.from as any).mockImplementation(() => ({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null }), // Not a teacher check
                delete: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
            }));

            const result = await userService.delete('u100');
            expect(result).toBe(true);
        });
    });
});
