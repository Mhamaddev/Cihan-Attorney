# Cihan Attorney Frontend UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved "Modern Refined" visual redesign (green palette + Inter typography) across the entire `frontend/` app — shell, shared components, and every page — without changing any functionality, routing, or data behavior.

**Architecture:** All shared visual changes (design tokens, buttons, cards, badges, tables, forms, icon-buttons) live in `frontend/src/index.css`, a single global stylesheet the whole app already uses. Per-page changes are inline-style edits in each page's `.tsx` file (matching the codebase's existing pattern of using inline styles for one-off layout, and CSS classes for shared/reusable rules). `UserManagement.css` is a page-scoped stylesheet that gets updated to consume the same global tokens instead of its own divergent ones.

**Tech Stack:** React 19 + TypeScript + Vite, plain CSS with custom properties (no CSS framework), Heroicons (`@heroicons/react`) for icons, new dependency `@fontsource/inter` for self-hosted Inter font files.

## Global Constraints

- **Visual/UX only.** No new features, no routing changes (`App.tsx` routes stay identical), no changes to `frontend/src/services/api.ts`, no changes to backend code, no changes to i18n keys/behavior in `frontend/src/i18n/`.
- **No test framework exists in this repo** (`frontend/package.json` has no vitest/jest/testing-library). Verification for every task is: (1) `npm run build` passes (catches TypeScript errors), (2) `npm run lint` passes, (3) a concrete Playwright MCP browser check (`browser_navigate` + `browser_evaluate`/`browser_snapshot`) confirming the actual rendered computed style or DOM structure matches what's specified — not a placeholder, an exact expected value.
- **Protected pages need a live local backend.** Dashboard, Case List, Case Detail, Case Form, and User Management are behind `ProtectedRoute` (`frontend/src/components/ProtectedRoute.tsx`), which requires a real successful login against the actual API. Before verifying any task touching those pages, run the backend locally: `cd backend && npm install && npm run dev`, with `backend/.env` pointing at a reachable local Postgres (copy `backend/.env.example`, fill in real `DB_PASSWORD`). On first run, `createTables()` auto-creates the schema and seeds `admin` / `admin123`. The frontend dev server (`cd frontend && npm run dev`) defaults to `http://localhost:5173`, which is already in the backend's CORS allow-list (`backend/src/server.js`).
- **Exact color/spacing values below are locked from the approved brainstorming mockups** — don't substitute similar-looking values.

---

### Task 1: Self-host Inter font and rebuild the design token system

**Files:**
- Modify: `frontend/package.json` (new dependency, via `npm install`)
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/index.css:1-66` (font-face block, `:root` token block, `[data-theme="dark"]` token block)

**Interfaces:**
- Produces: CSS custom properties consumed by every later task — `--primary-color`, `--primary-dark`, `--primary-tint`, `--secondary-color` (success), `--success-tint`, `--warning-color`, `--warning-tint`, `--danger-color`, `--danger-tint`, `--info-color`, `--info-tint`, `--sidebar-bg`, `--accent-gold`, `--card-bg`, `--card-shadow`, `--hover-bg`, `--border-radius`, `--card-radius`, `--radius-lg`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--border-color`, `--bg-secondary`. Body font-family becomes Inter.

- [ ] **Step 1: Install the font package**

Run: `cd frontend && npm install @fontsource/inter`
Expected: package.json now lists `@fontsource/inter` under `dependencies`.

- [ ] **Step 2: Import the needed font weights in main.tsx**

In `frontend/src/main.tsx`, add these imports at the top, before `import './index.css'`:

```tsx
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './index.css'
```

- [ ] **Step 3: Remove the IBM Plex font-face**

In `frontend/src/index.css`, delete lines 1-7:

```css
@font-face {
  font-family: 'IBM Plex';
  src: url('/fonts/ibm.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

```

- [ ] **Step 4: Replace the `:root` token block**

Replace the entire `:root { ... }` block (originally lines 9-38, now shifted up 8 lines after Step 3) with:

