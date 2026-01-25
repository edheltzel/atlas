# Server-Side Performance Patterns (HIGH Impact)

Optimizing server-side rendering and data fetching eliminates sequential server requests and reduces response times.

## Rules Index

| Rule | Description | Impact |
|------|-------------|--------|
| server-parallel-fetching | Parallel database queries | High |
| server-cache-react | React cache() for deduplication | High |
| server-after-nonblocking | after() for fire-and-forget | High |
| server-dedup-props | Avoid prop drilling fetched data | Medium |
| server-cache-lru | LRU cache for expensive operations | Medium |
| server-serialization | Efficient data serialization | Medium |
| server-auth-actions | Secure server action patterns | Medium |

---

## server-parallel-fetching: Parallel Database Queries

**Problem:** Sequential database operations multiply latency.

```tsx
// WRONG: Sequential - waits for each query
async function ProfilePage({ userId }) {
  const user = await db.user.findUnique({ where: { id: userId } })
  const orders = await db.order.findMany({ where: { userId } })
  const reviews = await db.review.findMany({ where: { userId } })
  const wishlist = await db.wishlist.findFirst({ where: { userId } })

  return <Profile user={user} orders={orders} reviews={reviews} wishlist={wishlist} />
}
// Total time: user + orders + reviews + wishlist

// RIGHT: Parallel - all queries start simultaneously
async function ProfilePage({ userId }) {
  const [user, orders, reviews, wishlist] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.order.findMany({ where: { userId } }),
    db.review.findMany({ where: { userId } }),
    db.wishlist.findFirst({ where: { userId } })
  ])

  return <Profile user={user} orders={orders} reviews={reviews} wishlist={wishlist} />
}
// Total time: max(user, orders, reviews, wishlist)
```

---

## server-cache-react: React cache() for Deduplication

**Problem:** Same data fetched multiple times in component tree.

```tsx
// WITHOUT cache: Multiple DB calls
async function Header({ userId }) {
  const user = await getUser(userId)  // DB call #1
  return <UserName user={user} />
}

async function Sidebar({ userId }) {
  const user = await getUser(userId)  // DB call #2 (duplicate!)
  return <UserAvatar user={user} />
}

async function Content({ userId }) {
  const user = await getUser(userId)  // DB call #3 (duplicate!)
  return <UserProfile user={user} />
}

// WITH cache: Single DB call
import { cache } from 'react'

const getUser = cache(async (userId: string) => {
  console.log('Fetching user:', userId)  // Logs once!
  return db.user.findUnique({ where: { id: userId } })
})

async function Header({ userId }) {
  const user = await getUser(userId)  // DB call
  return <UserName user={user} />
}

async function Sidebar({ userId }) {
  const user = await getUser(userId)  // Cached!
  return <UserAvatar user={user} />
}

async function Content({ userId }) {
  const user = await getUser(userId)  // Cached!
  return <UserProfile user={user} />
}
```

**Important:** `cache()` scope is per-request. Different requests don't share cache.

```tsx
// Common pattern: Create cached getters
// lib/data.ts
import { cache } from 'react'

export const getUser = cache(async (id: string) =>
  db.user.findUnique({ where: { id } })
)

export const getOrders = cache(async (userId: string) =>
  db.order.findMany({ where: { userId } })
)

export const getProducts = cache(async () =>
  db.product.findMany()
)
```

---

## server-after-nonblocking: Non-Blocking with after()

**Problem:** Response blocked by non-critical operations.

```tsx
// WRONG: User waits for analytics and notifications
export async function POST(request: Request) {
  const data = await processOrder(request)

  await logAnalytics(data)        // User waits
  await sendNotification(data)    // User waits
  await updateInventory(data)     // User waits

  return Response.json(data)
}

// RIGHT: Response sent immediately
import { after } from 'next/server'

export async function POST(request: Request) {
  const data = await processOrder(request)

  after(() => {
    // All of these run AFTER response is sent
    logAnalytics(data)
    sendNotification(data)
    updateInventory(data)
  })

  return Response.json(data)  // Immediate response
}
```

**Use `after()` for:**
- Analytics/logging
- Sending emails/notifications
- Updating search indexes
- Cache invalidation
- Webhook calls
- Background sync

---

## server-dedup-props: Avoid Prop Drilling Fetched Data

**Problem:** Passing fetched data through many component layers.

```tsx
// WRONG: Prop drilling
async function Page({ userId }) {
  const user = await getUser(userId)
  return <Layout user={user} />  // Passed down
}

function Layout({ user }) {
  return <Sidebar user={user} />  // Passed down
}

function Sidebar({ user }) {
  return <UserCard user={user} />  // Finally used
}

// RIGHT: Fetch where needed with cache()
const getUser = cache(async (userId) => db.user.findUnique({ where: { id: userId } }))

async function Page({ userId }) {
  return <Layout userId={userId} />
}

function Layout({ userId }) {
  return <Sidebar userId={userId} />
}

async function UserCard({ userId }) {
  const user = await getUser(userId)  // Fetch here, cached
  return <div>{user.name}</div>
}
```

---

## server-cache-lru: LRU Cache for Expensive Operations

**Problem:** Recomputing expensive operations for same inputs.

```tsx
// Simple LRU cache implementation
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 500,  // Max items
  ttl: 1000 * 60 * 5  // 5 minutes
})

export async function getExpensiveData(key: string) {
  const cached = cache.get(key)
  if (cached) return cached

  const data = await computeExpensiveData(key)
  cache.set(key, data)
  return data
}

// With Next.js unstable_cache
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (userId: string) => db.user.findUnique({ where: { id: userId } }),
  ['user-cache'],  // Cache key prefix
  { revalidate: 60 }  // Revalidate every 60 seconds
)
```

---

## server-serialization: Efficient Data Serialization

**Problem:** Passing unnecessary data from server to client.

```tsx
// WRONG: Entire user object passed to client
async function ProfilePage({ userId }) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { orders: true, reviews: true, settings: true }
  })

  return <ProfileClient user={user} />  // Huge JSON!
}

// RIGHT: Select only needed fields
async function ProfilePage({ userId }) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      // Only what client needs
    }
  })

  return <ProfileClient user={user} />  // Minimal JSON
}

// BETTER: Server component renders, no serialization
async function ProfilePage({ userId }) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { orders: true }  // Full data available
  })

  return (
    <div>
      <h1>{user.name}</h1>
      <OrderList orders={user.orders} />
      {/* All rendered on server, no JSON transfer */}
    </div>
  )
}
```

---

## server-auth-actions: Secure Server Action Patterns

**Problem:** Unauthenticated or unvalidated server actions.

```tsx
// WRONG: No auth check
'use server'

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } })
}

// RIGHT: Auth and ownership validation
'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'

const deletePostSchema = z.object({
  postId: z.string().uuid()
})

export async function deletePost(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const { postId } = deletePostSchema.parse({
    postId: formData.get('postId')
  })

  const post = await db.post.findUnique({
    where: { id: postId }
  })

  if (post?.authorId !== session.user.id) {
    throw new Error('Forbidden')
  }

  await db.post.delete({ where: { id: postId } })
}
```

---

## Detection Checklist

- [ ] Sequential `await` in server components
- [ ] Same data fetched multiple times without `cache()`
- [ ] Non-critical operations blocking response
- [ ] Props passed through multiple component layers
- [ ] Full objects serialized when only some fields needed
- [ ] Server actions without authentication
- [ ] Missing input validation in server actions
