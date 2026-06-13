import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService, Bolao, RankingEntry } from '../../../core/supabase.service';
import { RankingTableComponent } from '../../../shared/components/ranking-table/ranking-table.component';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterLink, RankingTableComponent],
  template: `
    <div class="mx-auto max-w-3xl p-4 md:p-8">
      <ng-container *ngIf="bolao() as currentBolao; else loadingState">
        <div class="mb-6 flex items-center gap-4">
          <a [routerLink]="['/bolao', currentBolao.codigo]" class="text-slate-400 transition-colors hover:text-white">← Voltar</a>
          <div>
            <h1 class="text-2xl font-bold text-emerald-400">🏆 Ranking</h1>
            <p class="text-slate-300">{{ currentBolao.nome }}</p>
          </div>
        </div>

        <div *ngIf="loading()" class="py-8 text-center text-slate-400">Carregando...</div>
        <div *ngIf="!loading() && ranking().length === 0" class="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 py-8 text-center text-slate-400">
          Sem dados de ranking ainda.
        </div>
        <div *ngIf="!loading() && ranking().length > 0" class="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <app-ranking-table [entries]="ranking()" />
        </div>
      </ng-container>

      <ng-template #loadingState>
        <div class="py-16 text-center text-slate-400">{{ loading() ? 'Carregando...' : 'Bolão não encontrado.' }}</div>
      </ng-template>
    </div>
  `,
})
export class RankingComponent {
  private readonly db = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);

  readonly bolao = signal<Bolao | null>(null);
  readonly ranking = signal<RankingEntry[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    const codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
    const { data: bolao } = await this.db.getBolaoByCode(codigo);
    this.bolao.set(bolao ?? null);

    if (bolao) {
      const { data } = await this.db.getRanking(bolao.id);
      this.ranking.set(data ?? []);
    }

    this.loading.set(false);
  }
}
