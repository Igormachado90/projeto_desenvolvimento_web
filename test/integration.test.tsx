import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';

// Mock views to avoid complex child rendering and focus on integration of the Dashboard shell
vi.mock('@/components/MarketingSection/MarketingSection', () => ({
    default: () => <div data-testid="marketing-section">Marketing</div>
}));

vi.mock('@/components/Dashboard/Gerenciamento/GerenciamentoView', () => ({
    GerenciamentoView: () => {
        const [tab, setTab] = (window as any).React.useState('escolas');
        return (
            <div data-testid="Gerenciamento-view">
                <h1>Gestão Administrativa</h1>
                <button onClick={() => setTab('escolas')}>Unidades / Escolas</button>
                <button onClick={() => setTab('professores')}>Corpo Docente</button>
                <button onClick={() => setTab('turmas')}>Turmas / Classes</button>

                {tab === 'professores' && <div>Lista de Professores</div>}
                {tab === 'turmas' && <div>Turmas Ativas</div>}
            </div>
        );
    }
}));

vi.mock('@/components/Dashboard/Settings/SettingsView', () => ({
    SettingsView: () => {
        const [tab, setTab] = (window as any).React.useState('general');
        return (
            <div data-testid="settings-view">
                <h1>Configurações do Sistema</h1>
                <button onClick={() => setTab('users')}>Controle de Usuários</button>
                {tab === 'users' && <div>Novo Usuário</div>}
            </div>
        );
    }
}));

// Provide React to the global scope for the mocks above
(window as any).React = require('react');

describe('VínculoTEAFull Integration Tests', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Default mock for useAuth
        vi.mock('@/lib/useAuth', () => ({
            useAuth: () => ({
                user: { id: 'u123', nome: 'Admin User', email: 'admin@test.com', tipo: 'Administrador', plataforma_id: 1 },
                permissions: {
                    canViewStudents: true,
                    canViewGerenciamento: true,
                    canViewDisciplines: true,
                    canViewReports: true,
                    canViewSettings: true
                },
                loading: false
            })
        }));

        const mockQuery = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            count: vi.fn().mockResolvedValue({ count: 5, error: null }),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            upsert: vi.fn().mockReturnThis(),
            then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve)
        };
        (supabase.from as any).mockImplementation(() => mockQuery);

        (supabase.channel as any) = vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis()
        });

        (supabase.removeChannel as any) = vi.fn().mockResolvedValue({ error: null });
    });

    describe('Environment & Core', () => {
        it('renders the Dashboard shell for an authenticated user', async () => {
            const { Dashboard } = await import('@/components/Dashboard/Dashboard');
            render(<Dashboard user={{ id: 'u123', email: 'admin@test.com', role: 'ADMINISTRADOR' }} onLogout={vi.fn()} />);

            expect(screen.getByText(/Seja bem vindo/i)).toBeInTheDocument();
            expect(screen.getAllByText(/Alunos/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Gerenciamento/i).length).toBeGreaterThan(0);
        }, 20000);
    });

    describe('Student Gerenciamento UI', () => {
        it('opens the Student Registration Wizard', async () => {
            const { Dashboard } = await import('@/components/Dashboard/Dashboard');
            render(<Dashboard user={{ id: 'u123', email: 'admin@test.com', role: 'ADMINISTRADOR' }} onLogout={vi.fn()} />);

            // Click "Alunos" in sidebar (using find to handle multi-render if any)
            const alunosBtn = await screen.findAllByRole('button', { name: /Alunos/i });
            fireEvent.click(alunosBtn[0]);

            // Wait for "Matricular Novo"
            await waitFor(() => {
                expect(screen.getByText(/Matricular Novo/i)).toBeInTheDocument();
            }, { timeout: 10000 });

            fireEvent.click(screen.getByText(/Matricular Novo/i));

            await waitFor(() => {
                expect(screen.getByText(/Novo Aluno\/PEI/i)).toBeInTheDocument();
            });
        }, 20000);
    });

    describe('Gerenciamento & Settings Navigation', () => {
        it('navigates through Gerenciamento tabs (Schools, Teachers, Classes)', async () => {
            const { Dashboard } = await import('@/components/Dashboard/Dashboard');
            render(<Dashboard user={{ id: 'u123', email: 'admin@test.com', role: 'ADMINISTRADOR' }} onLogout={vi.fn()} />);

            const mgmtBtn = await screen.findAllByRole('button', { name: /Gerenciamento/i });
            fireEvent.click(mgmtBtn[0]);

            await waitFor(() => {
                expect(screen.getByText(/Gestão Administrativa/i)).toBeInTheDocument();
            }, { timeout: 10000 });

            // Check if tab buttons exist in the mock
            expect(screen.getByText(/Unidades \/ Escolas/i)).toBeInTheDocument();
            expect(screen.getByText(/Corpo Docente/i)).toBeInTheDocument();
            expect(screen.getByText(/Turmas \/ Classes/i)).toBeInTheDocument();

            // Click Teachers tab in the mock
            fireEvent.click(screen.getByText(/Corpo Docente/i));
            await waitFor(() => {
                expect(screen.getByText(/Lista de Professores/i)).toBeInTheDocument();
            });

            // Click Classes tab in the mock
            fireEvent.click(screen.getByText(/Turmas \/ Classes/i));
            await waitFor(() => {
                expect(screen.getByText(/Turmas Ativas/i)).toBeInTheDocument();
            });
        }, 20000);

        it('navigates to Settings and User Gerenciamento', async () => {
            const { Dashboard } = await import('@/components/Dashboard/Dashboard');
            render(<Dashboard user={{ id: 'u123', email: 'admin@test.com' }} onLogout={vi.fn()} />);

            const settingsBtn = await screen.findAllByRole('button', { name: /Ajustes/i });
            fireEvent.click(settingsBtn[0]);

            await waitFor(() => {
                expect(screen.getByText(/Configurações do Sistema/i)).toBeInTheDocument();
            }, { timeout: 10000 });

            fireEvent.click(screen.getByText(/Controle de Usuários/i));
            await waitFor(() => {
                expect(screen.getByText(/Novo Usuário/i)).toBeInTheDocument();
            });
        }, 20000);
    });

    describe('Global Features', () => {
        it('triggers Search Modal with Ctrl+K', async () => {
            const { Dashboard } = await import('@/components/Dashboard/Dashboard');
            render(<Dashboard user={{ id: 'u123', email: 'admin@test.com' }} onLogout={vi.fn()} />);

            fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Pesquisar em todo o sistema/i)).toBeInTheDocument();
            });
        });

        it('shows and hides Notification center', async () => {
            const { Dashboard } = await import('@/components/Dashboard/Dashboard');
            render(<Dashboard user={{ id: 'u123', email: 'admin@test.com' }} onLogout={vi.fn()} />);

            const bellBtn = screen.getByTestId('notification-bell');
            fireEvent.click(bellBtn);

            expect(screen.getByTestId('notification-panel-title')).toBeInTheDocument();
        });
    });
});
