import { Page, expect } from '@playwright/test';

export class DashboardPage {
    constructor(public page: Page) { }

    async goToStudents() {
        await this.page.click('role=button[name=/Alunos/i]');
    }

    async goToGerenciamento() {
        await this.page.click('role=button[name=/Gerenciamento/i]');
    }

    async goToSettings() {
        await this.page.click('role=button[name=/Ajustes/i]');
    }

    async openSearch() {
        await this.page.keyboard.press('Control+K');
        await expect(this.page.getByTestId('search-input')).toBeVisible();
    }

    async openGlobalSearch() {
        return this.openSearch();
    }

    async checkNotification() {
        await this.page.click('[data-testid="notification-bell"]');
        await expect(this.page.getByTestId('notification-panel-title')).toBeVisible();
    }
}
