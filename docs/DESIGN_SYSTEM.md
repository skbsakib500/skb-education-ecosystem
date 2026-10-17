# SKB Design System — v1.0

> **Premium by Design · Intelligent by Architecture · Accessible by Default · Future-Ready by Engineering**

Last updated: 2026-10-17 (Phase 2 — Foundation)

## Philosophy

- **Clean hierarchy** over decoration
- **Motion with purpose**, not noise
- **Accessibility is a feature**, not an afterthought
- **Tokens over hardcoded values** — everything derives from variables

## Token Categories

### Colors (semantic)

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `--color-bg` | Page background | `#f6fbf8` | `#070f0b` |
| `--color-bg-soft` | Section alt background | `#eef6f0` | `#0c1912` |
| `--color-surface` | Card/dialog surface | `rgba(255,255,255,0.88)` | `rgba(18,32,24,0.84)` |
| `--color-surface-solid` | Opaque surface | `#ffffff` | `#111f16` |
| `--color-fg` | Primary text | `#0f2218` | `#e8f3eb` |
| `--color-fg-muted` | Secondary text (WCAG AA 6.7:1) | `#3d5748` | `#c0d6c7` |
| `--color-fg-subtle` | Tertiary text (WCAG AA 5.2:1) | `#5a7364` | `#a2bba8` |
| `--color-accent` | Brand / CTA | `#10b981` | `#34d399` |
| `--color-accent-hover` | Brand hover | `#059669` | `#6ee7b7` |
| `--color-success` / `warning` / `danger` | Status | standard | standard |
| `--color-focus-ring` | Focus outline | `#059669` | `#34d399` |

**Rule:** Never use hex codes directly in JSX. Always use Tailwind semantic utilities (`text-fg-muted`, `bg-surface-solid`, `border-border`).

### Typography (fluid, `clamp()`-based)

| Utility | Range | Use case |
|---------|-------|----------|
| `text-fluid-display` | 40px → 64px | Hero headline |
| `text-fluid-h1` | 32px → 48px | Page title |
| `text-fluid-h2` | 24px → 36px | Section header |
| `text-fluid-h3` | 20px → 28px | Card header |
| `text-fluid-body-lg` | 18px | Lead paragraph |
| `text-fluid-body` | 16px | Default paragraph |
| `text-fluid-body-sm` | 14px | Secondary text (mobile min) |
| `text-fluid-caption` | 13px | Metadata labels |
| `text-fluid-micro` | 12px | Badges — **absolute minimum** |

**Bengali rule:** Always apply `.bangla` class for Bengali text — adds `line-height: 1.75` + `letter-spacing: 0.01em`.

### Spacing (4px base)

`--space-1` (4px) through `--space-20` (80px). Tailwind's default scale (`p-1` = 4px) already matches — no custom classes needed.

### Elevation

| Utility | Use case |
|---------|----------|
| `shadow-elevation-1` | Subtle border substitute |
| `shadow-elevation-2` | Cards resting |
| `shadow-elevation-3` | Cards hover / dropdowns |
| `shadow-elevation-4` | Modals / elevated dialogs |

### Radius

`rounded-sm/md/lg/xl/2xl/full` mapped to tokens (`6px / 10px / 14px / 20px / 24px / 9999px`).

### Motion

- `duration-fast` (120ms) — hover states
- `duration-base` (200ms) — default
- `duration-slow` (320ms) — dialogs, modals
- `ease-out` — entrances, expansion
- `ease-in-out` — reversible interactions
- **`prefers-reduced-motion` respected globally**

## Accessibility

- ✅ WCAG 2.2 AA target
- ✅ Focus rings on all interactive elements (`:focus-visible`)
- ✅ Minimum body font 16px
- ✅ Minimum label font 13px
- ✅ Touch targets ≥ 40px (WCAG 2.5.8)
- ✅ Reduced-motion support
- ✅ Contrast verified (WCAG AA on muted/subtle)

## Rules for Contributors

1. **Never** use `text-[13px]` or below for body copy — use `text-fluid-body` or `text-fluid-body-sm`.
2. **Never** use `style={{ color: '#xxx' }}` — use `text-fg` / `text-fg-muted` / `text-accent`.
3. **Never** add `animate-*` without checking `prefers-reduced-motion` needs.
4. Bengali text → `.bangla` class.
5. New components → use only semantic tokens (no raw hex).
6. Icons → keep 1.5px stroke, 16/20/24px sizes only.
7. Shadows → only `shadow-elevation-*` (no raw `shadow-lg`).

## Migration Path (Phases 3–6)

- **Phase 3:** Build `components/ui/{Button,Input,Card,Dialog,Badge}.tsx` on tokens
- **Phase 4:** Landing redesign using new components
- **Phase 5:** Auth + Hub + Feed redesign
- **Phase 6:** Remaining pages + full a11y audit (axe-core in CI)

## Verification

```bash
# After Phase 4, expect:
# - Lighthouse A11y score ≥ 95
# - No text-[10px] / text-[11px] in app/ or components/
# - No raw hex codes in JSX