```css
:root {
  --primary-color: #3d5228;
  --primary-dark: #243218;
  --primary-tint: #eaf1e3;
  --secondary-color: #1e7a34;
  --success-tint: #e3f2e6;
  --warning-color: #a5690a;
  --warning-tint: #fdf0da;
  --danger-color: #dc2626;
  --danger-tint: #fee2e2;
  --info-color: #1e40af;
  --info-tint: #dbeafe;
  --sidebar-bg: #1f2b14;
  --accent-gold: #e8c66b;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 80px;
  --topbar-height: 64px;

  /* Light mode colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f7f8f5;
  --bg-tertiary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-tertiary: #6b7280;
  --border-color: #edf0e8;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --card-bg: var(--bg-primary);
  --card-shadow: var(--shadow-md);
  --hover-bg: var(--bg-tertiary);
  --border-radius: 10px;
  --card-radius: 14px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

- [ ] **Step 5: Replace the `[data-theme="dark"]` token block**

Replace the entire `[data-theme="dark"] { ... }` block with:

```css
[data-theme="dark"] {
  --primary-color: #6b8f4a;
  --primary-dark: #4a6034;
  --primary-tint: #24301a;
  --secondary-color: #4ade80;
  --success-tint: #14251a;
  --warning-color: #fbbf24;
  --warning-tint: #2a2210;
  --danger-color: #f87171;
  --danger-tint: #2a1616;
  --info-color: #60a5fa;
  --info-tint: #16213a;
  --sidebar-bg: #10160a;
  --accent-gold: #e8c66b;
  --gray-50: #28371f;
  --gray-100: #475137;
  --gray-200: #4b5563;
  --gray-300: #6b7280;
  --gray-400: #9ca3af;
  --gray-500: #d1d5db;
  --gray-600: #e5e7eb;
  --gray-700: #f3f4f6;
  --gray-800: #f9fafb;
  --gray-900: #ffffff;

  /* Dark mode colors */
  --bg-primary: #1f2937;
  --bg-secondary: #111827;
  --bg-tertiary: #0f172a;
  --text-primary: #f9fafb;
  --text-secondary: #e5e7eb;
  --text-tertiary: #d1d5db;
  --border-color: #374151;
  --shadow-color: rgba(0, 0, 0, 0.5);
  --card-bg: var(--bg-primary);
  --card-shadow: var(--shadow-md);
  --hover-bg: var(--bg-tertiary);
}
```

- [ ] **Step 6: Update the body font-family**

Find the `body { ... }` rule and change the `font-family` line from `'IBM Plex', -apple-system, ...` to:

```css
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
```

- [ ] **Step 7: Build and lint check**

Run: `cd frontend && npm run build`
Expected: exits 0, no TypeScript or CSS errors.

Run: `cd frontend && npm run lint`
Expected: exits 0.

- [ ] **Step 8: Verify fonts and tokens with Playwright**

Start the dev server if not already running: `cd frontend && npm run dev` (background).

Use `browser_navigate` to `http://localhost:5173/login`, then `browser_evaluate`:

```js
() => {
  const body = getComputedStyle(document.body);
  const root = getComputedStyle(document.documentElement);
  return {
    fontFamily: body.fontFamily,
    primary: root.getPropertyValue('--primary-color').trim(),
    sidebarBg: root.getPropertyValue('--sidebar-bg').trim(),
    radius: root.getPropertyValue('--border-radius').trim(),
  };
}
```

Expected: `fontFamily` starts with `"Inter"`, `primary` is `#3d5228`, `sidebarBg` is `#1f2b14`, `radius` is `10px`.

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/main.tsx frontend/src/index.css
git commit -m "Rebuild design tokens and self-host Inter font"
```

---

### Task 2: Restyle shared components (buttons, cards, badges, tables, forms, icon-buttons)

**Files:**
- Modify: `frontend/src/index.css` (`.btn*`, `.card*`, `.badge*`, `.table*`, `.form-group`/`.form-control` rules; new `.btn-icon*` rules)

**Interfaces:**
- Consumes: tokens from Task 1 (`--primary-color`, `--primary-dark`, `--primary-tint`, `--secondary-color`, `--success-tint`, `--warning-color`, `--warning-tint`, `--danger-color`, `--danger-tint`, `--info-color`, `--info-tint`, `--card-bg`, `--card-radius`, `--shadow-sm`, `--shadow-md`, `--border-radius`)
- Produces: new CSS classes `.btn-icon`, `.btn-icon-view`, `.btn-icon-edit`, `.btn-icon-password`, `.btn-icon-delete` for Task 7 (Case List) and Task 9 (User Management) to consume.

- [ ] **Step 1: Replace the `.btn` rules**

Replace the existing `.btn`, `.btn-primary`, `.btn-primary:hover`, `.btn-secondary`, `.btn-secondary:hover`, `.btn-success`, `.btn-success:hover`, `.btn-danger`, `.btn-danger:hover`, `.btn-sm` block with:

```css
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  box-shadow: 0 4px 12px rgba(61, 82, 40, 0.25);
}

