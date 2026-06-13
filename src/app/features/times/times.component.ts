import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { SupabaseService, Time } from '../../core/supabase.service';

interface GrupoTimes {
  grupo: string;
  times: Time[];
}

@Component({
  selector: 'app-times',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-6xl p-4 md:p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-emerald-400">⚽ Times da Copa do Mundo 2026</h1>
        <p class="mt-1 text-slate-400">48 seleções divididas em 12 grupos</p>
      </div>

      <div *ngIf="carregando()" class="flex items-center justify-center py-16">
        <span class="text-slate-400">Carregando times...</span>
      </div>

      <div *ngIf="erro()" class="rounded-lg border border-red-700 bg-red-900/40 p-4 text-red-200">
        {{ erro() }}
      </div>

      <div *ngIf="!carregando() && !erro()" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          *ngFor="let g of grupos()"
          class="rounded-xl border border-slate-700 bg-slate-800 p-5"
        >
          <h2 class="mb-3 text-lg font-bold text-emerald-400">Grupo {{ g.grupo }}</h2>
          <ul class="space-y-2">
            <li *ngFor="let time of g.times" class="flex items-center gap-3">
              <span class="text-2xl leading-none">{{ time.bandeira_emoji }}</span>
              <span class="text-slate-100">{{ time.nome }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class TimesComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly grupos = signal<GrupoTimes[]>([]);

  async ngOnInit(): Promise<void> {
    const { data, error } = await this.supabase.getTimes();

    if (error) {
      this.erro.set('Não foi possível carregar os times. Tente novamente mais tarde.');
      this.carregando.set(false);
      return;
    }

    const map = new Map<string, Time[]>();
    for (const time of data ?? []) {
      if (!map.has(time.grupo)) {
        map.set(time.grupo, []);
      }
      map.get(time.grupo)!.push(time);
    }

    this.grupos.set(
      Array.from(map.entries()).map(([grupo, times]) => ({ grupo, times })),
    );
    this.carregando.set(false);
  }
}
