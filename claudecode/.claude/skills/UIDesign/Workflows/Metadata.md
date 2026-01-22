# Metadata Workflow

Fix metadata issues for SEO and social sharing using the fixing-metadata skill.

## When to Use

- "Fix metadata"
- "SEO audit"
- "Check meta tags"
- "Social cards not working"
- "Fix OG tags"
- "Canonical URL issues"

## Execution Steps

### 1. Load Reference
Read `FixingMetadata.md` for the 8-category rule system.

### 2. Identify Scope

Determine what to audit:
- Specific page(s)
- Template/layout file
- Entire site metadata

### 3. Audit by Priority

**Critical:**
1. **Correctness & Duplication** - No duplicate tags, deterministic values

**High:**
2. **Title & Description** - Every page has proper title/description
3. **Canonical & Indexing** - Correct canonical URL, proper robots
4. **Social Cards** - OG/Twitter with absolute image URLs

**Medium:**
5. **Icons & Manifest** - Working favicon, valid manifest
6. **Structured Data** - JSON-LD only for real content

**Low-Medium:**
7. **Locale & Alternates** - Correct lang, valid hreflang

**Critical (always):**
8. **Tool Boundaries** - Minimal changes, follow existing patterns

### 4. Report Issues

For each issue found:
1. Quote the exact problematic code
2. Explain the SEO/sharing impact
3. Propose the minimal fix
4. Note testing tools to verify

### 5. Apply Fixes

- Work within existing metadata system (Next.js, react-helmet, etc.)
- Don't introduce new frameworks
- Ensure values are deterministic
- Test with social card debuggers

## Output Format

```markdown
## Metadata Audit Results

### Critical Issues

#### Duplicate Title Tags
**Priority:** 1 - Correctness & Duplication
**File:** `app/layout.tsx`
**Code:**
```tsx
// Multiple title sources
<title>Page Title</title>
export const metadata = { title: 'Another Title' }
```

**Problem:** Competing metadata systems emit duplicate titles.

**Fix:**
```tsx
// Single source of truth
export const metadata = {
  title: 'Page Title | Site Name',
}
```

---

### High Priority Issues

#### Relative OG Image
**Priority:** 4 - Social Cards
**File:** `app/product/[id]/page.tsx`
**Code:**
```tsx
openGraph: {
  images: [{ url: '/images/product.png' }]
}
```

**Problem:** Relative URLs don't work on social platforms.

**Fix:**
```tsx
openGraph: {
  images: [{
    url: 'https://example.com/images/product.png',
    width: 1200,
    height: 630,
    alt: 'Product image',
  }]
}
```

---

### Summary
- Critical: X issues
- High: X issues
- Medium: X issues
```

## Quick Checklist

Before finishing, verify:

- [ ] No duplicate title/description/canonical tags
- [ ] All values are deterministic (no random/client-side generation)
- [ ] Title follows consistent format
- [ ] Description is plain text, no markdown
- [ ] Canonical URL is correct and singular
- [ ] Robots meta matches access intent
- [ ] Staging has noindex
- [ ] OG images use absolute URLs
- [ ] og:url matches canonical
- [ ] Manifest is valid (if used)
- [ ] JSON-LD contains only real data
- [ ] html lang is set correctly
- [ ] hreflang points to existing pages only

## Testing Tools

After making fixes, verify with:

1. **Facebook Sharing Debugger**
   https://developers.facebook.com/tools/debug/

2. **Twitter Card Validator**
   https://cards-dev.twitter.com/validator

3. **LinkedIn Post Inspector**
   https://www.linkedin.com/post-inspector/

4. **Google Rich Results Test**
   https://search.google.com/test/rich-results

5. **View Page Source**
   Check for duplicate tags in rendered HTML
