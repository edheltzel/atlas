# Bundle Size Patterns (CRITICAL Impact)

Reducing initial JavaScript improves Time to Interactive (TTI) and Largest Contentful Paint (LCP).

## Rules Index

| Rule | Description | Gain |
|------|-------------|------|
| bundle-dynamic-imports | Code-split heavy components | Major |
| bundle-barrel-imports | Avoid index re-exports | Major |
| bundle-defer-third-party | Load scripts after interactive | High |
| bundle-conditional | Load features based on conditions | High |
| bundle-preload | Preload critical resources | Medium |

---

## bundle-dynamic-imports: Code-Split Heavy Components

**Problem:** Large components increase initial bundle.

```tsx
// WRONG: Always in main bundle
import HeavyChart from './HeavyChart'
import HeavyEditor from './HeavyEditor'
import HeavyDataGrid from './HeavyDataGrid'

function Dashboard() {
  return (
    <div>
      <HeavyChart data={data} />
      {showEditor && <HeavyEditor />}
    </div>
  )
}

// RIGHT: Dynamic imports with loading states
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false  // If client-only
})

const HeavyEditor = dynamic(() => import('./HeavyEditor'), {
  loading: () => <EditorSkeleton />
})

function Dashboard() {
  return (
    <div>
      <HeavyChart data={data} />
      {showEditor && <HeavyEditor />}
    </div>
  )
}
```

**Good candidates for dynamic imports:**
- Charts/graphs (Chart.js, D3, Recharts)
- Rich text editors (TipTap, Slate, Draft.js)
- Data grids (AG Grid, TanStack Table)
- Code editors (Monaco, CodeMirror)
- PDF viewers
- Map components (Mapbox, Google Maps)
- Admin-only features

---

## bundle-barrel-imports: Avoid Index Re-Exports

**Problem:** Barrel files import entire libraries.

```typescript
// components/index.ts (barrel file)
export { Button } from './Button'
export { Card } from './Card'
export { Modal } from './Modal'
export { DataGrid } from './DataGrid'  // 200KB
export { Chart } from './Chart'  // 150KB

// WRONG: Imports EVERYTHING in barrel
import { Button } from '@/components'
// Bundles Button + Card + Modal + DataGrid + Chart

// RIGHT: Direct import
import { Button } from '@/components/Button'
// Only bundles Button
```

**Tree-shaking doesn't save you because:**
- Side effects in modules prevent elimination
- Re-exports break static analysis
- Common patterns defeat optimization

**Fix barrel files:**
```typescript
// Option 1: Remove barrel, use direct imports

// Option 2: Lazy barrel with dynamic imports
// components/index.ts
export const DataGrid = dynamic(() => import('./DataGrid'))
export const Chart = dynamic(() => import('./Chart'))

// Option 3: Separate entry points
// components/core/index.ts (lightweight)
export { Button } from './Button'
export { Card } from './Card'

// components/heavy/index.ts (separate chunk)
export { DataGrid } from './DataGrid'
export { Chart } from './Chart'
```

---

## bundle-defer-third-party: Load Scripts After Interactive

**Problem:** Third-party scripts block page rendering.

```tsx
// WRONG: Blocks rendering
<script src="https://analytics.example.com/script.js" />
<script src="https://chat.example.com/widget.js" />

// RIGHT: Next.js Script component
import Script from 'next/script'

function Layout({ children }) {
  return (
    <>
      {children}

      {/* Load after page is interactive */}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="afterInteractive"
      />

      {/* Load when browser is idle */}
      <Script
        src="https://chat.example.com/widget.js"
        strategy="lazyOnload"
      />

      {/* Load before page interactive (critical) */}
      <Script
        src="https://critical.example.com/auth.js"
        strategy="beforeInteractive"
      />
    </>
  )
}
```

**Strategy guide:**
| Strategy | Use For |
|----------|---------|
| `beforeInteractive` | Critical auth, A/B testing |
| `afterInteractive` | Analytics, monitoring |
| `lazyOnload` | Chat widgets, social buttons |

---

## bundle-conditional: Load Features Based on Conditions

**Problem:** Loading code that most users never need.

```tsx
// WRONG: Admin code in everyone's bundle
import AdminPanel from './AdminPanel'
import ModeratorTools from './ModeratorTools'

function Dashboard({ user }) {
  return (
    <div>
      <MainContent />
      {user.isAdmin && <AdminPanel />}
      {user.isModerator && <ModeratorTools />}
    </div>
  )
}

// RIGHT: Load only when needed
const AdminPanel = dynamic(() => import('./AdminPanel'))
const ModeratorTools = dynamic(() => import('./ModeratorTools'))

function Dashboard({ user }) {
  return (
    <div>
      <MainContent />
      {user.isAdmin && <AdminPanel />}
      {user.isModerator && <ModeratorTools />}
    </div>
  )
}
```

**Common conditional scenarios:**
- Role-based features (admin, moderator)
- Feature flags
- A/B test variants
- Platform-specific code (mobile/desktop)
- Locale-specific components

---

## bundle-preload: Preload Critical Resources

**Problem:** Critical resources discovered too late.

```tsx
// Preload resources you know will be needed
import Head from 'next/head'

function Page() {
  return (
    <>
      <Head>
        {/* Preload critical font */}
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload LCP image */}
        <link
          rel="preload"
          href="/hero-image.webp"
          as="image"
        />

        {/* Preconnect to API domain */}
        <link
          rel="preconnect"
          href="https://api.example.com"
        />

        {/* DNS prefetch for third parties */}
        <link
          rel="dns-prefetch"
          href="https://analytics.example.com"
        />
      </Head>
      <Content />
    </>
  )
}
```

---

## Analysis Commands

```bash
# Analyze bundle with Next.js
ANALYZE=true next build

# Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer stats.json

# Find large dependencies
npx depcheck
npx cost-of-modules

# Check import cost in VS Code
# Install "Import Cost" extension
```

---

## Detection Checklist

- [ ] Imports from barrel files (`@/components`, `@/utils`)
- [ ] Heavy libraries imported unconditionally
- [ ] Third-party scripts without strategy
- [ ] Admin/premium features in main bundle
- [ ] Large images without preload hints
- [ ] Missing `next/dynamic` for heavy components
