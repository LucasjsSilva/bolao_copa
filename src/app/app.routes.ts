import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin/criar-bolao',
    loadComponent: () => import('./features/admin/criar-bolao/criar-bolao.component').then((m) => m.CriarBolaoComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin/bolao/:id/jogos',
    loadComponent: () => import('./features/admin/gerenciar-jogos/gerenciar-jogos.component').then((m) => m.GerenciarJogosComponent),
    canActivate: [authGuard],
  },
  {
    path: 'bolao/entrar',
    loadComponent: () => import('./features/bolao/entrar/entrar.component').then((m) => m.EntrarComponent),
  },
  {
    path: 'times',
    loadComponent: () => import('./features/times/times.component').then((m) => m.TimesComponent),
  },
  {
    path: 'bolao/:codigo',
    loadComponent: () => import('./features/bolao/palpites/palpites.component').then((m) => m.PalpitesComponent),
  },
  {
    path: 'bolao/:codigo/ranking',
    loadComponent: () => import('./features/bolao/ranking/ranking.component').then((m) => m.RankingComponent),
  },
  {
    path: 'times',
    loadComponent: () => import('./features/times/times.component').then((m) => m.TimesComponent),
  },
  { path: '**', redirectTo: '/auth/login' },
];
