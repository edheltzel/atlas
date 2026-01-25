---
name: React
description: React best practices and performance optimization patterns. USE WHEN writing React components, optimizing performance, fixing re-renders, implementing async patterns, or reviewing React code.
---

# React Best Practices

Performance-focused React patterns based on Vercel's agent-skills react-best-practices. Complements **FrontendDesign** (interfaces) and **UIDesign** (components/accessibility).

---

## Impact Tiers

| Tier | Impact | Focus Area |
|------|--------|------------|
| **CRITICAL** | 2-10x gains | Async waterfalls, bundle size |
| **HIGH** | Significant | Server-side performance |
| **MEDIUM-HIGH** | Notable | Client data fetching |
| **MEDIUM** | Measurable | Re-renders, rendering |
| **LOW-MEDIUM** | Incremental | JS micro-optimizations |
| **LOW** | Edge cases | Advanced patterns |

---

## CRITICAL: Eliminating Waterfalls

> "Waterfalls are the #1 performance killer. Each sequential await adds full network latency."

### Parallel Execution (Promise.all)

```typescript
// WRONG: Sequential - 3 round trips
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()

// RIGHT: Parallel - 1 round trip
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```

### Defer Non-Critical Awaits

```typescript
// WRONG: Blocks render for analytics
export default async function Page() {
  const data = await fetchData()
  await logAnalytics()  // Unnecessary blocking
  return <Component data={data} />
}

// RIGHT: Fire-and-forget for non-critical
export default async function Page() {
  const data = await fetchData()
  logAnalytics()  // Don't await, let it run
  return <Component data={data} />
}
```

### Suspense Boundaries for Parallel Fetching

```tsx
// WRONG: Parent awaits everything
async function Page() {
  const user = await getUser()
  const posts = await getPosts()
  return <Profile user={user} posts={posts} />
}

// RIGHT: Parallel with Suspense
function Page() {
  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserSection />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection />
      </Suspense>
    </>
  )
}
```

---

## CRITICAL: Bundle Size Optimization

### Dynamic Imports for Heavy Components

```tsx
// WRONG: Always loads heavy component
import HeavyChart from './HeavyChart'

// RIGHT: Load only when needed
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />
})
```

### Avoid Barrel Imports

```typescript
// WRONG: Imports entire library
import { Button } from '@/components'

// RIGHT: Direct import
import { Button } from '@/components/Button'
```

### Defer Third-Party Scripts

```tsx
// WRONG: Blocks rendering
<script src="https://analytics.com/script.js" />

// RIGHT: Load after page ready
<Script
  src="https://analytics.com/script.js"
  strategy="afterInteractive"
/>
```

### Conditional Feature Loading

```tsx
// WRONG: Always bundles admin code
import AdminPanel from './AdminPanel'

// RIGHT: Load based on role
const AdminPanel = dynamic(() => import('./AdminPanel'))

function Dashboard({ isAdmin }) {
  return isAdmin ? <AdminPanel /> : <UserPanel />
}
```

---

## HIGH: Server-Side Performance

### Parallel Server Fetching

```tsx
// WRONG: Sequential server fetches
async function Page() {
  const user = await db.user.findUnique({ where: { id } })
  const orders = await db.order.findMany({ where: { userId: id } })
  return <Profile user={user} orders={orders} />
}

// RIGHT: Parallel with Promise.all
async function Page() {
  const [user, orders] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.order.findMany({ where: { userId: id } })
  ])
  return <Profile user={user} orders={orders} />
}
```

### React Cache for Deduplication

```tsx
import { cache } from 'react'

// Deduplicated across component tree
const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})

// Both calls hit cache, only 1 DB query
async function Header() {
  const user = await getUser(id)
  return <UserName user={user} />
}

async function Sidebar() {
  const user = await getUser(id)  // Cached!
  return <UserAvatar user={user} />
}
```

### Non-Blocking with `after()`

```tsx
import { after } from 'next/server'

export async function POST(request: Request) {
  const data = await processRequest(request)

  // Response sent immediately, logging happens after
  after(() => {
    logAnalytics(data)
    sendNotification(data)
  })

  return Response.json(data)
}
```

---

## MEDIUM-HIGH: Client Data Fetching

### SWR Automatic Deduplication

```tsx
// Multiple components calling same key = 1 request
function UserName() {
  const { data } = useSWR('/api/user', fetcher)
  return <span>{data?.name}</span>
}

function UserAvatar() {
  const { data } = useSWR('/api/user', fetcher)  // Deduplicated!
  return <img src={data?.avatar} />
}
```

### Passive Event Listeners

```tsx
// WRONG: Blocks scrolling
element.addEventListener('scroll', handler)

// RIGHT: Non-blocking scroll
element.addEventListener('scroll', handler, { passive: true })
```

---

## MEDIUM: Re-render Optimization

### Extract to Memoized Components

```tsx
// WRONG: Expensive work runs even during loading
function Profile({ user, loading }) {
  const avatar = useMemo(() => computeAvatarId(user), [user])
  if (loading) return <Skeleton />
  return <Avatar id={avatar} />
}

// RIGHT: Skip computation when not needed
const UserAvatar = memo(function UserAvatar({ user }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }) {
  if (loading) return <Skeleton />
  return <UserAvatar user={user} />
}
```

