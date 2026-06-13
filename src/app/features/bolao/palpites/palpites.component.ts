import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Bolao, Jogo, Palpite, Participante, Profile, SupabaseService } from '../../../core/supabase.service';

interface JogoComPalpite extends Jogo {
  palpite?: Palpite;
  palpite_a_input: number | null;
  palpite_b_input: number | null;
}

interface PalpiteParticipanteView {
  nome: string;
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
            <a routerLink="/meus-palpites" class="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-600">
              📋 Meus Palpites
            </a>
            <a routerLink="/bolao/entrar" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-slate-800">
              Outro código
            </a>
          </div>
        </div>

        <div *ngIf="!participante() && auth.isLoggedIn()" class="mb-6 rounded-2xl border border-amber-700 bg-amber-900/30 p-6">
          <h2 class="mb-2 font-semibold">Você ainda não participa deste bolão</h2>
          <ng-container *ngIf="profile(); else semPerfil">
            <p class="mb-3 text-sm text-slate-400">
              Você vai entrar como <span class="font-semibold text-emerald-400">{{ profile()!.username }}</span>
            </p>
            <button
              type="button"
              (click)="entrar()"
              [disabled]="loadingEntrar()"
              class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {{ loadingEntrar() ? 'Entrando...' : 'Entrar no bolão' }}
            </button>
          </ng-container>
          <ng-template #semPerfil>
            <p class="text-sm text-slate-400">
              Você precisa configurar seu username antes de entrar em um bolão.
            </p>
            <a routerLink="/auth/login" class="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
              Configurar username
            </a>
          </ng-template>
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
                <span *ngIf="!jogo.encerrado && jogo.palpite" class="text-emerald-400 text-sm font-bold">✓ Palpite registrado</span>
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
              <!-- Formulário: só aparece se ainda não tem palpite E o jogo não começou -->
              <div *ngIf="!jogo.palpite && !jogo.encerrado && !isJogoComecou(jogo)">
                <p class="mb-2 text-center text-xs text-amber-400">🎯 Você está apostando 1 ponto neste jogo</p>
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
                    {{ savingId() === jogo.id ? 'Salvando...' : 'Salvar' }}
                  </button>
                </div>
              </div>

              <!-- Palpite já salvo + jogo ainda não começou -->
              <div *ngIf="jogo.palpite && !jogo.encerrado && !isJogoComecou(jogo)" class="text-center rounded-xl bg-emerald-900/30 border border-emerald-800 p-3">
                <p class="text-xs text-slate-400 mb-1">Seu palpite (não pode ser alterado)</p>
                <p class="font-bold text-emerald-400 text-lg">{{ jogo.palpite.palpite_a }} × {{ jogo.palpite.palpite_b }}</p>
              </div>

              <!-- Jogo em andamento ou encerrado -->
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
                      ✗ Você perdeu seu ponto
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

            <!-- Palpites de todos os participantes -->
            <div class="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 class="mb-1 text-sm font-semibold text-emerald-300">
                Palpites dos participantes ({{ countPalpites(jogo.id) }} apostas)
              </h3>
              <div *ngIf="palpitesParticipantes(jogo).length === 0" class="text-sm text-slate-400">
                Nenhum palpite registrado.
              </div>
              <div *ngIf="palpitesParticipantes(jogo).length > 0" class="overflow-x-auto">
                <table class="w-full min-w-[320px] text-sm">
                  <tbody>
                    <tr *ngFor="let item of palpitesParticipantes(jogo)" class="border-t border-slate-700/60 first:border-t-0">
                      <td class="py-2 pr-3 text-slate-200">{{ item.nome }}</td>
                      <td class="py-2 text-right font-semibold text-white">
                        {{ palpiteTextoPublico(jogo, item.palpite) }}
                      </td>
                      <td *ngIf="jogo.encerrado" class="py-2 pl-3 text-right">
                        <span *ngIf="item.palpite && acertouPalpite(jogo, item.palpite)" class="text-emerald-400">
                          ✓ +{{ item.palpite.pontos_ganhos | number: '1.0-2' }}pts
                        </span>
                        <span *ngIf="!item.palpite || !acertouPalpite(jogo, item.palpite)" class="text-red-400">✗</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly bolao = signal<Bolao | null>(null);
  readonly jogos = signal<JogoComPalpite[]>([]);
  readonly participante = signal<Participante | null>(null);
  readonly participantes = signal<Participante[]>([]);
  readonly palpitesPorJogo = signal<Record<string, Palpite[]>>({});
  readonly profile = signal<Profile | null>(null);
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

