import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
}

expect.extend(matchers);
import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset mocks between tests
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock Supabase
let authChangeCallback: any = null;
vi.mock('../src/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
            onAuthStateChange: vi.fn((callback) => {
                authChangeCallback = callback;
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            }),
            signInWithPassword: vi.fn(async ({ email, password }) => {
                // Simulate successful login if credentials are "correct"
                if (password === 'correctpassword') {
                    const session = { user: { id: 'user-123', email }, access_token: 'abc' };
                    if (authChangeCallback) authChangeCallback('SIGNED_IN', session);
                    return { data: { user: session.user, session }, error: null };
                }
                return { data: { user: null }, error: { message: 'Invalid login credentials' } };
            }),
            signOut: vi.fn(() => {
                if (authChangeCallback) authChangeCallback('SIGNED_OUT', null);
                return Promise.resolve({ error: null });
            }),
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        },
        from: vi.fn(() => {
            const queryBuilder: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
                limit: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                count: vi.fn().mockResolvedValue({ count: 0, error: null }),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                // Supabase queries are thenable
                then: (resolve: any) => resolve({ data: [], error: null }),
            };
            return queryBuilder;
        }),
    },
}));

// Mock Lucide Icons (to avoid issues with SVGs in tests)
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual as any,
        // Add any specific overrides if needed
    };
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
