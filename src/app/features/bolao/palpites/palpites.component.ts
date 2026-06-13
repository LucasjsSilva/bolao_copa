import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Bolao, Jogo, Palpite, Participante, SupabaseService } from '../../../core/supabase.service';

interface JogoComPalpite extends Jogo {
  palpite?: Palpite;
  palpite_a_input: number | null;
  palpite_b_input: number | null;
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
  selector: 'app-palpites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-4xl p-4 md:p-8">
      <div *ngIf="loading()" class="py-16 text-center text-slate-400">Carregando...</div>

      <ng-container *ngIf="!loading() && bolao() as currentBolao; else notFoundState">
        <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-emerald-400">{{ currentBolao.nome }}</h1>
            <p class="text-sm text-slate-400">Código: <span class="font-mono">{{ currentBolao.codigo }}</span></p>
          </div>
          <div class="flex flex-wrap gap-3">
            <a [routerLink]="['/bolao', currentBolao.codigo, 'ranking']" class="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-600">
              🏆 Ranking
            </a>
            <a routerLink="/bolao/entrar" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-slate-800">
              Outro código
            </a>
          </div>
        </div>

        <div *ngIf="!participante() && auth.isLoggedIn()" class="mb-6 rounded-2xl border border-amber-700 bg-amber-900/30 p-6">
          <h2 class="mb-2 font-semibold">Você ainda não participa deste bolão</h2>
          <form class="flex flex-col gap-3 md:flex-row" (ngSubmit)="entrar()">
            <input
              type="text"
              [(ngModel)]="nomeExibicao"
              name="nome"
              required
              class="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Seu nome no ranking"
            />
            <button
              type="submit"
              [disabled]="loadingEntrar()"
              class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {{ loadingEntrar() ? 'Entrando...' : 'Entrar no bolão' }}
            </button>
          </form>
          <div *ngIf="joinError()" class="mt-3 rounded-lg border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
            {{ joinError() }}
          </div>
        </div>

        <div *ngIf="!auth.isLoggedIn()" class="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center">
          <p class="mb-3 text-slate-400">Faça login para participar deste bolão e enviar seus palpites.</p>
          <a routerLink="/auth/login" class="inline-block rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-emerald-700">
            Fazer login
          </a>
        </div>

        <div class="space-y-4">
          <div
            *ngFor="let jogo of jogos()"
            class="rounded-2xl border bg-slate-800 p-5 transition-colors"
            [class]="jogo.encerrado ? 'border-slate-600' : (jogo.palpite ? 'border-emerald-700' : 'border-slate-700')"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{{ faseLabel(jogo.fase) }}</span>
                <span *ngIf="jogo.encerrado" class="rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-300">Encerrado</span>
                <span *ngIf="!jogo.encerrado && jogo.palpite" class="text-emerald-400 text-sm font-bold">✓</span>
              </div>
              <span class="text-xs text-slate-400">{{ jogo.data_jogo | date: 'dd/MM HH:mm' }}</span>
            </div>

            <div class="mb-4 flex items-center justify-center gap-4">
              <span class="flex-1 text-right text-lg font-bold">{{ jogo.time_a }}</span>
              <span class="font-bold text-slate-400">×</span>
              <span class="flex-1 text-lg font-bold">{{ jogo.time_b }}</span>
            </div>

            <div *ngIf="jogo.encerrado" class="mb-3 text-center">
              <span class="text-sm text-slate-400">Placar final: </span>
              <span class="font-bold text-white">{{ jogo.placar_a }} × {{ jogo.placar_b }}</span>
            </div>

            <ng-container *ngIf="participante()">
              <div *ngIf="!jogo.encerrado && !isJogoComecou(jogo)">
                <div class="flex items-center justify-center gap-3">
                  <input
                    type="number"
                    [(ngModel)]="jogo.palpite_a_input"
                    min="0"
                    class="w-16 rounded-lg border border-slate-600 bg-slate-700 p-2 text-center text-xl font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span class="text-slate-400">×</span>
                  <input
                    type="number"
                    [(ngModel)]="jogo.palpite_b_input"
                    min="0"
                    class="w-16 rounded-lg border border-slate-600 bg-slate-700 p-2 text-center text-xl font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    (click)="salvarPalpite(jogo)"
                    [disabled]="savingId() === jogo.id"
                    class="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {{ savingId() === jogo.id ? 'Salvando...' : (jogo.palpite ? 'Atualizar' : 'Salvar') }}
                  </button>
                </div>
              </div>

