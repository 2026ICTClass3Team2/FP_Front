# FP_Front — DeadBug Frontend

React SPA for the DeadBug developer community platform. Provides the UI for feeds, QnA, study materials, real-time chat, the AI assistant, gamification, and admin tools.

## Tech stack

- **React 19** + **Vite 8**
- **TailwindCSS 4** for styling
- **Zustand 5** for client state
- **React Router 7** for routing
- **Axios** with JWT interceptor (`src/api/jwtAxios.js`) for authenticated HTTP
- **vite-plugin-pwa** for installable PWA support
- **React Quill** (rich text), **pdfjs-dist** (PDF viewer), **react-markdown** + **remark-gfm**

## Prerequisites

- Node.js 20+
- A running backend at `http://localhost:8090/api`

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173 with HMR
npm run build    # production build to dist/
npm run lint     # ESLint
npm run preview  # serve dist/ locally
```

## Project structure

```
FP_Front/
  index.html              Entry HTML; loads /src/main.jsx
  vite.config.js          Vite + PWA + Tailwind plugin setup
  public/                 Static assets (favicon, PWA icons)
  src/
    main.jsx              React DOM root
    App.jsx               Root component wrapper
    routes/
      AppRouter.jsx       All route definitions
      ProtectedRoute.jsx  Auth guard
    pages/                Route-level pages (feed, qna, study, auth, admin, mypage, ...)
    components/           Reusable UI organized by domain
    api/
      jwtAxios.js         Axios instance with Bearer token interceptor
      <domain>.js         Per-domain API clients
    stores/               Zustand stores (auth, chat, theme, write-channel, post-modal)
    hooks/                Custom React hooks
    assets/               Styles, images, fonts
```

## Authentication

- **Local**: email/password → JWT in `localStorage`
- **OAuth2**: Google / GitHub / Kakao → `/oauth/callback` → `/oauth/setup-username` for new users → JWT issued

All authenticated requests use `src/api/jwtAxios.js`, which auto-attaches `Authorization: Bearer <token>` from `localStorage`.

## Backend dependency

The dev server expects the Spring Boot API to be reachable. Configure the base URL inside `src/api/jwtAxios.js` if you need to point elsewhere than `http://localhost:8090/api`.
