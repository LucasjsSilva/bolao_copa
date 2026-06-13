import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-entrar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl items-center px-4 py-10">
      <div class="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span class="mb-4 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
            Copa do Mundo • Bolão colaborativo
          </span>
          <h1 class="mb-4 text-4xl font-bold text-white md:text-5xl">Organize palpites, acompanhe jogos e dispute o topo do ranking.</h1>
          <p class="mb-6 max-w-2xl text-lg text-slate-300">
            Entre em um bolão com o código compartilhado pelo administrador ou faça login para criar o seu próprio grupo.
          </p>
          <div class="flex flex-wrap gap-3">
            <a [routerLink]="auth.isLoggedIn() ? '/admin/criar-bolao' : '/auth/login'" class="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700">
              {{ auth.isLoggedIn() ? 'Gerenciar meus bolões' : 'Fazer login' }}
            </a>
            <a *ngIf="auth.isLoggedIn()" routerLink="/admin/criar-bolao" class="rounded-lg border border-slate-600 px-5 py-3 font-semibold text-slate-100 transition-colors hover:bg-slate-800">
              Criar bolão
            </a>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl shadow-slate-950/40">
          <h2 class="mb-2 text-2xl font-semibold text-emerald-400">Entrar com código</h2>
          <p class="mb-6 text-sm text-slate-400">Digite o código de 6 caracteres para abrir a área pública do bolão.</p>

          <form class="space-y-4" (ngSubmit)="abrirBolao()">
            <div>
              <label class="mb-1 block text-sm text-slate-400">Código do bolão</label>
              <input
                type="text"
                [(ngModel)]="codigo"
                name="codigo"
                maxlength="12"
                required
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-center text-xl font-mono uppercase tracking-[0.35em] text-white focus:border-emerald-500 focus:outline-none"
                placeholder="ABC123"
              />
            </div>
            <button type="submit" class="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700">
              Abrir bolão
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class EntrarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  codigo = '';

  async abrirBolao(): Promise<void> {
    const codigo = this.codigo.trim().toUpperCase();
    if (!codigo) {
      return;
    }

    await this.router.navigate(['/bolao', codigo]);
  }
}
