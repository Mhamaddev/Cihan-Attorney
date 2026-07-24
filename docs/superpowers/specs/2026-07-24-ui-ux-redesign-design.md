# Cihan Attorney Frontend UI/UX Redesign

## Goal

Visual/UX-only redesign of the whole frontend (`frontend/src`). Primary users are a mix of lawyers (want speed/density) and office staff (want simplicity/clarity), so the system should read as clean and obvious at a glance without sacrificing information density on data-heavy screens (case tables).

**Priority is look & feel.** No new features, no routing changes, no changes to data loading, API calls, or business logic. Every page keeps its current functionality exactly as-is; only appearance and minor in-page layout/spacing change.

Visual direction ("Modern Refined") and the exact palette below were approved interactively via mockups during brainstorming (Login screen and Dashboard shell v2, both approved).

## Design Tokens

Replace the token block in `frontend/src/index.css`. All values below are pulled directly from the approved mockups.

### Color

| Token | Light value | Usage |
|---|---|---|
| `--primary-color` | `#3d5228` | primary actions, active nav pill, links |
| `--primary-dark` | `#243218` | gradient endpoint, hover state |
| `--primary-tint` | `#eaf1e3` | icon-chip background (neutral/total stat) |
| `--sidebar-bg` | `#1f2b14` | sidebar background (new — sidebar is no longer white) |
| `--accent-gold` | `#e8c66b` | logo mark accent on dark sidebar only |
| `--success-color` / tint | `#1e7a34` / `#e3f2e6` | active status, success badges/icon chips |
| `--warning-color` / tint | `#a5690a` / `#fdf0da` | pending status, warning badges/icon chips |
| `--danger-color` / tint | keep existing `#ef4444`, tint `#fee2e2` | closed/error status |
| `--info-color` / tint | keep existing `#1e40af` / `#dbeafe` | informational badges |
| `--bg-secondary` (page bg) | `#f7f8f5` | app content background |
| `--text-primary` | `#1f2937` | headings/body |
| `--text-tertiary` | `#8a93a6` | secondary/meta text |
| `--card-border` | `#edf0e8` | card borders |

Dark mode: derive an equivalent dark palette (near-black-green sidebar stays close to its current near-black value, cards move to dark slate, tints become lower-opacity versions of the same hues). Follow the same relationships as light mode — don't invent a different scheme for dark.

**Bug fix included in this pass:** `--border-radius`, `--shadow-sm`, `--shadow-md`, `--shadow-lg` are currently declared only inside the `[data-theme="dark"]` block in `index.css`, not in `:root`. They must be defined in `:root` (light mode values) and overridden in `[data-theme="dark"]` as needed — right now light mode has no working value for them at all.

### Typography

- Replace the `IBM Plex` `@font-face`/body font with **Inter** (weights 400/500/600/700/800). Self-host static Inter WOFF2 files under `frontend/public/fonts/` (Inter is SIL Open Font License, freely redistributable) and declare matching `@font-face` rules in `index.css`, the same pattern used for `ibm.ttf` today — no external CDN dependency.
- Headings: 700–800 weight, tighter line-height than body.
- Arabic/Kurdish text: Inter has no Arabic glyphs, so those locales will fall back to the next font in the stack (system Arabic font) automatically — this already happens today under IBM Plex, so it's not a regression, just keep a sane fallback stack (`'Inter', 'Segoe UI', Tahoma, sans-serif`).

### Shape & elevation

- Border radius scale: small controls 8px, cards/buttons 12–14px, prominent containers (login card) 16px — rounder than today's flat 8px everywhere.
- Shadows: soft, low-opacity (`0 2px 8px rgba(0,0,0,.05)` for resting cards), no harsh borders as the primary separator.

## Shell Components

