# frontend-usuario

Aplicación móvil web del usuario final para MenteAmiga-AI, construida con React, Vite y TypeScript.

## Requisitos

- Node.js 20+
- npm 10+
- `backend-core` corriendo en `http://localhost:3001` o una URL equivalente

## Variables de entorno

Copia `.env.example` a `.env`:

```env
VITE_API_URL=http://localhost:3001
```

## Instalación

```powershell
cd C:\Users\ferne\MenteAmiga-AI\frontend-usuario
npm install
```

## Ejecución

Desarrollo:

```powershell
npm run dev
```

Build:

```powershell
npm run build
```

Preview local del build:

```powershell
npm run preview
```

## Flujo básico de uso

1. Abrir la portada y entrar a registro o login.
2. Completar onboarding.
3. Usar `Home` para guardar check-ins y revisar accesos rápidos.
4. Conversar con la IA en `Chat`.
5. Reabrir conversaciones desde `History`.
6. Editar perfil, avatar y personalización.
7. Gestionar recordatorios.
8. Consultar resumen semanal, suscripción, privacidad y soporte.

## Endpoints clave que consume

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `GET /profiles/me`
- `PUT /profiles/me`
- `POST /profiles/me/complete-onboarding`
- `GET /profiles/me/check-ins`
- `POST /profiles/me/check-ins`
- `GET /profiles/me/weekly-summary`
- `POST /profiles/me/avatar`
- `GET /chats`
- `POST /ai/chat-session`
- `GET /messages/chat/:chatId`
- `GET /reminders`
- `POST /reminders`
- `PUT /reminders/:id`
- `DELETE /reminders/:id`
- `GET /subscriptions/me`
- `GET /subscriptions/me/usage`
- `GET /support-requests/me`
- `POST /support-requests`

## Arquitectura breve

- `src/app`: bootstrap y providers.
- `src/router`: rutas públicas, protegidas y guards.
- `src/layouts`: shell móvil y layouts públicos.
- `src/pages`: pantallas principales.
- `src/components/ui`: componentes reutilizables.
- `src/services`: capa Axios/API.
- `src/store`: sesión y estado global ligero.
- `src/types`: contratos TypeScript del frontend.

## Relación con el resto del repo

- `backend-core`: API compartida.
- `frontend-super-admin`: panel administrativo separado, apuntando al mismo backend.