.btn-primary:hover {
  filter: brightness(1.08);
  box-shadow: 0 6px 16px rgba(61, 82, 40, 0.32);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--bg-secondary);
}

.btn-success {
  background-color: var(--secondary-color);
  color: white;
}

.btn-success:hover {
  filter: brightness(0.9);
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  filter: brightness(0.9);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Icon Buttons */
.btn-icon {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-icon-view {
  background: var(--info-tint);
  color: var(--info-color);
}

.btn-icon-view:hover {
  background: var(--info-color);
  color: white;
}

.btn-icon-edit {
  background: var(--primary-tint);
  color: var(--primary-color);
}

.btn-icon-edit:hover {
  background: var(--primary-color);
  color: white;
}

.btn-icon-password {
  background: var(--success-tint);
  color: var(--secondary-color);
}

.btn-icon-password:hover {
  background: var(--secondary-color);
  color: white;
}

.btn-icon-delete {
  background: var(--danger-tint);
  color: var(--danger-color);
}

.btn-icon-delete:hover {
  background: var(--danger-color);
  color: white;
}
```

- [ ] **Step 2: Replace the `.card` rules**

```css
.card {
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  transition: box-shadow 0.2s, background-color 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

- [ ] **Step 3: Replace the `.badge*` rules**

```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background-color: var(--success-tint);
  color: var(--secondary-color);
}

.badge-warning {
  background-color: var(--warning-tint);
  color: var(--warning-color);
}

.badge-danger {
  background-color: var(--danger-tint);
  color: var(--danger-color);
}

.badge-info {
  background-color: var(--info-tint);
  color: var(--info-color);
}
```

- [ ] **Step 4: Replace the `.table*` rules**

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  background-color: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.table tbody tr {
  transition: background-color 0.15s;
}

.table tbody tr:hover {
  background-color: var(--primary-tint);
}
```

- [ ] **Step 5: Replace the `.form-group`/`.form-control` rules**

```css
.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-tint);
}
```

(Leave `textarea.form-control` and `select.form-control` rules below this block unchanged.)

- [ ] **Step 6: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With the dev server running, `browser_navigate` to `http://localhost:5173/login`, `browser_evaluate`:

```js
() => {
  const btn = document.querySelector('button[type="submit"]');
  const s = getComputedStyle(btn);
  return { borderRadius: s.borderRadius, bg: s.backgroundImage.includes('gradient') };
}
```

Expected: `borderRadius` is `"10px"`, `bg` is `true`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/index.css
git commit -m "Restyle shared buttons, cards, badges, tables, and forms"
```

---

### Task 3: Sidebar restyle

**Files:**
- Modify: `frontend/src/index.css` (`.sidebar*` rules, lines ~116-313 before Task 1/2 edits shift line numbers — locate by selector, not line number)
- Modify: `frontend/src/components/Sidebar.tsx:47-56, 146-158`

**Interfaces:**
- Consumes: `--sidebar-bg`, `--accent-gold`, `--primary-color` from Task 1.

- [ ] **Step 1: Change the sidebar background**

In `index.css`, find `.sidebar { ... }` and change:

```css
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
```

to:

```css
  background: var(--sidebar-bg);
  border-right: none;
  box-shadow: var(--shadow-md);
```

- [ ] **Step 2: Update sidebar-header and sidebar-title for dark background**

Find `.sidebar-header` and add `border-bottom: 1px solid rgba(255, 255, 255, 0.1);` replacing its existing `border-bottom: 1px solid var(--border-color);`.

Find `.sidebar-title` and change `color: var(--primary-color);` to `color: #ffffff;`.

- [ ] **Step 3: Update sidebar-close for dark background**

Find `.sidebar-close` and change `color: var(--gray-500);` to `color: rgba(255, 255, 255, 0.7);`. Change its `:hover` rule's `background-color: var(--gray-100);` to `background-color: rgba(255, 255, 255, 0.1);`.

- [ ] **Step 4: Update sidebar-section-title for dark background**

Find `.sidebar-section-title` and change `color: var(--gray-500);` to `color: rgba(255, 255, 255, 0.45);`.

- [ ] **Step 5: Replace `.sidebar-link` and active-state rules**

Replace the `.sidebar-link`, `.sidebar-collapsed .sidebar-link`, `.sidebar-link:hover`, `.sidebar-link-active`, `.sidebar-link-active:hover` block with:

```css
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin: 0 12px 4px;
  border-radius: 9px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.sidebar-collapsed .sidebar-link {
  justify-content: center;
  padding: 12px;
  gap: 0;
  margin: 0 8px 4px;
  position: relative;
}

.sidebar-link:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.sidebar-link-active {
  background-color: var(--primary-color);
  color: white;
}

.sidebar-link-active:hover {
  background-color: var(--primary-color);
  color: white;
}
```

- [ ] **Step 6: Update sidebar-footer and user info for dark background**

Find `.sidebar-footer` and change `border-top: 1px solid var(--border-color);` to `border-top: 1px solid rgba(255, 255, 255, 0.1);`.

Find `.sidebar-user-name` and change `color: var(--gray-900);` to `color: #ffffff;`.

Find `.sidebar-user-role` and change `color: var(--gray-500);` to `color: rgba(255, 255, 255, 0.55);`.

- [ ] **Step 7: Update Sidebar.tsx icon colors**

In `frontend/src/components/Sidebar.tsx`, change the logo `ScaleIcon` (around line 48):

```tsx
            <ScaleIcon style={{ width: '28px', height: '28px', color: 'var(--primary-color)' }} />
```

to:

```tsx
            <ScaleIcon style={{ width: '28px', height: '28px', color: 'var(--accent-gold)' }} />
```

Change the footer `UserCircleIcon` (around line 147-151):

```tsx
            <UserCircleIcon 
              className="sidebar-user-avatar" 
              style={{ width: '40px', height: '40px', color: 'var(--primary-color)' }} 
              title={isCollapsed ? 'Law Office' : ''}
            />
```

to:

```tsx
            <UserCircleIcon 
              className="sidebar-user-avatar" 
              style={{ width: '40px', height: '40px', color: 'var(--accent-gold)' }} 
              title={isCollapsed ? 'Law Office' : ''}
            />
```

- [ ] **Step 8: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With the dev server running, log in first: `browser_navigate` to `http://localhost:5173/login`, `browser_fill_form` with username `admin`/password `admin123` on the username/password textboxes, then `browser_click` the Sign In button.

Then `browser_evaluate`:

```js
() => {
  const sidebar = document.querySelector('.sidebar');
  const active = document.querySelector('.sidebar-link-active');
  return {
    sidebarBg: getComputedStyle(sidebar).backgroundColor,
    activeBg: active ? getComputedStyle(active).backgroundColor : null,
  };
}
```

Expected: `sidebarBg` is `"rgb(31, 43, 20)"`, `activeBg` is `"rgb(61, 82, 40)"`.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/index.css frontend/src/components/Sidebar.tsx
git commit -m "Restyle sidebar with dark green background and pill active state"
```

---

### Task 4: Topbar restyle

**Files:**
- Modify: `frontend/src/index.css` (`.topbar`, `.topbar-dropdown` rules)
- Modify: `frontend/src/components/Topbar.tsx:199-210`

**Interfaces:**
- Consumes: `--card-radius`, `--shadow-sm`, `--shadow-lg`, `--primary-color`, `--primary-dark` from Task 1.

- [ ] **Step 1: Soften the topbar border**

Find `.topbar { ... }` in `index.css` and change:

```css
  border-bottom: 1px solid var(--border-color);
```

to:

```css
  border-bottom: none;
  box-shadow: var(--shadow-sm);
```

- [ ] **Step 2: Round and elevate the dropdown**

Find `.topbar-dropdown { ... }` and change:

```css
  border-radius: var(--border-radius);
  box-shadow: 0 10px 25px var(--shadow-color);
```

to:

```css
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-lg);
```

- [ ] **Step 3: Gradient user avatar in Topbar.tsx**

In `frontend/src/components/Topbar.tsx`, find the inline avatar div (around lines 199-210):

```tsx
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--primary-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '16px'
          }}>
