# Todo List Page

## Goal

Add a personal todo list to the Cihan Attorney app. Every logged-in user gets their own private list of tasks, each optionally linked to a case and optionally carrying a due date. This is a new feature: one new page, one new API resource, one new table.

The list is **private per user** — the server decides whose todos you see, based on the authenticated identity. No sharing, no assigning tasks to other people, no shared office list.

## Requirements

Decided during brainstorming:

| Question | Decision |
|---|---|
| Ownership | Private per user. Each user sees only their own todos. |
| Case linking | Optional. A todo may point at a case, or stand alone. |
| Fields beyond the basics | Due date only. **No** priority, **no** notes/description. |
| Completed items | Stay in place, struck through and dimmed. Not hidden, not moved. |
| Dashboard integration | None. The feature lives only on its own page. |
| Architecture | Full REST resource with an auth-protected backend (not localStorage). |

## Data Model

One new table, added to `backend/src/config/initDatabase.js` following the existing `CREATE TABLE IF NOT EXISTS` pattern so it auto-creates on server start alongside the other tables.

```sql
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id INTEGER REFERENCES cases(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
```

Rationale for the three non-obvious choices:

- **`user_id` is `NOT NULL` with `ON DELETE CASCADE`** — a todo always has an owner, and deleting a user removes their todos rather than orphaning rows.
- **`case_id` is nullable with `ON DELETE SET NULL`** — deleting a case must not silently destroy a user's personal reminders. The todo survives; it just loses its link and renders as a standalone item.
- **`due_date` is nullable and typed `DATE`, not `TIMESTAMP`** — todos are day-granular. A time-of-day component would introduce timezone questions this feature does not need.

## API

