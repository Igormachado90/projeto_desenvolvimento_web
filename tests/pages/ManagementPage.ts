import { Page, expect } from '@playwright/test';

export class GerenciamentoPage {
    constructor(private page: Page) { }

    async createSchool(name: string, address?: string) {
        await this.page.click('text=Adicionar Escola');
        await this.page.fill('input[name="nome"]', name);
        if (address) {
            await this.page.fill('input[name="logradouro"]', address);
        }
        await this.page.click('text=Salvar Unidade');
    }

    async createTeacher(name: string, email: string, phoneOrPassword?: string) {
        await this.page.click('text=Corpo Docente');
        await this.page.click('text=Novo Profissional');
        await this.page.fill('input[name="nome"]', name);
        await this.page.fill('input[name="email"]', email);

        // If it's a new teacher, we need a password or phone
        if (phoneOrPassword) {
            const passwordInput = this.page.locator('input[name="senha"]');
            if (await passwordInput.isVisible()) {
                await passwordInput.fill(phoneOrPassword);
            }
            const phoneInput = this.page.locator('input[name="telefone"]');
            if (await phoneInput.isVisible()) {
                await phoneInput.fill(phoneOrPassword);
            }
        }

        // Select first available school if not selected
        const schoolSelect = this.page.locator('select[name="escola_id"]');
        const options = await schoolSelect.locator('option').all();
        if (options.length > 1) {
            await schoolSelect.selectOption({ index: 1 });
        }

        await this.page.click('button:has-text("Adicionar novo")');
    }
}
