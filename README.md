# bolao_copa

Aplicativo Angular 18 + Supabase para organizar um bolão da Copa do Mundo com autenticação, criação de bolões, cadastro de jogos, palpites e ranking em tempo real.

## Funcionalidades

- Login e cadastro com Supabase Auth
- Criação e gerenciamento de bolões
- Cadastro, encerramento e remoção de jogos
- Entrada por código compartilhável
- Registro de palpites até o início de cada partida
- Ranking com pontuação dividida entre os acertadores

## Requisitos

- Node.js 18+
- Projeto Supabase configurado

## Instalação

```bash
npm install
```

## Ambiente

Para desenvolvimento local, edite `src/environments/environment.development.ts` com as credenciais do seu projeto Supabase:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseKey: 'SUA_SUPABASE_ANON_KEY',
};
```

## Banco de dados Supabase

Execute o arquivo `supabase/schema.sql` no SQL Editor do Supabase para criar as tabelas, índices, view de ranking e políticas de acesso.

## Desenvolvimento

```bash
npm start
```

Acesse a aplicação em `http://localhost:4200/`.

## Build

```bash
npm run build
```

A build de produção usa `baseHref=/bolao_copa/`, gerando arquivos em `dist/bolao_copa`.
