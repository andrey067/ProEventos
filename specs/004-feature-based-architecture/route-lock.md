# Route path lock (T004) — do not change these public URLs during 004 moves

## React (`Front/Front-React/src/App.tsx`)
- `/` → redirect `/eventos`
- `/eventos`
- `/eventos/:id`
- `/palestrantes`
- `/login`

## Vue (`Front/Front-Vue/src/router/index.ts`)
- `/user` (+ children `login`, `registro`)
- `/eventos` (+ children `lista`, `detalhes/:id?`)
- `/palestrantes`
- catch-all → `/eventos/lista`

## Angular (`Front/Front-Angular/src/app/app.routes.ts`)
- `''` → redirect `eventos`
- `eventos`
- `eventos/:id`
- `palestrantes`
- `login`