### Sidebar (`frontend/src/components/Sidebar.tsx`)
- Background becomes solid `--sidebar-bg` (dark green) instead of `--bg-primary` (white) — this is the main structural visual change.
- Active link: solid `--primary-color` rounded pill (9px radius), not a left-border accent.
- Logo mark (`ScaleIcon`) rendered in `--accent-gold` for contrast against the dark background.
- Nav icons: consistent 15–18px stroke-width-2 icons (already Heroicons outline — keep the library, just verify consistent sizing).
- Collapse/expand behavior, mobile overlay, and RTL mirroring: unchanged functionally.

### Topbar (`frontend/src/components/Topbar.tsx`)
- All existing controls stay exactly as they are functionally: theme toggle, language switcher (EN/KU/AR), notifications dropdown, settings button, user menu + logout.
- Restyle only: replace hard `border-bottom`/dropdown borders with shadow-based separation, round dropdown corners more (12px), user avatar becomes a gradient circle using `--primary-color` → `--primary-dark`.

## Shared Components (`index.css`)

- **Buttons** (`.btn`, `.btn-primary`, etc.): 10px radius, primary button gets a subtle gradient (`--primary-color` → `--primary-dark`) and soft colored shadow; hover states darken/lift slightly.
- **Cards** (`.card`): 12–14px radius, `--card-border` border, soft shadow. Stat/info cards use a consistent pattern everywhere: white card + tinted icon-chip (38–40px rounded square) + big number — never mix a solid-gradient stat card next to plain white ones on the same screen (this inconsistency is part of what read as unclear in the original Dashboard draft).
- **Badges** (`.badge-*`): keep the pill shape (already tinted in the current code — `badge-success`/`badge-warning`/etc. already use light-bg/dark-text pairs), just harmonize the hues with the new green-based palette above.
- **Tables** (`.table`): more vertical padding per row (touch-friendlier for less tech-savvy staff), clearer hover highlight (already present, increase contrast slightly). Row actions (View/Edit/Delete in `CaseList.tsx`) become compact icon buttons with a `title` tooltip instead of three adjacent text buttons, to reduce visual clutter in the actions column.
- **Forms** (`.form-group`, `.form-control`): more spacing between fields, larger input padding (touch target), a visible focus ring in `--primary-color`.

## Pages

- **Login** (`Login.tsx`): dark green radial-gradient background, white rounded card (16px radius), gradient primary button — matches the approved mockup exactly. No change to the fetch/auth logic, only markup/styling.
- **Dashboard** (`Dashboard.tsx`): stat cards restyled per the shared-component rule above (icon-chip + number, all consistent style — this directly addresses the "dashboard needs to be more clear" feedback from brainstorming, which turned out to be about emoji-style icons reading as messy; the fix is real Heroicons + consistent card treatment). Recent Cases list gets a small leading icon per row and a "View All →" link styled as a text link, not a button.
- **Case List** (`CaseList.tsx`): search input restyled (rounded, icon-prefixed, matches token radius), filter toggle button and active-filter-count badge keep their current logic, just restyled. Table per shared-component rules above. Search/filter/sort logic is unchanged.
- **Case Detail, Case Form, User Management**: no bespoke mockups were made for these; they inherit the shared component system (cards, buttons, badges, forms, tables) as-is rather than getting one-off treatments, so the whole app reads as one consistent product. Implementation should apply the same tokens/components rather than inventing new patterns per page.

## Out of Scope

- No new features, pages, or routes.
- No changes to API calls, data shapes, or business logic in `backend/` or `frontend/src/services/api.ts`.
- No changes to translation strings/keys in `frontend/src/i18n/` beyond what's needed to keep existing text working with the new styles.
- No changes to authentication/authorization behavior.

## Testing / Verification

- Visually verify each page in both light and dark mode, and in at least one RTL locale (Arabic or Kurdish), after implementation.
- Confirm existing functionality is untouched: login, case CRUD, search/filter, user management (admin-only), theme toggle, language switch, logout — all should behave identically to before, only look different.