```

change `background: 'var(--primary-color)',` to:

```tsx
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', 
```

- [ ] **Step 4: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With dev server running and logged in (same login steps as Task 3, Step 8), `browser_click` the user avatar button (topbar, top-right), then `browser_evaluate`:

```js
() => {
  const dropdown = document.querySelector('.topbar-dropdown');
  return dropdown ? getComputedStyle(dropdown).borderRadius : null;
}
```

Expected: `"14px"`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css frontend/src/components/Topbar.tsx
git commit -m "Restyle topbar with softer shadows and gradient avatar"
```

---

### Task 5: Login page restyle

**Files:**
- Modify: `frontend/src/pages/Login.tsx:46-103` (outer wrapper and card inline styles)

**Interfaces:**
- Consumes: `--primary-color`, `--primary-dark`, `--radius-lg` from Task 1. No new exports — this is a leaf page.

- [ ] **Step 1: Replace the outer wrapper background**

In `frontend/src/pages/Login.tsx`, find the outer `<div style={{...}}>` (lines 47-56):

```tsx
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        padding: '20px',
      }}
    >
```

change to:

```tsx
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 20%, #4a6034 0%, #263317 70%)',
        padding: '20px',
      }}
    >
```

- [ ] **Step 2: Round the card and add elevation**

