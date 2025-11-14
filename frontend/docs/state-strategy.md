# Frontend State Strategy

This project intentionally keeps state management simple by combining three tools. Each has a clear responsibility so engineers know where new state should live.

| Concern | Tool | Notes |
| --- | --- | --- |
| Authentication, session bootstrap, protected routing | React Context (`AuthContext`) + `useAuth` hook | Owns signing in/out, session restore, socket login/logout. Context should only hold user identity + loading flags. |
| Long‑lived client/UI state (wizards, preferences, ephemeral UI) | Zustand stores | e.g. `useRegistrationStore` persists wizard steps. Ideal for multi-step flows, filters that should survive navigation, feature flags. Avoid mixing server data here. |
| Server data + caching, background revalidation | React Query (`@tanstack/react-query`) | Use for anything fetched over HTTP/WebSocket that needs caching, retries, pagination. Keeps mutation + cache logic centralized. |

## Guidelines

- **Prefer hooks over prop drilling.** Consumers should call the relevant hook (`useAuth`, `useRegistrationStore`, `useQuery`) instead of passing `user`, `isMobile`, etc. through several layers.
- **UI state stays local until it is shared.** Lift state to Zustand only when two+ routes/components need it. Otherwise keep it inside the component.
- **Server mutations should invalidate query keys.** React Query already wraps our fetch helpers; follow the pattern in `projectsAPI` and `discoveryAPI`.
- **Context is not a data bucket.** If a value can be recovered from React Query or a Zustand store, do not duplicate it in `AuthContext`.

## Current touch points

- `src/contexts/AuthContext.tsx`: owns session + socket bootstrap. `useAuth` is the single entrypoint for auth state.
- `src/store/registration.ts`: persist multi-step onboarding progress in Zustand.
- React Query: discovery, projects, matches, events, etc. already flow through `services/api.ts` and `fetchWithRetry`.

## Pending work items

- When introducing new modules, decide up-front which bucket they belong to and document it here (e.g. if we add theme or language context).
- Keep this document updated whenever we add/remove stores so onboarding engineers have a single reference.

