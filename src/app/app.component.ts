import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100">
      <nav class="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a routerLink="/bolao/entrar" class="text-xl font-bold text-emerald-400">⚽ Bolão Copa</a>
          <div class="flex items-center gap-3 text-sm">
            <a routerLink="/bolao/entrar" class="text-slate-300 transition-colors hover:text-white">Entrar em um bolão</a>
            <ng-container *ngIf="auth.isLoggedIn(); else loggedOutLinks">
              <a routerLink="/admin/criar-bolao" class="text-slate-300 transition-colors hover:text-white">Meus bolões</a>
              <span class="hidden text-slate-500 md:inline">{{ auth.currentUser()?.email }}</span>
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
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/auth/login']);
  }
}
