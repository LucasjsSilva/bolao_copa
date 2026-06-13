import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Bolao, SupabaseService } from '../../../core/supabase.service';

@Component({
  selector: 'app-criar-bolao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-3xl p-4 md:p-8">
      <div class="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-emerald-400">Seus bolões</h1>
          <p class="text-slate-400">Crie um bolão, compartilhe o código e gerencie os jogos da Copa.</p>
        </div>
        <a routerLink="/bolao/entrar" class="text-sm text-slate-300 transition-colors hover:text-white">Entrar com código →</a>
      </div>

      <div class="mb-8 rounded-2xl border border-slate-700 bg-slate-800 p-6">
        <h2 class="mb-4 text-xl font-semibold">Novo bolão</h2>
        <form class="space-y-4" (ngSubmit)="criar()">
          <div>
            <label class="mb-1 block text-sm text-slate-400">Nome do bolão</label>
            <input
              type="text"
              [(ngModel)]="nome"
              name="nome"
              required
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="Ex: Copa 2026 - Família Silva"
            />
          </div>

          <div *ngIf="errorMsg()" class="rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
            {{ errorMsg() }}
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {{ loading() ? 'Criando...' : 'Criar bolão' }}
          </button>
        </form>
      </div>

      <div *ngIf="meusBoloes().length > 0; else emptyState">
        <h2 class="mb-4 text-xl font-semibold">Meus bolões</h2>
        <div class="space-y-3">
          <div *ngFor="let bolao of meusBoloes()" class="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div>
              <p class="font-semibold">{{ bolao.nome }}</p>
              <p class="text-sm text-slate-400">
                Código:
                <span class="rounded bg-slate-700 px-2 py-0.5 font-mono text-emerald-400">{{ bolao.codigo }}</span>
              </p>
            </div>
            <a [routerLink]="['/admin/bolao', bolao.id, 'jogos']" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
              Gerenciar
            </a>
          </div>
        </div>
      </div>

      <ng-template #emptyState>
        <div class="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 p-8 text-center text-slate-400">
          Você ainda não criou nenhum bolão.
        </div>
      </ng-template>
    </div>
  `,
})
export class CriarBolaoComponent {
  private readonly db = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly meusBoloes = signal<Bolao[]>([]);

  nome = '';

  constructor() {
    void this.loadBoloes();
  }

  async criar(): Promise<void> {
    if (!this.nome.trim()) {
      return;
    }

    this.errorMsg.set('');
    this.loading.set(true);

    try {
      await this.auth.ensureSessionLoaded();
      const user = this.auth.currentUser();
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      const { data, error } = await this.db.createBolao(this.nome.trim(), this.gerarCodigo(), user.id);
      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error('Não foi possível criar o bolão.');
      }

      await this.loadBoloes();
      await this.router.navigate(['/admin/bolao', data.id, 'jogos']);
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Erro ao criar bolão.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBoloes(): Promise<void> {
    await this.auth.ensureSessionLoaded();
    const user = this.auth.currentUser();
    if (!user) {
      this.meusBoloes.set([]);
      return;
    }

    const { data } = await this.db.getMyBoloes(user.id);
    this.meusBoloes.set(data ?? []);
  }

  private gerarCodigo(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
  }
}