              <div *ngIf="jogo.palpite && (jogo.encerrado || isJogoComecou(jogo))" class="text-center">
                <div *ngIf="jogo.encerrado; else emAndamento" class="flex items-center justify-center gap-6 rounded-xl bg-slate-700/50 p-3">
                  <div class="text-center">
                    <p class="text-xs text-slate-400 mb-1">Placar real</p>
                    <p class="font-bold text-white text-lg">{{ jogo.placar_a }} × {{ jogo.placar_b }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-xs text-slate-400 mb-1">Seu palpite</p>
                    <p class="font-bold text-lg" [class]="jogo.palpite.pontos_ganhos > 0 ? 'text-emerald-400' : 'text-red-400'">
                      {{ jogo.palpite.palpite_a }} × {{ jogo.palpite.palpite_b }}
                    </p>
                  </div>
                  <div class="text-center">
                    <span *ngIf="jogo.palpite.pontos_ganhos > 0" class="rounded-full bg-emerald-800 px-3 py-1 text-sm font-bold text-emerald-300">
                      ✓ Acertou! +{{ jogo.palpite.pontos_ganhos | number: '1.1-2' }}pts
                    </span>
                    <span *ngIf="jogo.palpite.pontos_ganhos === 0" class="rounded-full bg-red-900/50 px-3 py-1 text-sm font-bold text-red-400">
                      ✗ Errou
                    </span>
                  </div>
                </div>
                <ng-template #emAndamento>
                  <p class="text-sm text-slate-400">
                    Seu palpite: <span class="font-semibold text-white">{{ jogo.palpite.palpite_a }} × {{ jogo.palpite.palpite_b }}</span>
                    <span class="ml-2 text-slate-500">· Em andamento</span>
                  </p>
                </ng-template>
              </div>

              <div *ngIf="!jogo.palpite && (jogo.encerrado || isJogoComecou(jogo))" class="text-center text-sm text-slate-500">
                Sem palpite registrado.
              </div>
            </ng-container>
          </div>
        </div>
      </ng-container>

      <ng-template #notFoundState>
        <div *ngIf="!loading()" class="py-16 text-center text-slate-400">Bolão não encontrado.</div>
      </ng-template>
    </div>
  `,
})
export class PalpitesComponent {
  private readonly db = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  readonly bolao = signal<Bolao | null>(null);
  readonly jogos = signal<JogoComPalpite[]>([]);
  readonly participante = signal<Participante | null>(null);
  readonly loading = signal(true);
  readonly loadingEntrar = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly joinError = signal('');

  nomeExibicao = '';

  constructor() {
    void this.loadData();
  }

  isJogoComecou(jogo: Jogo): boolean {
    return new Date(jogo.data_jogo).getTime() <= Date.now();
  }

  faseLabel(fase: string): string {
    return FASE_LABELS[fase] ?? fase;
  }

  async entrar(): Promise<void> {
    const bolao = this.bolao();
    const user = this.auth.currentUser();
    if (!bolao || !user || !this.nomeExibicao.trim()) {
      return;
    }

    this.loadingEntrar.set(true);
    this.joinError.set('');

    try {
      const { data, error } = await this.db.joinBolao(bolao.id, user.id, this.nomeExibicao.trim());
      if (error) {
        throw error;
      }
      this.participante.set(data ?? null);
    } catch (err: unknown) {
      this.joinError.set(err instanceof Error ? err.message : 'Erro ao entrar no bolão.');
    } finally {
      this.loadingEntrar.set(false);
    }
  }

  async salvarPalpite(jogo: JogoComPalpite): Promise<void> {
    const bolao = this.bolao();
    const user = this.auth.currentUser();
    if (!bolao || !user || jogo.palpite_a_input === null || jogo.palpite_b_input === null) {
      return;
    }

    this.savingId.set(jogo.id);

    try {
      const { data, error } = await this.db.upsertPalpite({
        jogo_id: jogo.id,
        user_id: user.id,
        bolao_id: bolao.id,
        palpite_a: jogo.palpite_a_input,
        palpite_b: jogo.palpite_b_input,
      });

      if (error) {
        throw error;
      }

      if (data) {
        this.jogos.update((lista) =>
          lista.map((item) =>
            item.id === jogo.id
              ? {
                  ...item,
                  palpite: data,
                  palpite_a_input: data.palpite_a,
                  palpite_b_input: data.palpite_b,
                }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.savingId.set(null);
    }
  }

  private async loadData(): Promise<void> {
    await this.auth.ensureSessionLoaded();
    const codigo = this.route.snapshot.paramMap.get('codigo') ?? '';
    const { data: bolao } = await this.db.getBolaoByCode(codigo);
    this.bolao.set(bolao ?? null);

    if (!bolao) {
      this.loading.set(false);
      return;
    }

    const { data: jogosRaw } = await this.db.getJogosByBolao(bolao.id);
    const user = this.auth.currentUser();

    let palpites: Palpite[] = [];
    if (user) {
      const [{ data: palpitesData }, { data: participante }] = await Promise.all([
        this.db.getPalpitesByBolaoAndUser(bolao.id, user.id),
        this.db.getParticipante(bolao.id, user.id),
      ]);
      palpites = palpitesData ?? [];
      this.participante.set(participante ?? null);
      if (participante?.nome_exibicao) {
        this.nomeExibicao = participante.nome_exibicao;
      }
    }

    const jogosComPalpite = (jogosRaw ?? []).map((jogo) => {
      const palpite = palpites.find((item) => item.jogo_id === jogo.id);
      return {
        ...jogo,
        palpite,
        palpite_a_input: palpite?.palpite_a ?? null,
        palpite_b_input: palpite?.palpite_b ?? null,
      };
    });

    this.jogos.set(jogosComPalpite);
    this.loading.set(false);
  }
}