Find the card `<div className="card" style={{...}}>` (lines 57-63):

```tsx
      <div
        className="card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
        }}
      >
```

change to:

```tsx
      <div
        className="card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: 'none',
        }}
      >
```

- [ ] **Step 3: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With the dev server running, `browser_navigate` to `http://localhost:5173/login`, `browser_evaluate`:

```js
() => {
  const wrapper = document.querySelector('div[style*="radial-gradient"]');
  const card = document.querySelector('.card');
  return {
    hasGradient: !!wrapper,
    cardRadius: card ? getComputedStyle(card).borderRadius : null,
  };
}
```

Expected: `hasGradient` is `true`, `cardRadius` is `"16px"`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "Restyle login page with dark green gradient background"
```

---

### Task 6: Dashboard restyle (consistent icon-chip stat cards)

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx:56-114, 116-165`

**Interfaces:**
- Consumes: `--primary-tint`, `--success-tint`, `--warning-tint`, `--danger-tint`/`--info-tint`, `--primary-color`, `--secondary-color`, `--warning-color`, `--card-radius` from Task 1.

- [ ] **Step 1: Replace the three gradient hero stat cards with icon-chip cards**

In `frontend/src/pages/Dashboard.tsx`, replace the "Stats Grid" block (lines 57-75):

```tsx
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4c5c30 0%, #3d4926 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(76, 92, 48, 0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>{t.dashboard.totalCases}</div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>All registered cases</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4c5c30 0%, #3d4926 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(76, 92, 48, 0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>{t.dashboard.activeStatus}</div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.active}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Currently in progress</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4c5c30 0%, #3d4926 100%)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(76, 92, 48, 0.3)' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Court Cases</div>
          <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.court}</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Called for court</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--secondary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.active}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t.casesList.active}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--warning-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClockIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.pending}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t.casesList.pending}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--danger-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircleIcon style={{ width: '28px', height: '28px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.closed}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t.casesList.closed}</div>
            </div>
          </div>
        </div>
      </div>
```

with a single consistent icon-chip row (drop the separate "hero" gradient row entirely — one row of icon-chip cards, matching the approved mockup):

```tsx
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FolderIcon style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{t.dashboard.totalCases}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--success-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircleIcon style={{ width: '20px', height: '20px', color: 'var(--secondary-color)' }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>{t.dashboard.activeStatus}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.active}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--warning-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ScaleIcon style={{ width: '20px', height: '20px', color: 'var(--warning-color)' }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Court Cases</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.court}</div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--success-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircleIcon style={{ width: '20px', height: '20px', color: 'var(--secondary-color)' }} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.active}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{t.casesList.active}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--warning-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClockIcon style={{ width: '20px', height: '20px', color: 'var(--warning-color)' }} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.pending}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{t.casesList.pending}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--danger-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <XCircleIcon style={{ width: '20px', height: '20px', color: 'var(--danger-color)' }} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.closed}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{t.casesList.closed}</div>
          </div>
        </div>
      </div>
```

This introduces `FolderIcon` and `ScaleIcon` — add them to the existing heroicons import (line 5-9):

```tsx
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FolderIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
```

- [ ] **Step 2: Add a leading icon to each Recent Cases row**

Find the recent-cases `<Link>` block (around lines 131-161) and inside the first `<div>` that renders `Case #{caseItem.id}`, wrap the row content to include a small folder icon before the text — change:

```tsx
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Case #{caseItem.id}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                      {caseItem.request_type}
                    </div>
                  </div>
```

