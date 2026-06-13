import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Bolao, Jogo, Palpite, SupabaseService } from '../../core/supabase.service';

interface MeuPalpiteItem {
  bolao: Bolao;
  jogo: Jogo | null;
  palpite: Palpite | null;
}

const FASE_LABELS: Record<string, string> = {
  grupos: 'Fase de Grupos',
  dezesseis_avos: '16 avos de Final',
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semi: 'Semifinal',
  terceiro_lugar: 'Disputa de 3º Lugar',
  final: 'Final',
};

@Component({
  selector: 'app-meus-palpites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-4xl p-4 md:p-8">
      <div class="mb-6 flex items-center gap-4">
        <a routerLink="/admin/criar-bolao" class="text-slate-400 transition-colors hover:text-white">← Voltar</a>
        <h1 class="text-2xl font-bold text-emerald-400">📋 Meus Palpites</h1>
      </div>

      <div *ngIf="loading()" class="py-16 text-center text-slate-400">Carregando...</div>

      <div
        *ngIf="!loading() && items().length === 0"
        class="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 py-10 text-center text-slate-400"
      >
        Você ainda não participa de nenhum bolão.
        <div class="mt-4">
          <a routerLink="/bolao/entrar" class="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
            Entrar em um bolão
          </a>
        </div>
      </div>

      <div class="space-y-6">
        <div
          *ngFor="let item of items()"
          class="rounded-2xl border border-slate-700 bg-slate-800 p-5"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-emerald-400">{{ item.bolao.nome }}</h2>
              <p class="text-sm text-slate-400">
                Código: <span class="font-mono">{{ item.bolao.codigo }}</span>
              </p>
            </div>
            <a
              [routerLink]="['/bolao', item.bolao.codigo]"
              class="flex-shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
            >
              Ver bolão →
            </a>
          </div>

          <div *ngIf="!item.jogo" class="text-sm text-slate-500">
            Nenhum jogo cadastrado neste bolão ainda.
          </div>

          <ng-container *ngIf="item.jogo as jogo">
            <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{{ faseLabel(jogo.fase) }}</span>
                <div class="flex items-center gap-2">
                  <span *ngIf="jogo.encerrado" class="rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300">Encerrado</span>
                  <span class="text-xs text-slate-400">{{ jogo.data_jogo | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <div class="mb-3 flex items-center justify-center gap-4">
                <span class="flex-1 text-right text-lg font-bold">{{ jogo.time_a }}</span>
                <span class="font-bold text-slate-400">×</span>
                <span class="flex-1 text-lg font-bold">{{ jogo.time_b }}</span>
              </div>

              <div *ngIf="jogo.encerrado" class="mb-3 text-center">
                <span class="text-sm text-slate-400">Placar final: </span>
                <span class="font-bold text-white">{{ jogo.placar_a }} × {{ jogo.placar_b }}</span>
              </div>

              <ng-container *ngIf="item.palpite; else semPalpite">
                <div *ngIf="!jogo.encerrado" class="text-center text-sm text-slate-300">
                  Seu palpite:
                  <span class="font-semibold text-white">{{ item.palpite.palpite_a }} × {{ item.palpite.palpite_b }}</span>
                  <span class="ml-2 text-xs text-amber-400">🎯 1 ponto apostado</span>
                </div>

                <div *ngIf="jogo.encerrado" class="flex flex-wrap items-center justify-center gap-4 rounded-xl bg-slate-700/50 p-3">
                  <div class="text-center">
                    <p class="mb-1 text-xs text-slate-400">Seu palpite</p>
                    <p class="text-lg font-bold text-white">{{ item.palpite.palpite_a }} × {{ item.palpite.palpite_b }}</p>
                  </div>
                  <div class="text-center">
                    <span
                      *ngIf="item.palpite.pontos_ganhos > 0"
                      class="rounded-full bg-emerald-800 px-3 py-1 text-sm font-bold text-emerald-300"
                    >
                      ✓ Acertou! +{{ item.palpite.pontos_ganhos | number: '1.1-2' }}pts
                    </span>
                    <span
                      *ngIf="item.palpite.pontos_ganhos === 0"
                      class="rounded-full bg-red-900/50 px-3 py-1 text-sm font-bold text-red-400"
                    >
                      ✗ Você perdeu seu ponto
                    </span>
                  </div>
                </div>
              </ng-container>

              <ng-template #semPalpite>
                <p class="text-center text-sm text-slate-500">Sem palpite registrado.</p>
              </ng-template>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class MeusPalpitesComponent {
  private readonly db = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly items = signal<MeuPalpiteItem[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.loadData();
  }

  faseLabel(fase: string): string {
    return FASE_LABELS[fase] ?? fase;
  }

  private async loadData(): Promise<void> {
    await this.auth.ensureSessionLoaded();
    const user = this.auth.currentUser();

    if (!user) {
      await this.router.navigate(['/auth/login']);
      return;
    }

    const { data, error } = await this.db.getMeusPalpites(user.id);

    if (!error && data) {
      const { boloes, jogos, palpites } = data;
      const items: MeuPalpiteItem[] = boloes.map((bolao) => {
        const jogo = jogos.find((j) => j.bolao_id === bolao.id) ?? null;
        const palpite = jogo ? (palpites.find((p) => p.jogo_id === jogo.id) ?? null) : null;
        return { bolao, jogo, palpite };
      });
      this.items.set(items);
    }

    this.loading.set(false);
  }
}
