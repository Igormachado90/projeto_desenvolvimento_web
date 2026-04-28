import { describe, it, expect } from 'vitest';
import { getPermissions } from '@/lib/useAuth';

describe('Security & Permissions Logic', () => {
    it('returns correct permissions for Administrador', () => {
        const permissions = getPermissions('Administrador');
        expect(permissions.canManageUsers).toBe(true);
        expect(permissions.canDeleteStudents).toBe(true);
        expect(permissions.canViewAllSchools).toBe(true);
    });

    it('returns correct permissions for Profissional', () => {
        const permissions = getPermissions('Profissional');
        expect(permissions.canManageUsers).toBe(false);
        expect(permissions.canDeleteStudents).toBe(false);
        expect(permissions.canEditClasses).toBe(true);
    });

    it('returns correct permissions for Tutor', () => {
        const permissions = getPermissions('Tutor');
        expect(permissions.canEditStudents).toBe(false);
        expect(permissions.canViewGerenciamento).toBe(false);
        expect(permissions.canViewStudents).toBe(true);
    });

    it('returns correct permissions for Família', () => {
        const permissions = getPermissions('Família');
        expect(permissions.canEditStudents).toBe(false);
        expect(permissions.canViewDisciplines).toBe(false);
        expect(permissions.canViewReports).toBe(true);
    });

    it('defaults to Família permissions for unknown roles', () => {
        const permissions = getPermissions('UnknownRole' as any);
        expect(permissions).toEqual(getPermissions('Família'));
    });
});