New resource at `/api/todos`, registered in `backend/src/server.js` alongside the existing route modules. Files follow the established three-layer split: `models/Todo.js`, `controllers/todoController.js`, `routes/todoRoutes.js`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/todos` | List the authenticated user's todos |
| `POST` | `/api/todos` | Create a todo |
| `PUT` | `/api/todos/:id` | Partial update of title, due_date, case_id, and/or is_completed |
| `DELETE` | `/api/todos/:id` | Delete a todo |

### Authorization

The router applies `authenticateToken` to every route (`router.use(authenticateToken)`), mirroring `userRoutes.js`. It does **not** apply `requireAdmin` — todos are available to all three roles (`admin`, `lawyer`, `staff`).

Two rules that make privacy real rather than cosmetic:

1. **The owner comes from the JWT, never the request body.** `POST` ignores any `user_id` in the payload and uses `req.user.id`. A client cannot create a todo owned by someone else.
2. **Every query filters by owner.** `GET` returns only rows where `user_id = req.user.id`. `PUT`/`DELETE` scope their `WHERE` clause by both `id` and `user_id`, so a request targeting another user's todo affects zero rows.

When a `PUT` or `DELETE` matches zero rows, the API returns **404, not 403**. A 403 would confirm that a todo with that ID exists and belongs to someone else, which leaks information about other users' data. 404 is indistinguishable from "no such todo."

`PUT` accepts a **partial** payload: only the fields present in the body are updated, and omitted fields keep their current values. This matters because toggling the checkbox sends `is_completed` alone, and it must not blank out the title, due date, or case link. Explicitly sending `null` for `due_date` or `case_id` clears that field — that is how a user removes a due date or unlinks a case, and it is distinct from omitting the field entirely.

### Validation

- `title` is required on create. On update it may be omitted, but if present it is trimmed and must be non-empty; reject with 400 otherwise. Values longer than 255 characters are rejected with 400 rather than silently truncated by the column limit.
- `due_date` is optional. If present and non-null it must parse as a valid date; otherwise 400. An explicit `null` is valid and clears the field.
- `case_id` is optional. If present and non-null it must reference an existing case; otherwise 400. An explicit `null` is valid and unlinks the case.
- `is_completed` is a boolean, defaulting to `false` on create.

## Frontend

### Routing and navigation

- New page: `frontend/src/pages/TodoList.tsx`.
- New route `/todos` in `App.tsx`, inside the existing `ProtectedRoute` wrapper but **without** `requireAdmin` — unlike `/users`, every role gets todos.
- New sidebar link in the "Main Menu" section of `Sidebar.tsx`, using `ClipboardDocumentCheckIcon` from Heroicons. `CheckCircleIcon` is already in use for "Active Cases" and must not be reused.
- New API functions in `frontend/src/services/api.ts`, following the existing pattern of reading the token from `localStorage` and sending it as a `Bearer` header.

### Page layout

A header with the page title and a count of open (incomplete) items, then an inline add-row, then the list.

The **add-row** is a single horizontal row: title text input, due-date input, an optional case dropdown (populated from the existing `getAllCases` call, with a blank "no case" option), and an Add button using `.btn .btn-primary`. Inputs use the existing `.form-control` class.

Each **list row** contains: a checkbox, the title, a due-date badge when set, the linked case as a link to `/cases/:id` when set, and a delete icon-button using the existing `.btn-icon .btn-icon-delete` classes. Completed rows render the title with a strikethrough and reduced opacity; the row stays exactly where it was.

An **empty state** is shown when the user has no todos at all, distinct from the loading state.

### Sort order

Sorted by due date ascending, with undated items last, and most-recently-created first as a tiebreak among items sharing a due date (or among undated items).

**Completion status does not participate in sorting.** This is what makes "stay in place, struck through" literally true — checking a box changes the row's appearance and nothing else about its position.

Items that are past due and not yet completed render their due date in `--danger-color` to mark them overdue. An item that is past due but completed is not styled as overdue.

## Styling

Reuse the design-token system and shared components established in the UI/UX redesign — `.card`, `.btn`, `.btn-icon-delete`, `.badge-*`, `.form-control`, and the color/radius/shadow tokens in `index.css`. Do not introduce a page-scoped stylesheet.

If any todo-specific CSS is genuinely required, it must be scoped under a page-level wrapper class (e.g. `.todo-list`). A bare element selector or an unscoped generic class name would leak across the whole app, because page components are statically imported in `App.tsx` — the exact defect that required two rounds of fixes during the redesign.

## Internationalization

All user-facing strings go through the existing `useLanguage()` / `t.*` mechanism. A new `todos` section is added to **all three** locales in `frontend/src/i18n/translations.ts` — English, Kurdish (`ku`), and Arabic (`ar`). No hardcoded display strings in the component.

## Error Handling

- Failed loads and failed mutations surface through the existing `.alert-error` pattern used elsewhere in the app.
- The page shows a loading state during the initial fetch.
- A failed create/update/delete leaves the list in its prior state and shows the error; the UI must not show a change that the server rejected.

## Out of Scope

- No shared or office-wide list, no assigning todos to other users.
- No priority field, no notes/description field, no subtasks, no attachments, no reminders or notifications.
- No Dashboard card or any other cross-page surfacing.
- No changes to existing pages other than adding the sidebar link and the route.
- No recurring todos.

## Known Issue (Not Addressed Here)

`backend/src/routes/caseRoutes.js` applies **no authentication middleware at all**. Every case endpoint — read, create, update, delete, file upload — is reachable without a token, unlike the user routes which are protected. Any client that can reach the API can read and modify all case data.

This predates this feature and is deliberately left alone here to keep the todo work focused; it is recorded so it is not forgotten. It deserves its own change, because adding `authenticateToken` to case routes will affect every case-related call in the frontend and needs its own verification pass.

## Verification

This repository has no test framework (`frontend/package.json` defines only `dev`, `build`, `lint`, `preview`). Verification is therefore:

1. `cd frontend && npm run build` exits 0.
2. `cd frontend && npm run lint` exits 0.
3. Live browser checks against a running backend and frontend, confirming concrete observed behavior rather than assumed behavior:
   - A todo created by one user is **not** returned when a different user lists their todos.
   - `PUT`/`DELETE` against another user's todo ID returns 404 and leaves the row unchanged.
   - Checking an item strikes it through without moving it in the list.
   - An overdue incomplete item renders its date in the danger color; an overdue completed item does not.
   - Deleting a linked case leaves the todo present and unlinked, rather than deleting it.
   - The page renders correctly in light mode, dark mode, and at least one RTL locale.