to:

```tsx
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderIcon style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Case #{caseItem.id}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                        {caseItem.request_type}
                      </div>
                    </div>
                  </div>
```

- [ ] **Step 3: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With dev server running, log in (same steps as Task 3 Step 8), `browser_navigate` to `http://localhost:5173/`, `browser_evaluate`:

```js
() => {
  const cards = document.querySelectorAll('.grid.grid-cols-3 .card');
  const first = cards[0];
  const chip = first ? first.querySelector('div') : null;
  return {
    cardCount: cards.length,
    chipBg: chip ? getComputedStyle(chip).backgroundColor : null,
  };
}
```

Expected: `cardCount` is `6` (3 primary + 3 secondary stat cards), `chipBg` is `"rgb(234, 241, 227)"` (the `--primary-tint` value).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "Restyle dashboard with consistent icon-chip stat cards"
```

---

### Task 7: Case List restyle (search bar and icon-button row actions)

**Files:**
- Modify: `frontend/src/pages/CaseList.tsx:1-6, 313-328`

**Interfaces:**
- Consumes: `.btn-icon`, `.btn-icon-view`, `.btn-icon-edit`, `.btn-icon-delete` from Task 2.

- [ ] **Step 1: Add icon imports**

Change the heroicons import (line 5):

```tsx
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
```

to:

```tsx
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
```

- [ ] **Step 2: Replace the row actions with icon buttons**

Find the actions cell (around lines 313-328):

```tsx
                    <td>
                      <div className="flex gap-10">
                        <Link to={`/cases/${caseItem.id}`} className="btn btn-sm btn-primary">
                          {t.casesList.view}
                        </Link>
                        <Link to={`/cases/${caseItem.id}/edit`} className="btn btn-sm btn-secondary">
                          {t.casesList.edit}
                        </Link>
                        <button
                          onClick={() => caseItem.id && handleDelete(caseItem.id)}
                          className="btn btn-sm btn-danger"
                        >
                          {t.casesList.delete}
                        </button>
                      </div>
                    </td>
```

with:

```tsx
                    <td>
                      <div className="flex gap-10">
                        <Link to={`/cases/${caseItem.id}`} className="btn-icon btn-icon-view" title={t.casesList.view}>
                          <EyeIcon style={{ width: '16px', height: '16px' }} />
                        </Link>
                        <Link to={`/cases/${caseItem.id}/edit`} className="btn-icon btn-icon-edit" title={t.casesList.edit}>
                          <PencilIcon style={{ width: '16px', height: '16px' }} />
                        </Link>
                        <button
                          onClick={() => caseItem.id && handleDelete(caseItem.id)}
                          className="btn-icon btn-icon-delete"
                          title={t.casesList.delete}
                        >
                          <TrashIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </td>
```

- [ ] **Step 3: Round the search input**

Find the search `<input>` (around lines 123-135) and change its inline `borderRadius: '8px'` to `borderRadius: 'var(--border-radius)'`, and `border: '1px solid var(--gray-300)'` to `border: '1.5px solid var(--border-color)'`.

- [ ] **Step 4: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With dev server running, log in (Task 3 Step 8), `browser_navigate` to `http://localhost:5173/cases`, `browser_evaluate`:

```js
() => {
  const btn = document.querySelector('.btn-icon-view');
  return btn ? { width: getComputedStyle(btn).width, bg: getComputedStyle(btn).backgroundColor } : null;
}
```

