import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { PEIPage } from './pages/PEIPage';
import { GerenciamentoPage } from './pages/GerenciamentoPage';

test.describe('VínculoTEA E2E Robust Suite', () => {
    let loginPage: LoginPage;
    let dashboard: DashboardPage;
    let students: StudentsPage;
    let pei: PEIPage;
    let Gerenciamento: GerenciamentoPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboard = new DashboardPage(page);
        students = new StudentsPage(page);
        pei = new PEIPage(page);
        Gerenciamento = new GerenciamentoPage(page);

        await loginPage.navigate();
        await loginPage.login('admin@vinculotea.com', 'admin123456');

        // Wait for dashboard OR error message
        const dashboardIndicator = page.locator('text=Navegação');
        const errorIndicator = page.getByTestId('login-error');

        await Promise.race([
            dashboardIndicator.waitFor({ state: 'visible', timeout: 15000 }),
            errorIndicator.waitFor({ state: 'visible', timeout: 15000 }).then(async () => {
                const msg = await loginPage.getErrorMessage();
                throw new Error(`Falha no Login E2E: ${msg}. Certifique-se de que o usuário 'admin@vinculotea.com' / 'admin123456' existe no banco.`);
            })
        ]);
    });

    test('Fluxo Core: Cadastro de Aluno e Persistência de PEI com Texto Longo', async ({ page }) => {
        const studentName = `Aluno Playwright ${Date.now()}`;

        await dashboard.goToStudents();
        await students.createStudent(studentName);

        // Verify creation
        await page.reload(); // Hard refresh to test real persistence
        await dashboard.goToStudents();
        await expect(page.locator(`text=${studentName}`)).toBeVisible();

        await students.openStudentDetail(studentName);

        // PEI Persistence with Long Text
        const longDiagnosis = "Paciente TEA Nível 1 de suporte... " + "REQUISITO_PERSISTENCIA_LONG_TEXT_".repeat(20);

        // Intercept Supabase API to validate payload
        const apiPromise = page.waitForResponse(resp =>
            resp.url().includes('/rest/v1/PEIs') && resp.request().method() === 'POST'
        );

        await pei.createPEI('2024', longDiagnosis);

        const response = await apiPromise;
        const sentData = JSON.parse(response.request().postData() || '[]');
        expect(sentData[0].dados.diagnosticoMedico).toContain("REQUISITO_PERSISTENCIA");

        // Reload and verify persistence in UI
        await page.reload();
        await expect(page.locator(`text=${studentName}`)).toBeVisible();
        await students.openStudentDetail(studentName);
        await expect(page.locator(`text=${longDiagnosis}`)).toBeVisible();
    });

    test('Fluxo Administrativo: Gestão de Professores e Escolas', async ({ page }) => {
        await dashboard.goToGerenciamento();
        await Gerenciamento.createSchool('Escola E2E Playwright', 'Rua das Flores, 123');
        await Gerenciamento.createTeacher('Professor E2E', 'prof@e2e.com', '12345678900');

        // Verification is implicit in POM steps if it doesn't fail, 
        // but it's better to check list
        await expect(page.locator('text=Escola E2E Playwright')).toBeVisible();
        await expect(page.locator('text=Professor E2E')).toBeVisible();
    });

    test('Segurança & Global Search', async ({ page }) => {
        // Global Search with Ctrl+K
        await dashboard.openGlobalSearch();
        await page.keyboard.type('Aluno');
        await expect(page.locator('text=Resultados de busca')).toBeVisible();

        // Try invalid access or logout
        // (Scenario can be expanded)
    });

    test('Relatórios: Exportação PDF e Impressão', async ({ page }) => {
        await dashboard.goToStudents();
        // Trigger report
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('text=Relatórios PDF')
        ]);

        expect(download.suggestedFilename()).toContain('.pdf');

        // Simular evento de impressão
        await page.evaluate(() => window.print());
    });
});
