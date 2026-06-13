import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RankingEntry } from '../../../core/supabase.service';

@Component({
  selector: 'app-ranking-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700 text-left text-sm text-slate-400">
            <th class="pb-3 pr-4">#</th>
            <th class="pb-3 pr-4">Participante</th>
            <th class="pb-3 pr-4 text-right">Acertos</th>
            <th class="pb-3 text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let entry of entries; let i = index" class="border-b border-slate-700/50 last:border-0">
            <td class="py-3 pr-4 font-bold text-slate-400">{{ i + 1 }}</td>
            <td class="py-3 pr-4">{{ entry.nome_exibicao }}</td>
            <td class="py-3 pr-4 text-right text-slate-300">{{ entry.acertos }}</td>
            <td class="py-3 text-right font-bold text-emerald-400">{{ entry.total_pontos | number: '1.1-2' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class RankingTableComponent {
  @Input() entries: RankingEntry[] = [];
}