  countPalpites(jogoId: string): number {
    return this.palpitesPorJogo()[jogoId]?.length ?? 0;
  }

  palpitesParticipantes(jogo: Jogo): PalpiteParticipanteView[] {
    const palpitesDoJogo = this.palpitesPorJogo()[jogo.id] ?? [];
    const palpitesByUser = new Map(palpitesDoJogo.map((palpite) => [palpite.user_id, palpite]));
    return this.participantes().map((participante) => ({
      nome: participante.nome_exibicao,
      palpite: palpitesByUser.get(participante.user_id) ?? null,
    }));
  }

  palpiteTextoPublico(jogo: Jogo, palpite: Palpite | null): string {
    if (!jogo.encerrado && this.isJogoComecou(jogo)) {
      return '?';
    }
    if (!palpite) {
      return '—';
    }
    return `${palpite.palpite_a} × ${palpite.palpite_b}`;
  }

  acertouPalpite(jogo: Jogo, palpite: Palpite): boolean {
    return jogo.placar_a === palpite.palpite_a && jogo.placar_b === palpite.palpite_b;
  }

  async entrar(): Promise<void> {
    const bolao = this.bolao();
    const user = this.auth.currentUser();
    const profile = this.profile();

    if (!bolao || !user) return;

    const nome = profile?.username ?? '';
    if (!nome.trim()) {
      this.joinError.set('Configure seu username primeiro.');
      return;
    }

    this.loadingEntrar.set(true);
    this.joinError.set('');

    try {
      const { data, error } = await this.db.joinBolao(bolao.id, user.id, nome.trim());
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
    // Só salva se ainda não tem palpite (não permite atualizar)
    if (jogo.palpite) return;

    const bolao = this.bolao();
    const user = this.auth.currentUser();
    if (!bolao || !user || jogo.palpite_a_input === null || jogo.palpite_b_input === null) {
      return;
    }

    this.savingId.set(jogo.id);

    try {
      const { data, error } = await this.db.insertPalpite({
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
    const jogos = jogosRaw ?? [];

    let palpites: Palpite[] = [];
    const [{ data: participantesData }, { data: palpitesData }, { data: profile }] = await Promise.all([
      this.db.getParticipantesByBolao(bolao.id),
      user ? this.db.getPalpitesByBolaoAndUser(bolao.id, user.id) : Promise.resolve({ data: [], error: null }),
      user ? this.db.getProfile(user.id) : Promise.resolve({ data: null, error: null }),
    ]);
    const participantes = (participantesData ?? []) as Participante[];
    this.participantes.set(participantes);
    this.participante.set(user ? participantes.find((item) => item.user_id === user.id) ?? null : null);
    this.profile.set((profile as Profile | null) ?? null);
    palpites = palpitesData ?? [];

    const palpitesPorJogoEntries = await Promise.all(
      jogos.map(async (jogo) => {
        const { data } = await this.db.getPalpitesByJogo(jogo.id);
        return [jogo.id, (data ?? []) as Palpite[]] as const;
      }),
    );
    this.palpitesPorJogo.set(Object.fromEntries(palpitesPorJogoEntries));

    const jogosComPalpite = jogos.map((jogo) => {
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
