# Async Patterns (CRITICAL Impact)

> "Waterfalls are the #1 performance killer. Each sequential await adds full network latency."

## Rules Index

| Rule | Description | Gain |
|------|-------------|------|
| async-parallel | Promise.all() for independent ops | 2-10x |
| async-defer-await | Fire-and-forget non-critical | Significant |
| async-suspense-boundaries | Parallel with Suspense | 2-10x |
| async-dependencies | Start fetches before awaits | High |
| async-api-routes | Parallel in API handlers | High |

---

## async-parallel: Promise.all for Independent Operations

**Problem:** Sequential awaits multiply latency.

```typescript
// WRONG: 3 sequential round trips
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
// Total time: user + posts + comments

// RIGHT: 1 round trip
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
// Total time: max(user, posts, comments)
```

**When to use:** Any time you have 2+ independent async operations.

---

## async-defer-await: Fire-and-Forget Non-Critical

**Problem:** Awaiting non-essential operations blocks response.

```typescript
// WRONG: Response waits for analytics
export default async function Page() {
  const data = await fetchData()
  await logAnalytics(data)  // User waits for this
  return <Component data={data} />
}

// RIGHT: Don't await non-critical
export default async function Page() {
  const data = await fetchData()
  logAnalytics(data)  // Fire and forget
  return <Component data={data} />
}
```

**Examples of fire-and-forget:**
- Analytics/logging
- Non-essential notifications
- Background sync
- Prefetching for next page

---

## async-suspense-boundaries: Parallel Fetching with Suspense

**Problem:** Parent component serializes child data fetching.

```tsx
// WRONG: Sequential fetching in parent
async function ProfilePage({ userId }) {
  const user = await getUser(userId)      // Wait...
  const posts = await getPosts(userId)    // Then wait...
  const followers = await getFollowers(userId)  // Then wait...

  return (
    <div>
      <UserHeader user={user} />
      <PostsList posts={posts} />
      <FollowersList followers={followers} />
    </div>
  )
}

// RIGHT: Parallel with Suspense boundaries
function ProfilePage({ userId }) {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <UserHeader userId={userId} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList userId={userId} />
      </Suspense>
      <Suspense fallback={<FollowersSkeleton />}>
        <FollowersList userId={userId} />
      </Suspense>
    </div>
  )
}

// Each component fetches its own data
async function UserHeader({ userId }) {
  const user = await getUser(userId)
  return <header>{user.name}</header>
}
```

**Benefits:**
- All fetches start simultaneously
- Fastest component renders first
- Progressive loading experience

---

## async-dependencies: Start Fetches Before Awaiting

**Problem:** Await delays starting subsequent fetches.

```typescript
// WRONG: Waits for user before starting posts
async function getData() {
  const user = await getUser()  // Starts and waits
  const posts = await getPosts(user.id)  // Only now starts
  return { user, posts }
}

// RIGHT: Start both, then await
async function getData() {
  const userPromise = getUser()  // Starts immediately
  const user = await userPromise
  const posts = await getPosts(user.id)
  return { user, posts }
}

// BEST: If posts doesn't need user.id
async function getData() {
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts()
  ])
  return { user, posts }
}
```

---

## async-api-routes: Parallel in API Handlers

**Problem:** Sequential DB queries in API routes.

```typescript
// WRONG: Sequential database queries
export async function GET(request: Request) {
  const user = await db.user.findUnique({ where: { id } })
  const orders = await db.order.findMany({ where: { userId: id } })
  const preferences = await db.preference.findFirst({ where: { userId: id } })

  return Response.json({ user, orders, preferences })
}

// RIGHT: Parallel queries
export async function GET(request: Request) {
  const [user, orders, preferences] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.order.findMany({ where: { userId: id } }),
    db.preference.findFirst({ where: { userId: id } })
  ])

  return Response.json({ user, orders, preferences })
}
```

---

## Detection Checklist

Look for these patterns in code review:

- [ ] Multiple sequential `await` statements
- [ ] Data fetching in parent passed to children as props
- [ ] Non-critical operations being awaited
- [ ] `await` immediately after async function call (no intermediate work)
- [ ] API routes with multiple DB queries

---

## Quick Transforms

```typescript
// Transform 1: Sequential to parallel
// Before:
const a = await fetchA()
const b = await fetchB()
const c = await fetchC()

// After:
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()])

// Transform 2: Remove unnecessary await
// Before:
await logAnalytics()
return data

// After:
logAnalytics()  // or void logAnalytics()
return data

// Transform 3: Start early
// Before:
const user = await getUser()
doSomeSyncWork()
const posts = await getPosts()

// After:
const userPromise = getUser()
const postsPromise = getPosts()
doSomeSyncWork()
const [user, posts] = await Promise.all([userPromise, postsPromise])
```
