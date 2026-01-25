# Re-render Optimization Patterns (MEDIUM Impact)

Minimizing unnecessary re-renders reduces wasted computation and improves responsiveness.

## Rules Index

| Rule | Description | Impact |
|------|-------------|--------|
| rerender-memo | Extract expensive work to memoized components | Medium |
| rerender-lazy-state-init | Lazy initialization for expensive state | Medium |
| rerender-functional-setstate | Functional updates to avoid stale closures | Medium |
| rerender-derived-state | Compute derived state during render | Medium |
| rerender-use-ref-transient-values | useRef for non-rendered values | Medium |
| rerender-transitions | useTransition for non-urgent updates | Medium |
| rerender-dependencies | Correct dependency arrays | Medium |

---

## rerender-memo: Extract to Memoized Components

**Problem:** Expensive computations run even when early return should skip them.

```tsx
// WRONG: computeAvatarId runs even during loading
function Profile({ user, loading }) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)  // Expensive!
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}

// RIGHT: Component skips computation entirely when not rendered
const UserAvatar = memo(function UserAvatar({ user }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }) {
  if (loading) return <Skeleton />
  return (
    <div>
      <UserAvatar user={user} />
    </div>
  )
}
```

**Key insight:** `memo()` wrapping a component lets React skip rendering entirely, while `useMemo()` inside a component still requires the component to render first.

---

## rerender-lazy-state-init: Lazy State Initialization

**Problem:** Expensive initialization runs on every render.

```tsx
// WRONG: createInitialState() runs every render
function Component() {
  const [state, setState] = useState(createInitialState())
  // createInitialState() called, result thrown away after first render
}

// RIGHT: Lazy initializer, runs once
function Component() {
  const [state, setState] = useState(() => createInitialState())
  // Function called only on mount
}

// Also applies to useReducer
// WRONG:
const [state, dispatch] = useReducer(reducer, createInitialState())

// RIGHT:
const [state, dispatch] = useReducer(reducer, null, createInitialState)
```

---

## rerender-functional-setstate: Functional State Updates

**Problem:** Stale closures cause incorrect state updates.

```tsx
// WRONG: Batched updates use stale value
function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)  // count is 0
    setCount(count + 1)  // count is still 0!
    // Result: count becomes 1, not 2
  }
}

// RIGHT: Functional update always has current value
function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(c => c + 1)  // c is current value
    setCount(c => c + 1)  // c is updated value
    // Result: count becomes 2
  }
}

// Also important in async handlers
function AsyncComponent() {
  const [items, setItems] = useState([])

  async function handleAdd(newItem) {
    await saveToServer(newItem)
    // WRONG: items might be stale
    setItems([...items, newItem])

    // RIGHT: always current
    setItems(current => [...current, newItem])
  }
}
```

---

## rerender-derived-state: Compute During Render

**Problem:** Derived state in useEffect causes extra render cycle.

```tsx
// WRONG: Extra render cycle
function Cart({ items }) {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + item.price, 0)
    setTotal(sum)  // Triggers another render!
  }, [items])

  return <div>Total: ${total}</div>
}

// RIGHT: Derive during render
function Cart({ items }) {
  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.price, 0),
    [items]
  )

  return <div>Total: ${total}</div>
}

// SIMPLEST: If computation is cheap, no memo needed
function Cart({ items }) {
  const total = items.reduce((acc, item) => acc + item.price, 0)
  return <div>Total: ${total}</div>
}
```

**Rule:** If state B can be computed from state A, don't store B in state.

---

## rerender-use-ref-transient-values: useRef for Non-Rendered Values

**Problem:** State updates for values that don't affect UI.

```tsx
// WRONG: Re-renders on every mouse move
function Canvas() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  // mousePos used for calculations, not display
  return <canvas onMouseMove={handleMouseMove} />
}

// RIGHT: No re-renders for transient tracking
function Canvas() {
  const mousePos = useRef({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    mousePos.current = { x: e.clientX, y: e.clientY }
  }

  return <canvas onMouseMove={handleMouseMove} />
}
```

**Good candidates for useRef:**
- Mouse/scroll position tracking
- Animation frame IDs
- Timeout/interval IDs
- Previous value comparison
- DOM element references
- Mutable values in effects

---

## rerender-transitions: useTransition for Non-Urgent Updates

**Problem:** All state updates treated as equally urgent.

```tsx
// WRONG: Input feels laggy because filter blocks
function Search({ items }) {
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(items)

  function handleChange(e) {
    const value = e.target.value
    setQuery(value)
    setFiltered(items.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase())
    ))  // Blocks the input!
  }
}

// RIGHT: Prioritize input responsiveness
function Search({ items }) {
  const [query, setQuery] = useState('')
  const [filtered, setFiltered] = useState(items)
  const [isPending, startTransition] = useTransition()

  function handleChange(e) {
    const value = e.target.value
    setQuery(value)  // Urgent: immediate

    startTransition(() => {
      // Non-urgent: can be interrupted
      setFiltered(items.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      ))
    })
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <List items={filtered} />
    </div>
  )
}
```

---

## rerender-dependencies: Correct Dependency Arrays

**Problem:** Missing or excessive dependencies cause bugs or infinite loops.

```tsx
// WRONG: Missing dependency
useEffect(() => {
  fetchData(userId)  // userId not in deps
}, [])  // Never refetches when userId changes

// WRONG: Object in deps causes infinite loop
useEffect(() => {
  doSomething(options)
}, [options])  // New object reference every render!

// RIGHT: Include all used values
useEffect(() => {
  fetchData(userId)
}, [userId])

// RIGHT: Stable reference for objects
const stableOptions = useMemo(
  () => ({ sort: sortOrder, limit: 10 }),
  [sortOrder]
)

useEffect(() => {
  doSomething(stableOptions)
}, [stableOptions])

// RIGHT: For callbacks, use useCallback
const handleClick = useCallback(() => {
  doSomething(userId)
}, [userId])
```

---

## React Compiler Note

> If React Compiler is enabled, manual `memo()`, `useMemo()`, and `useCallback()` are **not necessary**. The compiler automatically optimizes re-renders.

Check compiler status:
```tsx
// This directive works only if compiler is active
'use no memo'
```

---

## Detection Checklist

- [ ] `useMemo` inside components with early returns
- [ ] `useState(expensiveFunction())` without lazy init
- [ ] `setX(value + 1)` instead of `setX(v => v + 1)`
- [ ] Derived state stored in useState + useEffect
- [ ] State for values that don't affect rendering
- [ ] Missing or incorrect dependency arrays
- [ ] Heavy filtering/sorting blocking input
