import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Jogo } from '../../../core/supabase.service';

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
  selector: 'app-jogo-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{{ faseLabel(jogo.fase) }}</span>
        <span class="text-xs text-slate-400">{{ jogo.data_jogo | date: 'dd/MM HH:mm' }}</span>
      </div>
      <div class="flex items-center justify-center gap-4">
        <span class="flex-1 text-right text-lg font-bold">{{ jogo.time_a }}</span>
        <span *ngIf="jogo.encerrado; else versus" class="text-xl font-bold text-white">{{ jogo.placar_a }} × {{ jogo.placar_b }}</span>
        <ng-template #versus>
          <span class="text-slate-400">×</span>
        </ng-template>
        <span class="flex-1 text-lg font-bold">{{ jogo.time_b }}</span>
      </div>
    </div>
  `,
})
export class JogoCardComponent {
  @Input({ required: true }) jogo!: Jogo;

  faseLabel(fase: string): string {
    return FASE_LABELS[fase] ?? fase;
  }
}
