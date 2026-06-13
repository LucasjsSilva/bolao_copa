import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { SupabaseService } from './core/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100">
      <nav class="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a routerLink="/bolao/entrar" class="text-xl font-bold text-emerald-400">⚽ Bolão Copa</a>
          <div class="flex items-center gap-3 text-sm">
            <a routerLink="/bolao/entrar" class="text-slate-300 transition-colors hover:text-white">Entrar em um bolão</a>
            <ng-container *ngIf="auth.isLoggedIn(); else loggedOutLinks">
              <a routerLink="/meus-palpites" class="text-slate-300 transition-colors hover:text-white">Meus Palpites</a>
              <a routerLink="/admin/criar-bolao" class="text-slate-300 transition-colors hover:text-white">Meus bolões</a>
              <div class="relative">
                <button
                  type="button"
                  (click)="toggleEditUsername()"
                  class="text-sm transition-colors"
                  [class]="profileUsername() ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'"
                >
                  {{ profileUsername() ? 'Olá, ' + profileUsername() : 'Configurar username' }}
                </button>
                <div
                  *ngIf="showEditUsername()"
                  class="absolute right-0 top-full z-50 mt-2 min-w-[260px] rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-xl"
                >
                  <p class="mb-2 text-sm font-medium text-slate-300">Seu username</p>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      [(ngModel)]="editUsernameValue"
                      name="editUsername"
                      class="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="Username"
                    />
                    <button
                      type="button"
                      (click)="saveUsername()"
                      [disabled]="savingUsername()"
                      class="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {{ savingUsername() ? '...' : 'Salvar' }}
                    </button>
                  </div>
                  <p *ngIf="usernameError()" class="mt-2 text-xs text-red-400">{{ usernameError() }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="logout()"
                class="rounded-lg bg-red-600 px-3 py-1.5 text-white transition-colors hover:bg-red-700"
              >
                Sair
              </button>
            </ng-container>
            <ng-template #loggedOutLinks>
              <a routerLink="/auth/login" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-white transition-colors hover:bg-emerald-700">Login</a>
            </ng-template>
          </div>
        </div>
      </nav>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  private readonly db = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly profileUsername = signal<string | null>(null);
  readonly showEditUsername = signal(false);
  readonly savingUsername = signal(false);
  readonly usernameError = signal('');

  editUsernameValue = '';

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        void this.loadProfile(user.id);
      } else {
        this.profileUsername.set(null);
        this.showEditUsername.set(false);
      }
    });
  }

  toggleEditUsername(): void {
    this.editUsernameValue = this.profileUsername() ?? '';
    this.usernameError.set('');
    this.showEditUsername.update((v) => !v);
  }

  async saveUsername(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const username = this.editUsernameValue.trim();
    if (!username) {
      this.usernameError.set('Username não pode ser vazio.');
      return;
    }

    this.savingUsername.set(true);
    this.usernameError.set('');

    try {
      const { error } = await this.db.upsertProfile(user.id, username);
      if (error) throw error;
      this.profileUsername.set(username);
      this.showEditUsername.set(false);
    } catch (err: unknown) {
      this.usernameError.set(err instanceof Error ? err.message : 'Erro ao salvar username.');
    } finally {
      this.savingUsername.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/auth/login']);
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await this.db.getProfile(userId);
    this.profileUsername.set((data as { username?: string } | null)?.username ?? null);
    this.editUsernameValue = this.profileUsername() ?? '';
  }
}