### Lazy State Initialization

```tsx
// WRONG: Runs expensive init on every render
const [data, setData] = useState(expensiveComputation())

// RIGHT: Runs once
const [data, setData] = useState(() => expensiveComputation())
```

### Functional setState

```tsx
// WRONG: Stale closure risk
setCount(count + 1)
setCount(count + 1)  // Both use same stale value!

// RIGHT: Always current value
setCount(c => c + 1)
setCount(c => c + 1)  // Correctly increments twice
```

### Derived State Without useEffect

```tsx
// WRONG: Extra render cycle
const [items, setItems] = useState([])
const [total, setTotal] = useState(0)

useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0))
}, [items])

// RIGHT: Derive during render
const [items, setItems] = useState([])
const total = useMemo(
  () => items.reduce((sum, item) => sum + item.price, 0),
  [items]
)
```

### useRef for Transient Values

```tsx
// WRONG: Causes re-render for non-displayed value
const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

// RIGHT: No re-render for transient tracking
const mousePos = useRef({ x: 0, y: 0 })
```

### Transitions for Non-Urgent Updates

```tsx
import { useTransition } from 'react'

function SearchResults() {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')

  const handleChange = (e) => {
    // Urgent: update input immediately
    setQuery(e.target.value)

    // Non-urgent: can be interrupted
    startTransition(() => {
      filterResults(e.target.value)
    })
  }
}
```

---

## MEDIUM: Rendering Performance

### Content Visibility for Long Lists

```css
/* Skip rendering off-screen content */
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 100px;
}
```

### Conditional Rendering

```tsx
// WRONG: Always renders, just hides
<div style={{ display: isVisible ? 'block' : 'none' }}>
  <ExpensiveComponent />
</div>

// RIGHT: Don't render if not needed
{isVisible && <ExpensiveComponent />}
```

### Hydration Without Flicker

```tsx
// WRONG: Flash of wrong content
function ThemeToggle() {
  const [theme, setTheme] = useState('light')
  // Flickers from 'light' to actual theme
}

// RIGHT: Match server-rendered state
function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('theme') || 'light'
  })
}
```

---

## LOW-MEDIUM: JavaScript Performance

### Set/Map for O(1) Lookups

```typescript
// WRONG: O(n) array search
const hasItem = items.includes(searchId)
const item = items.find(i => i.id === searchId)

// RIGHT: O(1) lookup
const itemSet = new Set(items)
const hasItem = itemSet.has(searchId)

const itemMap = new Map(items.map(i => [i.id, i]))
const item = itemMap.get(searchId)
```

### Early Exit in Loops

```typescript
// WRONG: Continues after finding
for (const item of items) {
  if (item.id === targetId) {
    result = item
    // Still iterates remaining items!
  }
}

// RIGHT: Stop when found
for (const item of items) {
  if (item.id === targetId) {
    result = item
    break
  }
}
```

### Hoist RegExp Out of Loops

```typescript
// WRONG: Creates regex on every iteration
items.forEach(item => {
  if (/pattern/.test(item.name)) { ... }
})

// RIGHT: Create once
const pattern = /pattern/
items.forEach(item => {
  if (pattern.test(item.name)) { ... }
})
```

### Batch DOM/CSS Updates

```typescript
// WRONG: Multiple reflows
element.style.width = '100px'
element.style.height = '200px'
element.style.margin = '10px'

// RIGHT: Single reflow with class
element.classList.add('expanded')
```

---

## LOW: Advanced Patterns

### Event Handler Refs (Latest Value Pattern)

```tsx
// Avoid stale closures in callbacks
const handlerRef = useRef(handler)
useLayoutEffect(() => {
  handlerRef.current = handler
})

useEffect(() => {
  return subscribe(() => handlerRef.current())
}, [])  // Never stale!
```

### Initialize Once Pattern

```tsx
// Run setup exactly once, even in StrictMode
const initialized = useRef(false)

if (!initialized.current) {
  initialized.current = true
  performOneTimeSetup()
}
```

---

## React Compiler Note

> If your project has **React Compiler** enabled, manual memoization with `memo()`, `useMemo()`, and `useCallback()` is **not necessary**. The compiler automatically optimizes re-renders.

Check if enabled:
```tsx
// In your app, if this works, compiler is active
'use no memo'  // Opt-out directive
```

---

## Quick Reference

| Problem | Solution | Impact |
|---------|----------|--------|
| Sequential fetches | `Promise.all()` | CRITICAL |
| Large initial bundle | `dynamic()` imports | CRITICAL |
| Barrel imports | Direct imports | CRITICAL |
| Re-render on load state | Extract memoized component | MEDIUM |
| Stale closure in setState | Functional update `c => c + 1` | MEDIUM |
| Derived state in useEffect | `useMemo` during render | MEDIUM |
| O(n) lookups | `Set`/`Map` | LOW-MEDIUM |
| Scroll jank | `{ passive: true }` | MEDIUM-HIGH |

---

## Related Skills

- **FrontendDesign** — Production-grade interfaces, creative direction
- **UIDesign** — Components, accessibility, Vercel design guidelines

---

## Source

Based on [Vercel's react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) by @shuding — 59 performance rules across 8 categories.