Expected (only if at least one case row exists — if `cardCount` is 0, this step instead just confirms no console errors via `browser_console_messages`): `width` is `"34px"`, `bg` is `"rgb(219, 234, 254)"` (the `--info-tint` value).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/CaseList.tsx
git commit -m "Restyle case list search bar and row actions as icon buttons"
```

---

### Task 8: Case Detail & Case Form token cleanup

**Files:**
- Modify: `frontend/src/pages/CaseDetail.tsx:137, 140, 204, 217`
- Modify: `frontend/src/pages/CaseForm.tsx:99, 102`

**Interfaces:**
- Consumes: `--text-primary`, `--text-tertiary`, `--bg-tertiary` from Task 1. No new exports.

- [ ] **Step 1: Fix hardcoded gray tokens in CaseDetail.tsx**

Line 137, change `color: 'var(--gray-900)'` to `color: 'var(--text-primary)'`.
Line 140, change `color: 'var(--gray-600)'` to `color: 'var(--text-tertiary)'`.
Line 204 (`<p style={{ color: '#6b7280' }}>No applicant information</p>`), change `color: '#6b7280'` to `color: 'var(--text-tertiary)'`.
Line 217, same change: `color: '#6b7280'` to `color: 'var(--text-tertiary)'`.

Also find the three other identical `style={{ color: '#6b7280', ... }}` empty-state paragraphs further down in the file (court dates / expenses / files empty states) and apply the same fix: `'#6b7280'` → `'var(--text-tertiary)'`.

Find the three nested form containers with `style={{ background: '#f9fafb', marginBottom: '20px' }}` (court date form, expense form, file upload form) and change `background: '#f9fafb'` to `background: 'var(--bg-tertiary)'`.

- [ ] **Step 2: Fix hardcoded gray tokens in CaseForm.tsx**

Line 99, change `color: 'var(--gray-900)'` to `color: 'var(--text-primary)'`.
Line 102, change `color: 'var(--gray-600)'` to `color: 'var(--text-tertiary)'`.

Find the two nested info cards with `style={{ marginTop: '20px', background: '#f9fafb' }}` (Applicant Information, Wanted/Defendant Information) and change `background: '#f9fafb'` to `background: 'var(--bg-tertiary)'`.

- [ ] **Step 3: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With dev server running, log in (Task 3 Step 8), `browser_navigate` to `http://localhost:5173/cases/new`, `browser_evaluate`:

```js
() => {
  const heading = document.querySelector('h2');
  return heading ? getComputedStyle(heading).color : null;
}
```

Expected: `"rgb(17, 24, 39)"` (the `--text-primary` value, `#111827`).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/CaseDetail.tsx frontend/src/pages/CaseForm.tsx
git commit -m "Replace hardcoded colors with design tokens in case detail/form"
```

---

### Task 9: User Management restyle

**Files:**
- Modify: `frontend/src/styles/UserManagement.css`
- Modify: `frontend/src/pages/UserManagement.tsx:179-190, 285-307`

**Interfaces:**
- Consumes: `--card-bg`, `--card-shadow`, `--hover-bg` (already referenced by this file but undefined before Task 1 — now defined), `--secondary-color`, `--warning-color`, `--danger-color`, `--primary-tint`, `.btn-icon*` classes from Task 2.

- [ ] **Step 1: Remove the now-duplicated icon-button rules from UserManagement.css**

Delete these blocks from `frontend/src/styles/UserManagement.css` (they're superseded by the global `.btn-icon*` classes added in Task 2):

```css
.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-edit {
  background: #f0f9ff;
  color: #0284c7;
}

.btn-edit:hover {
  background: #0284c7;
  color: white;
}

.btn-password {
  background: #f0fdf4;
  color: #10b981;
}

.btn-password:hover {
  background: #10b981;
  color: white;
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
}
```

and the corresponding dark-mode override block:

```css
[data-theme="dark"] .btn-edit {
  background: #0c4a6e;
  color: #7dd3fc;
}

[data-theme="dark"] .btn-edit:hover {
  background: #0284c7;
  color: white;
}

[data-theme="dark"] .btn-password {
  background: #064e3b;
  color: #6ee7b7;
}

[data-theme="dark"] .btn-password:hover {
  background: #10b981;
  color: white;
}

[data-theme="dark"] .btn-delete {
  background: #7f1d1d;
  color: #fca5a5;
}

[data-theme="dark"] .btn-delete:hover {
  background: #dc2626;
  color: white;
}
```

- [ ] **Step 2: Fix the form focus ring color**

Find `.form-group input:focus, .form-group select:focus` and change:

```css
  box-shadow: 0 0 0 3px rgba(104, 167, 177, 0.1);
```

to:

```css
  box-shadow: 0 0 0 3px var(--primary-tint);
```

- [ ] **Step 3: Update UserManagement.tsx to use the global icon-button classes**

In `frontend/src/pages/UserManagement.tsx`, replace the action buttons block (lines 285-307):

```tsx
                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleOpenModal(user)}
                      title="Edit User"
                    >
                      <PencilIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      className="btn-icon btn-password"
                      onClick={() => handlePasswordResetClick(user)}
                      title="Reset Password"
                    >
                      <KeyIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteClick(user)}
                      title="Delete User"
                    >
                      <TrashIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
