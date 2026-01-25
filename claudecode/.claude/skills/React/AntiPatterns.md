# React Anti-Patterns

Common mistakes that hurt performance. Quick reference for code review.

---

## CRITICAL: Performance Killers

### Sequential Async Operations

```tsx
// ANTI-PATTERN
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()

// FIX
const [user, posts, comments] = await Promise.all([
  fetchUser(), fetchPosts(), fetchComments()
])
```

### Barrel File Imports

```tsx
// ANTI-PATTERN
import { Button } from '@/components'  // Imports entire barrel

// FIX
import { Button } from '@/components/Button'
```

### Heavy Components Without Code Splitting

```tsx
// ANTI-PATTERN
import HeavyChart from './HeavyChart'

// FIX
const HeavyChart = dynamic(() => import('./HeavyChart'))
```

---

## HIGH: Server-Side Issues

### Duplicate Database Calls

```tsx
// ANTI-PATTERN: Each component calls DB
async function Header({ userId }) {
  const user = await getUser(userId)  // Call 1
}
async function Sidebar({ userId }) {
  const user = await getUser(userId)  // Call 2
}

// FIX: Use React cache()
const getUser = cache(async (id) => db.user.findUnique({ where: { id } }))
```

### Blocking Response for Analytics

```tsx
// ANTI-PATTERN
await logAnalytics()
return Response.json(data)

// FIX
after(() => logAnalytics())
return Response.json(data)
```

---

## MEDIUM: Re-render Issues

### Expensive State Initialization

```tsx
// ANTI-PATTERN: Runs every render
const [state, setState] = useState(expensiveComputation())

// FIX: Lazy initialization
const [state, setState] = useState(() => expensiveComputation())
```

### Stale Closure in setState

```tsx
// ANTI-PATTERN: Uses stale value
setCount(count + 1)
setCount(count + 1)  // Still uses original count!

// FIX: Functional update
setCount(c => c + 1)
setCount(c => c + 1)
```

### Derived State in useEffect

```tsx
// ANTI-PATTERN: Extra render cycle
const [items, setItems] = useState([])
const [total, setTotal] = useState(0)
useEffect(() => {
  setTotal(items.reduce((a, b) => a + b.price, 0))
}, [items])

// FIX: Derive during render
const total = useMemo(() => items.reduce((a, b) => a + b.price, 0), [items])
```

### State for Non-Rendered Values

```tsx
// ANTI-PATTERN: Re-renders on every mouse move
const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

// FIX: useRef for transient values
const mousePos = useRef({ x: 0, y: 0 })
```

### Missing useMemo Before Early Return

```tsx
// ANTI-PATTERN: Expensive work runs during loading
function Profile({ user, loading }) {
  const avatar = useMemo(() => computeAvatar(user), [user])  // Runs!
  if (loading) return <Skeleton />
  return <Avatar id={avatar} />
}

// FIX: Extract to memoized component
const AvatarComp = memo(({ user }) => {
  const avatar = useMemo(() => computeAvatar(user), [user])
  return <Avatar id={avatar} />
})

function Profile({ user, loading }) {
  if (loading) return <Skeleton />
  return <AvatarComp user={user} />  // Skipped during loading
}
```

---

## MEDIUM: Rendering Issues

### Display None Instead of Conditional Render

```tsx
// ANTI-PATTERN: Component still renders
<div style={{ display: isVisible ? 'block' : 'none' }}>
  <ExpensiveComponent />
</div>

// FIX: Don't render at all
{isVisible && <ExpensiveComponent />}
```

### Hydration Mismatch

```tsx
// ANTI-PATTERN: Flash of wrong content
const [theme, setTheme] = useState('light')  // Server: light, Client: dark

// FIX: Match server-rendered value
const [theme, setTheme] = useState(() => {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem('theme') || 'light'
})
```

---

## LOW-MEDIUM: JavaScript Issues

### O(n) Lookups in Loops

```tsx
// ANTI-PATTERN: O(n²) complexity
items.forEach(item => {
  const found = otherItems.find(o => o.id === item.refId)
})

// FIX: O(n) with Map
const itemMap = new Map(otherItems.map(o => [o.id, o]))
items.forEach(item => {
  const found = itemMap.get(item.refId)
})
```

### RegExp in Loops

```tsx
// ANTI-PATTERN: Creates regex each iteration
items.forEach(item => {
  if (/pattern/.test(item.name)) { }
})

// FIX: Hoist regex
const pattern = /pattern/
items.forEach(item => {
  if (pattern.test(item.name)) { }
})
```

### Multiple Style Assignments

```tsx
// ANTI-PATTERN: Multiple reflows
el.style.width = '100px'
el.style.height = '200px'
el.style.margin = '10px'

// FIX: Single class change
el.classList.add('expanded')
```

---

## Quick Reference Table

| Anti-Pattern | Impact | Fix |
|--------------|--------|-----|
| Sequential awaits | CRITICAL | `Promise.all()` |
| Barrel imports | CRITICAL | Direct imports |
| No dynamic import | CRITICAL | `next/dynamic` |
| Duplicate fetches | HIGH | `cache()` |
| Blocking analytics | HIGH | `after()` |
| Eager state init | MEDIUM | Lazy initializer |
| Stale setState | MEDIUM | Functional update |
| Derived state effect | MEDIUM | `useMemo` in render |
| State for non-UI | MEDIUM | `useRef` |
| display: none | MEDIUM | Conditional render |
| Array.includes loop | LOW | `Set`/`Map` |

---

## Detection Commands

```bash
# Find barrel imports
rg "from ['\"]@/(components|utils)['\"]" --type ts

# Find sequential awaits
rg "await.*\n.*await" --type ts -U

# Find useState without lazy init
rg "useState\([^(].*\(\)" --type ts
```
