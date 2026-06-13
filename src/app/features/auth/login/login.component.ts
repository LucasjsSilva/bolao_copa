import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { SupabaseService } from '../../../core/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <h1 class="mb-2 text-4xl font-bold text-emerald-400">⚽ Bolão Copa</h1>
          <p class="text-slate-400">Crie bolões, convide amigos e acompanhe a Copa do Mundo.</p>
        </div>

        <!-- Username setup (shown after login when no profile exists) -->
        <div *ngIf="showUsernameSetup()" class="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl shadow-slate-950/30">
          <h2 class="mb-2 text-xl font-bold text-emerald-400">Configure seu username</h2>
          <p class="mb-6 text-slate-400">Escolha um nome que aparecerá nos bolões que você participar.</p>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm text-slate-400">Username</label>
              <input
                type="text"
                [(ngModel)]="newUsername"
                name="newUsername"
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="Seu nome no bolão"
              />
            </div>

            <div *ngIf="usernameError()" class="rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
              {{ usernameError() }}
            </div>

            <button
              type="button"
              (click)="saveUsername()"
              [disabled]="savingUsername()"
              class="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {{ savingUsername() ? 'Salvando...' : 'Salvar e continuar' }}
            </button>
          </div>
        </div>

        <!-- Login / Register form -->
        <div *ngIf="!showUsernameSetup()" class="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-2xl shadow-slate-950/30">
          <div class="mb-6 flex gap-2 rounded-xl bg-slate-900 p-1">
            <button
              type="button"
              (click)="mode.set('login')"
              [class]="mode() === 'login' ? 'flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white' : 'flex-1 rounded-lg py-2 text-sm text-slate-400 transition-colors hover:text-white'"
            >
              Entrar
            </button>
            <button
              type="button"
              (click)="mode.set('register')"
              [class]="mode() === 'register' ? 'flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white' : 'flex-1 rounded-lg py-2 text-sm text-slate-400 transition-colors hover:text-white'"
            >
              Criar conta
            </button>
          </div>

          <form class="space-y-4" (ngSubmit)="submit()">
            <div>
              <label class="mb-1 block text-sm text-slate-400">E-mail</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-slate-400">Senha</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                minlength="6"
                class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div *ngIf="errorMsg()" class="rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
              {{ errorMsg() }}
            </div>
            <div *ngIf="successMsg()" class="rounded-lg border border-emerald-700 bg-emerald-900/40 p-3 text-sm text-emerald-200">
              {{ successMsg() }}
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {{ loading() ? 'Aguarde...' : (mode() === 'login' ? 'Entrar' : 'Criar conta') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly db = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');
  readonly showUsernameSetup = signal(false);
  readonly savingUsername = signal(false);
  readonly usernameError = signal('');

  email = '';
  password = '';
  newUsername = '';

  async submit(): Promise<void> {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.loading.set(true);

    try {
      if (this.mode() === 'login') {
        const { error } = await this.auth.signInWithEmail(this.email, this.password);
        if (error) {
          throw error;
        }

        const user = this.auth.currentUser();
        if (user) {
          const { data: profile } = await this.db.getProfile(user.id);
          if (!profile) {
            this.showUsernameSetup.set(true);
            return;
          }
        }

        await this.router.navigate(['/admin/criar-bolao']);
        return;
      }

      const { error } = await this.auth.signUpWithEmail(this.email, this.password);
      if (error) {
        throw error;
      }
      this.successMsg.set('Conta criada! Confirme o e-mail no Supabase para concluir o acesso.');
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Erro ao autenticar.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveUsername(): Promise<void> {
    const username = this.newUsername.trim();
    if (!username) {
      this.usernameError.set('Username é obrigatório.');
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.usernameError.set('Usuário não encontrado. Faça login novamente.');
      return;
    }

    this.savingUsername.set(true);
    this.usernameError.set('');

    try {
      const { error } = await this.db.upsertProfile(user.id, username);
      if (error) throw error;
      await this.router.navigate(['/admin/criar-bolao']);
    } catch (err: unknown) {
      this.usernameError.set(err instanceof Error ? err.message : 'Erro ao salvar username.');
    } finally {
      this.savingUsername.set(false);
    }
  }
}