```

with:

```tsx
                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-icon-edit"
                      onClick={() => handleOpenModal(user)}
                      title="Edit User"
                    >
                      <PencilIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      className="btn-icon btn-icon-password"
                      onClick={() => handlePasswordResetClick(user)}
                      title="Reset Password"
                    >
                      <KeyIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleDeleteClick(user)}
                      title="Delete User"
                    >
                      <TrashIcon style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
```

- [ ] **Step 4: Update role badge colors**

Replace the `getRoleBadgeColor` function (lines 179-190):

```tsx
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'var(--primary-color)';
      case 'lawyer':
        return '#10b981';
      case 'staff':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };
```

with:

```tsx
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'var(--primary-color)';
      case 'lawyer':
        return 'var(--secondary-color)';
      case 'staff':
        return 'var(--text-tertiary)';
      default:
        return 'var(--text-tertiary)';
    }
  };
```

- [ ] **Step 5: Build, lint, and visual check**

Run: `cd frontend && npm run build` — expect exit 0.
Run: `cd frontend && npm run lint` — expect exit 0.

With dev server running, log in as `admin`/`admin123` (Task 3 Step 8), `browser_navigate` to `http://localhost:5173/users`, `browser_evaluate`:

```js
() => {
  const editBtn = document.querySelector('.btn-icon-edit');
  return editBtn ? getComputedStyle(editBtn).backgroundColor : null;
}
```

Expected: `"rgb(234, 241, 227)"` (the `--primary-tint` value — confirms the global class is applied and the old `.btn-edit` local class is gone).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/styles/UserManagement.css frontend/src/pages/UserManagement.tsx
git commit -m "Restyle user management to use shared design tokens and icon buttons"
```

---

### Task 10: Final whole-app verification pass

**Files:** none modified — this task is verification-only, confirming Tasks 1-9 compose correctly across the whole app.

**Interfaces:**
- Consumes: everything produced by Tasks 1-9.

- [ ] **Step 1: Full build and lint**

Run: `cd frontend && npm run build` — expect exit 0, no errors.
Run: `cd frontend && npm run lint` — expect exit 0.

- [ ] **Step 2: Light-mode walkthrough**

With both backend (`cd backend && npm run dev`) and frontend (`cd frontend && npm run dev`) running:

1. `browser_navigate` to `http://localhost:5173/login` — `browser_console_messages` with `level: "error"` should return 0 messages.
2. Log in as `admin`/`admin123` (fill form, click Sign In) — should land on `/` (Dashboard).
3. `browser_navigate` through `/cases`, `/cases/new`, `/users`, and (if at least one case exists) `/cases/:id` — after each navigation, `browser_console_messages` with `level: "error"` should return 0 messages.
4. On each page, `browser_snapshot` and confirm no visibly broken layout (missing text, overlapping elements) in the accessibility tree.

- [ ] **Step 3: Dark-mode walkthrough**

`browser_click` the theme-toggle button in the topbar (moon/sun icon). `browser_evaluate`:

```js
() => document.documentElement.getAttribute('data-theme')
```

Expected: `"dark"`. Repeat the same page walkthrough as Step 2 (Dashboard, Case List, Case Form, User Management) and confirm via `browser_console_messages` (`level: "error"`) that no errors appear, and via `browser_evaluate` on `.sidebar` that `getComputedStyle(document.querySelector('.sidebar')).backgroundColor` returns `"rgb(16, 22, 10)"` (dark-mode `--sidebar-bg`).

- [ ] **Step 4: RTL walkthrough**

`browser_click` the language switcher (topbar), select Arabic (`العربية`) or Kurdish (`کوردی`). `browser_navigate` to `/` and `/cases`, confirm via `browser_console_messages` (`level: "error"`) that no errors appear and via `browser_snapshot` that the sidebar/content mirror correctly (this behavior is unchanged from before the redesign — just confirming the new styles didn't break it).

- [ ] **Step 5: Functional smoke test (confirm nothing broke)**

1. On `/cases`, type a search term in the search box — confirm the table filters (unchanged logic, just confirming the restyled input still fires `onChange`).
2. Toggle the sidebar collapse button — confirm it still collapses/expands.
3. Log out via the topbar user menu — confirm redirect to `/login`.

- [ ] **Step 6: Commit (if any fixes were needed during this pass)**

If Steps 2-5 surfaced any issues requiring fixes, commit them individually with a descriptive message per fix. If no issues found, no commit needed for this task.
