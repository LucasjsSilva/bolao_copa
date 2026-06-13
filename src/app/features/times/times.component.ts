import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Time, SupabaseService } from '../../core/supabase.service';

interface Grupo {
  nome: string;
  times: Time[];
}

@Component({
  selector: 'app-times',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl p-4 md:p-8">
      <div class="mb-8 flex items-center gap-4">
        <a routerLink="/" class="text-slate-400 transition-colors hover:text-white">← Início</a>
        <div>
          <h1 class="text-2xl font-bold text-emerald-400">🌍 Times da Copa</h1>
          <p class="text-sm text-slate-400">Copa do Mundo 2026 — Grupos</p>
        </div>
      </div>

      <div *ngIf="loading()" class="py-16 text-center text-slate-400">Carregando times...</div>

      <div *ngIf="!loading() && grupos().length === 0" class="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 py-10 text-center text-slate-400">
        Nenhum time cadastrado ainda.
      </div>

      <div *ngIf="!loading() && grupos().length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          *ngFor="let grupo of grupos()"
          class="rounded-2xl border border-slate-700 bg-slate-800 p-4"
        >
          <h2 class="mb-3 text-center text-lg font-bold text-emerald-400">Grupo {{ grupo.nome }}</h2>
          <ul class="space-y-2">
            <li
              *ngFor="let time of grupo.times"
              class="flex items-center gap-3 rounded-lg bg-slate-700/50 px-3 py-2"
            >
              <span *ngIf="time.bandeira_emoji" class="text-xl">{{ time.bandeira_emoji }}</span>
              <span class="text-white">{{ time.nome }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class TimesComponent {
  private readonly db = inject(SupabaseService);

  readonly grupos = signal<Grupo[]>([]);
  readonly loading = signal(true);

  constructor() {
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    const { data } = await this.db.getTimes();
    if (data) {
      const gruposMap = new Map<string, Time[]>();
      for (const time of data) {
        if (!gruposMap.has(time.grupo)) {
          gruposMap.set(time.grupo, []);
        }
        gruposMap.get(time.grupo)!.push(time);
      }
      const grupos: Grupo[] = [];
      gruposMap.forEach((times, nome) => {
        grupos.push({ nome, times });
      });
      grupos.sort((a, b) => a.nome.localeCompare(b.nome));
      this.grupos.set(grupos);
    }
    this.loading.set(false);
  }
}
