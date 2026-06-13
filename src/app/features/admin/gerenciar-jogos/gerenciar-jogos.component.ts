import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Bolao, Jogo, SupabaseService, Time } from '../../../core/supabase.service';

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
  selector: 'app-gerenciar-jogos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl p-4 md:p-8">
      <ng-container *ngIf="bolao() as currentBolao; else loadingState">
        <div class="mb-8 flex items-center gap-4">
          <a routerLink="/admin/criar-bolao" class="text-slate-400 transition-colors hover:text-white">← Voltar</a>
          <div>
            <h1 class="text-2xl font-bold text-emerald-400">{{ currentBolao.nome }}</h1>
            <p class="text-sm text-slate-400">
              Código:
              <span class="rounded bg-slate-700 px-2 py-0.5 font-mono text-emerald-400">{{ currentBolao.codigo }}</span>
            </p>
          </div>
        </div>

        <div class="mb-8 rounded-2xl border border-slate-700 bg-slate-800 p-6">
          <h2 class="mb-4 text-lg font-semibold">Adicionar jogo</h2>
          <ng-container *ngIf="jogos().length === 0; else jogoJaCadastrado">
            <form class="grid grid-cols-1 gap-4 md:grid-cols-2" (ngSubmit)="adicionarJogo()">
              <div>
                <label class="mb-1 block text-sm text-slate-400">Time A</label>
                <div class="team-selector relative">
                  <input
                    type="text"
                    [(ngModel)]="timeAQuery"
                    name="time_a"
                    required
                    (input)="onTimeInput('A')"
                    (focus)="onTimeFocus('A')"
                    autocomplete="off"
                    class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 pr-9 text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Digite para buscar"
                  />
                  <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">▼</span>
                  <div
                    *ngIf="showTimeADropdown()"
                    class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-700 py-1 shadow-lg"
                  >
                    <button
                      *ngFor="let time of filteredTimesA()"
                      type="button"
                      (click)="selectTime('A', time)"
                      class="block w-full px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:bg-slate-600"
                    >
                      {{ formatTimeDisplay(time) }}
                    </button>
                    <p *ngIf="filteredTimesA().length === 0" class="px-3 py-2 text-sm text-slate-400">Nenhum time encontrado</p>
                  </div>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm text-slate-400">Time B</label>
                <div class="team-selector relative">
                  <input
                    type="text"
                    [(ngModel)]="timeBQuery"
                    name="time_b"
                    required
                    (input)="onTimeInput('B')"
                    (focus)="onTimeFocus('B')"
                    autocomplete="off"
                    class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 pr-9 text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Digite para buscar"
                  />
                  <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">▼</span>
                  <div
                    *ngIf="showTimeBDropdown()"
                    class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-700 py-1 shadow-lg"
                  >
                    <button
                      *ngFor="let time of filteredTimesB()"
                      type="button"
                      (click)="selectTime('B', time)"
                      class="block w-full px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:bg-slate-600"
                    >
                      {{ formatTimeDisplay(time) }}
                    </button>
                    <p *ngIf="filteredTimesB().length === 0" class="px-3 py-2 text-sm text-slate-400">Nenhum time encontrado</p>
                  </div>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm text-slate-400">Data e hora</label>
                <input
                  type="datetime-local"
                  [(ngModel)]="novoJogo.data_jogo"
                  name="data_jogo"
                  required
                  class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-slate-400">Fase</label>
                <select
                  [(ngModel)]="novoJogo.fase"
                  name="fase"
                  class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="grupos">Fase de Grupos</option>
                  <option value="dezesseis_avos">16 avos de Final</option>
                  <option value="oitavas">Oitavas de Final</option>
                  <option value="quartas">Quartas de Final</option>
                  <option value="semi">Semifinal</option>
                  <option value="terceiro_lugar">Disputa de 3º Lugar</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <button
                  type="submit"
                  [disabled]="loadingAdd()"
                  class="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {{ loadingAdd() ? 'Adicionando...' : '+ Adicionar jogo' }}
                </button>
              </div>
            </form>
            <div *ngIf="errorMsg()" class="mt-3 rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
              {{ errorMsg() }}
            </div>
            <div *ngIf="loadingTimes()" class="mt-3 text-sm text-slate-400">Carregando times...</div>
          </ng-container>
          <ng-template #jogoJaCadastrado>
            <p class="text-slate-400">Este bolão já possui um jogo cadastrado.</p>
          </ng-template>
        </div>

        <div class="mb-4 flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold">Jogos ({{ jogos().length }})</h2>
          <a [routerLink]="['/bolao', currentBolao.codigo]" class="text-sm text-slate-300 transition-colors hover:text-white">Abrir página pública →</a>
        </div>

        <div *ngIf="jogos().length === 0" class="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 py-10 text-center text-slate-400">
          Nenhum jogo cadastrado ainda.
        </div>

        <div class="space-y-3">
          <div
            *ngFor="let jogo of jogos()"
            class="rounded-xl border bg-slate-800 p-4"
            [class]="jogo.encerrado ? 'border-slate-600' : 'border-slate-700'"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="mb-1 flex flex-wrap items-center gap-2">
                  <span class="text-lg font-semibold">{{ jogo.time_a }} × {{ jogo.time_b }}</span>
                  <span class="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{{ faseLabel(jogo.fase) }}</span>
                  <span *ngIf="jogo.encerrado" class="rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300">Encerrado</span>
                </div>
                <p class="text-sm text-slate-400">{{ jogo.data_jogo | date: 'dd/MM/yyyy HH:mm' }}</p>
                <p *ngIf="jogo.encerrado" class="mt-1 font-semibold text-emerald-400">Placar: {{ jogo.placar_a }} × {{ jogo.placar_b }}</p>
              </div>
              <div class="flex flex-shrink-0 gap-2">
                <button
                  *ngIf="!jogo.encerrado"
                  type="button"
                  (click)="abrirModal(jogo)"
                  class="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-amber-700"
                >
                  Encerrar
                </button>
                <button
                  type="button"
                  (click)="deletarJogo(jogo.id)"
                  class="rounded-lg bg-red-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-800"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p class="mb-1 text-sm text-slate-400">Link para os participantes:</p>
          <p class="break-all font-mono text-sm text-emerald-400">/bolao/{{ currentBolao.codigo }}</p>
        </div>
      </ng-container>

      <ng-template #loadingState>
        <div class="py-16 text-center text-slate-400">Carregando bolão...</div>
      </ng-template>
    </div>

    <div *ngIf="modalJogo() as jogo" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div class="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-6">
        <h3 class="mb-2 text-lg font-semibold">Encerrar jogo</h3>
        <p class="mb-4 text-slate-400">{{ jogo.time_a }} × {{ jogo.time_b }}</p>

        <div class="mb-6 flex items-center gap-4">
          <div class="flex-1 text-center">
            <label class="mb-1 block text-sm text-slate-400">{{ jogo.time_a }}</label>
            <input
              type="number"
              [(ngModel)]="placarA"
              min="0"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-center text-xl font-bold text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <span class="text-2xl font-bold text-slate-400">×</span>
          <div class="flex-1 text-center">
            <label class="mb-1 block text-sm text-slate-400">{{ jogo.time_b }}</label>
            <input
              type="number"
              [(ngModel)]="placarB"
              min="0"
              class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-center text-xl font-bold text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div *ngIf="modalError()" class="mb-4 rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
          {{ modalError() }}
        </div>

        <div class="flex gap-3">
          <button type="button" (click)="fecharModal()" class="flex-1 rounded-lg bg-slate-700 py-2.5 text-white transition-colors hover:bg-slate-600">
            Cancelar
          </button>
          <button
            type="button"
            (click)="encerrarJogo()"
            [disabled]="loadingModal()"
            class="flex-1 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {{ loadingModal() ? 'Salvando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class GerenciarJogosComponent {
  private readonly db = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);

  readonly bolao = signal<Bolao | null>(null);
  readonly jogos = signal<Jogo[]>([]);
  readonly loadingAdd = signal(false);
  readonly errorMsg = signal('');
  readonly modalJogo = signal<Jogo | null>(null);
  readonly loadingModal = signal(false);
  readonly modalError = signal('');
  readonly times = signal<Time[]>([]);
  readonly loadingTimes = signal(true);
  readonly showTimeADropdown = signal(false);
  readonly showTimeBDropdown = signal(false);

  readonly novoJogo = {
    time_a: '',
    time_b: '',
    data_jogo: '',
    fase: 'grupos',
  };

  timeAQuery = '';
  timeBQuery = '';
  placarA: number | null = null;
  placarB: number | null = null;
  private bolaoId = '';

  constructor() {
    this.bolaoId = this.route.snapshot.paramMap.get('id') ?? '';
    void this.loadData();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.team-selector')) {
      this.showTimeADropdown.set(false);
      this.showTimeBDropdown.set(false);
    }
  }

  formatTimeDisplay(time: Time): string {
    return `${time.bandeira_emoji ?? ''} ${time.nome}`.trim();
  }

  filteredTimesA(): Time[] {
    return this.filterTimes(this.timeAQuery);
  }

  filteredTimesB(): Time[] {
    return this.filterTimes(this.timeBQuery);
  }

  onTimeInput(team: 'A' | 'B'): void {
    if (team === 'A') {
      this.novoJogo.time_a = '';
      this.showTimeADropdown.set(true);
      return;
    }

    this.novoJogo.time_b = '';
    this.showTimeBDropdown.set(true);
  }

  onTimeFocus(team: 'A' | 'B'): void {
    if (team === 'A') {
      this.showTimeADropdown.set(false);
      return;
    }

    this.showTimeBDropdown.set(false);
  }

  selectTime(team: 'A' | 'B', time: Time): void {
    if (team === 'A') {
      this.novoJogo.time_a = time.nome;
      this.timeAQuery = this.formatTimeDisplay(time);
      this.showTimeADropdown.set(false);
      return;
    }

    this.novoJogo.time_b = time.nome;
    this.timeBQuery = this.formatTimeDisplay(time);
    this.showTimeBDropdown.set(false);
  }

  async adicionarJogo(): Promise<void> {
    if (!this.novoJogo.time_a || !this.novoJogo.time_b || !this.novoJogo.data_jogo) {
      return;
    }

    this.loadingAdd.set(true);
    this.errorMsg.set('');

    try {
      const { data, error } = await this.db.createJogo({
        bolao_id: this.bolaoId,
        time_a: this.novoJogo.time_a.trim(),
        time_b: this.novoJogo.time_b.trim(),
        data_jogo: new Date(this.novoJogo.data_jogo).toISOString(),
        fase: this.novoJogo.fase,
      });

      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error('Não foi possível adicionar o jogo.');
      }

      this.jogos.update((lista) => [...lista, data].sort((a, b) => new Date(a.data_jogo).getTime() - new Date(b.data_jogo).getTime()));
      this.novoJogo.time_a = '';
      this.novoJogo.time_b = '';
      this.timeAQuery = '';
      this.timeBQuery = '';
      this.novoJogo.data_jogo = '';
      this.novoJogo.fase = 'grupos';
    } catch (err: unknown) {
      this.errorMsg.set(err instanceof Error ? err.message : 'Erro ao adicionar jogo.');
    } finally {
      this.loadingAdd.set(false);
    }
  }

  async deletarJogo(id: string): Promise<void> {
    if (!globalThis.confirm('Remover este jogo?')) {
      return;
    }

    const { error } = await this.db.deleteJogo(id);
    if (!error) {
      this.jogos.update((lista) => lista.filter((jogo) => jogo.id !== id));
    }
  }

  abrirModal(jogo: Jogo): void {
    this.modalJogo.set(jogo);
    this.placarA = 0;
    this.placarB = 0;
    this.modalError.set('');
  }

  fecharModal(): void {
    this.modalJogo.set(null);
    this.placarA = null;
    this.placarB = null;
    this.modalError.set('');
  }

  faseLabel(fase: string): string {
    return FASE_LABELS[fase] ?? fase;
  }

  async encerrarJogo(): Promise<void> {
    const jogo = this.modalJogo();
    if (!jogo || this.placarA === null || this.placarB === null) {
      return;
    }

    this.loadingModal.set(true);
    this.modalError.set('');

    try {
      const placarA = this.placarA;
      const placarB = this.placarB;
      const { error } = await this.db.encerrarJogo(jogo.id, placarA, placarB);
      if (error) {
        throw error;
      }

      this.jogos.update((lista) =>
        lista.map((item) =>
          item.id === jogo.id
            ? { ...item, encerrado: true, placar_a: placarA, placar_b: placarB }
            : item,
        ),
      );
      this.fecharModal();
    } catch (err: unknown) {
      this.modalError.set(err instanceof Error ? err.message : 'Erro ao encerrar jogo.');
    } finally {
      this.loadingModal.set(false);
    }
  }

  private async loadData(): Promise<void> {
    const [{ data: bolao }, { data: jogos }, { data: times }] = await Promise.all([
      this.db.getBolaoById(this.bolaoId),
      this.db.getJogosByBolao(this.bolaoId),
      this.db.getTimes(),
    ]);

    this.bolao.set(bolao ?? null);
    this.jogos.set(jogos ?? []);
    this.times.set((times ?? []) as Time[]);
    this.loadingTimes.set(false);
  }

  private filterTimes(query: string): Time[] {
    const search = query.trim().toLowerCase();
    if (!search) {
      return this.times();
    }

    return this.times().filter((time) => time.nome.toLowerCase().includes(search));
  }
}
