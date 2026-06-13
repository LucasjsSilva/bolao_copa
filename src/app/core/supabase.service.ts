import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Bolao {
  id: string;
  nome: string;
  codigo: string;
  criado_por: string;
  created_at: string;
}

export interface Jogo {
  id: string;
  bolao_id: string;
  time_a: string;
  time_b: string;
  data_jogo: string;
  fase: string;
  placar_a: number | null;
  placar_b: number | null;
  encerrado: boolean;
  created_at: string;
}

export interface Participante {
  id: string;
  bolao_id: string;
  user_id: string;
  nome_exibicao: string;
  created_at: string;
}

export interface Palpite {
  id: string;
  jogo_id: string;
  user_id: string;
  bolao_id: string;
  palpite_a: number;
  palpite_b: number;
  pontos_ganhos: number;
  created_at: string;
}

export interface Time {
  id: number;
  nome: string;
  grupo: string;
  bandeira_emoji: string | null;
  created_at: string;
}

export interface RankingEntry {
  bolao_id: string;
  user_id: string;
  nome_exibicao: string;
  total_pontos: number;
  acertos: number;
}

export interface Time {
  id: number;
  nome: string;
  grupo: string;
  bandeira_emoji: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async getBolaoByCode(codigo: string) {
    return this.supabase.from('boloes').select('*').eq('codigo', codigo).single();
  }

  async getBolaoById(id: string) {
    return this.supabase.from('boloes').select('*').eq('id', id).single();
  }

  async createBolao(nome: string, codigo: string, criado_por: string) {
    return this.supabase.from('boloes').insert({ nome, codigo, criado_por }).select().single();
  }

  async getMyBoloes(userId: string) {
    return this.supabase
      .from('boloes')
      .select('*')
      .eq('criado_por', userId)
      .order('created_at', { ascending: false });
  }

  async getJogosByBolao(bolaoId: string) {
    return this.supabase
      .from('jogos')
      .select('*')
      .eq('bolao_id', bolaoId)
      .order('data_jogo', { ascending: true });
  }

  async createJogo(jogo: Omit<Jogo, 'id' | 'created_at' | 'placar_a' | 'placar_b' | 'encerrado'>) {
    return this.supabase.from('jogos').insert({ ...jogo, encerrado: false }).select().single();
  }

  async updateJogo(id: string, data: Partial<Jogo>) {
    return this.supabase.from('jogos').update(data).eq('id', id);
  }

  async deleteJogo(id: string) {
    return this.supabase.from('jogos').delete().eq('id', id);
  }

  async encerrarJogo(jogoId: string, placar_a: number, placar_b: number) {
    const { error } = await this.supabase
      .from('jogos')
      .update({ placar_a, placar_b, encerrado: true })
      .eq('id', jogoId);

    if (error) {
      return { error };
    }

    const { data: palpites, error: palpitesError } = await this.supabase
      .from('palpites')
      .select('*')
      .eq('jogo_id', jogoId);

    if (palpitesError) {
      return { error: palpitesError };
    }

    if (!palpites || palpites.length === 0) {
      return { error: null };
    }

    const total = palpites.length;
    const acertadores = (palpites as Palpite[]).filter(
      (palpite) => palpite.palpite_a === placar_a && palpite.palpite_b === placar_b,
    );
    // Scoring rule: total points = number of participants (each bet 1 point).
    // Winners split evenly: solo winner takes all; ties divide the pool equally.
    const pontosParaCada = acertadores.length > 0 ? total / acertadores.length : 0;

    await Promise.all(
      acertadores.map((palpite) =>
        this.supabase
          .from('palpites')
          .update({ pontos_ganhos: pontosParaCada })
          .eq('id', palpite.id),
      ),
    );

    return { error: null };
  }

  async getParticipante(bolaoId: string, userId: string) {
    return this.supabase
      .from('participantes')
      .select('*')
      .eq('bolao_id', bolaoId)
      .eq('user_id', userId)
      .maybeSingle();
  }

  async joinBolao(bolaoId: string, userId: string, nomeExibicao: string) {
    return this.supabase
      .from('participantes')
      .insert({ bolao_id: bolaoId, user_id: userId, nome_exibicao: nomeExibicao })
      .select()
      .single();
  }

  async getPalpitesByBolaoAndUser(bolaoId: string, userId: string) {
    return this.supabase.from('palpites').select('*').eq('bolao_id', bolaoId).eq('user_id', userId);
  }

  async upsertPalpite(palpite: Omit<Palpite, 'id' | 'created_at' | 'pontos_ganhos'>) {
    return this.supabase
      .from('palpites')
      .upsert({ ...palpite, pontos_ganhos: 0 }, { onConflict: 'jogo_id,user_id' })
      .select()
      .single();
  }

  async getRanking(bolaoId: string) {
    return this.supabase
      .from('ranking_bolao')
      .select('*')
      .eq('bolao_id', bolaoId)
      .order('total_pontos', { ascending: false })
      .order('acertos', { ascending: false })
      .order('nome_exibicao', { ascending: true });
  }

  async getTimes() {
<<<<<<< HEAD
    return this.supabase.from('times').select('*').order('grupo').order('id');
=======
    return this.supabase
      .from('times')
      .select('*')
      .order('grupo', { ascending: true })
      .order('nome', { ascending: true });
>>>>>>> origin/main
  }
}
