import { describe, it, expect, vi, beforeEach } from 'vitest';
import { schoolsService } from '@/lib/schoolsService';
import { teachersService } from '@/lib/teacherService';
import { classesService } from '@/lib/classesService';
import { disciplinesService } from '@/lib/disciplinesService';
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
        },
    },
}));

describe('Gerenciamento Services (Schools, Teachers, Classes, Disciplines)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Schools Service', () => {
        it('should create a school', async () => {
            const mockData = [{ Escola_ID: '1', Nome: 'Escola Teste' }];
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await schoolsService.create({ nome: 'Escola Teste', endereco: 'Rua A' });
            expect(result.Nome).toBe('Escola Teste');
        });

        it('should update a school', async () => {
            const mockData = [{ Escola_ID: '1', Nome: 'Escola Atualizada' }];
            (supabase.from as any).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await schoolsService.update('1', { nome: 'Escola Atualizada' });
            expect(result.Nome).toBe('Escola Atualizada');
        });

        it('should delete a school after clearing references', async () => {
            (supabase.from as any).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
            });

            const result = await schoolsService.delete('1');
            expect(result).toBe(true);
        });
    });

    describe('Teacher Service', () => {
        it('should create a teacher', async () => {
            const mockData = [{ Professor_ID: '1', Nome: 'Prof Teste' }];
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await teachersService.create({ nome: 'Prof Teste', email: 'prof@teste.com', especialidade: 'Educação' });
            expect(result.Nome).toBe('Prof Teste');
        });

        it('should delete a teacher', async () => {
            (supabase.from as any).mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            const result = await teachersService.delete('1');
            expect(result).toBe(true);
        });
    });

    describe('Classes Service', () => {
        it('should create a class', async () => {
            const mockData = [{ Turma_ID: '1', Nome: 'Turma A' }];
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await classesService.create({ nome: 'Turma A', escola_id: 1, turno: 'Manhã', ano_letivo: '2024' });
            expect(result.Nome).toBe('Turma A');
        });

        it('should update a class', async () => {
            const mockData = [{ Turma_ID: '1', Nome: 'Turma B' }];
            (supabase.from as any).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await classesService.update('1', { nome: 'Turma B' });
            expect(result.Nome).toBe('Turma B');
        });
    });

    describe('Disciplines Service', () => {
        it('should create a discipline', async () => {
            const mockData = [{ Disciplina_ID: '1', Nome: 'Matemática' }];
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await disciplinesService.create({ nome: 'Matemática' });
            expect(result.Nome).toBe('Matemática');
        });

        it('should update a discipline', async () => {
            const mockData = [{ Disciplina_ID: '1', Nome: 'Português' }];
            (supabase.from as any).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockData, error: null })
            });

            const result = await disciplinesService.update('1', { nome: 'Português' });
            expect(result.Nome).toBe('Português');
        });

        it('should delete a discipline', async () => {
            (supabase.from as any).mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            });

            await disciplinesService.delete('1');
            // Since it currently returns void, we just expect it not to throw
        });
    });
});
