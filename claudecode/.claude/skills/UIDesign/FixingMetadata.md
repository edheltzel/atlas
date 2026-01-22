# Fixing Metadata

Source: [ui-skills.com/skills/fixing-metadata](https://www.ui-skills.com/skills/fixing-metadata) | Updated: January 2026

---

## Overview

This skill helps fix metadata issues in UI code for SEO, social sharing, and proper indexing. Invoke with `/fixing-metadata` to apply constraints or `/fixing-metadata <file>` to review specific files.

**Goal:** Minimize diffs; avoid introducing new frameworks unless requested. Work within the existing metadata system (Next.js metadata, react-helmet, manual head tags, etc.).

---

## Priority 1: Correctness & Duplication (Critical)

Define metadata once per page; prevent competing systems.

### Rules
- **Never** emit duplicate title, description, canonical, or robots tags
- Values must be deterministic (never random or client-side generated)
- Sanitize dynamic strings (prevent XSS, strip HTML)
- Every page needs safe title/description defaults

### Examples
```tsx
// WRONG - duplicate titles
<head>
  <title>Page Title</title>
  <title>Another Title</title> // Duplicate!
</head>

// WRONG - non-deterministic
<meta name="description" content={`Page loaded at ${Date.now()}`} />

// CORRECT - single, deterministic
export const metadata = {
  title: 'Product Page | My Store',
  description: 'Browse our products',
};
```

---

## Priority 2: Title & Description (High)

Every page requires proper title and description.

### Rules
- Every page requires a title in consistent format
- Keep titles short and readable; avoid keyword stuffing
- Shareable pages need meta descriptions as plain text (no markdown)

### Examples
```tsx
// CORRECT - consistent title format
// Pattern: "Page Name | Site Name" or "Page Name - Site Name"
export const metadata = {
  title: 'Dashboard | Acme App',
  description: 'View your analytics and manage your account settings.',
};

// WRONG - keyword stuffing
export const metadata = {
  title: 'Best Dashboard Analytics Dashboard Software Dashboard Tool',
};

// WRONG - markdown in description
export const metadata = {
  description: '**View** your _analytics_ and [manage settings](/settings)',
};
```

---

## Priority 3: Canonical & Indexing (High)

Proper canonical URLs and indexing directives.

### Rules
- Canonical points to the preferred URL (single source of truth)
- Use `noindex` only for private/duplicate/non-public content
- Robots meta must match actual access intent
- Staging environments default to `noindex`
- Pagination requires correct canonical behavior

### Examples
```tsx
// CORRECT - canonical URL
<link rel="canonical" href="https://example.com/products/widget" />

// CORRECT - noindex for staging
if (process.env.NODE_ENV !== 'production') {
  return <meta name="robots" content="noindex, nofollow" />;
}

// CORRECT - pagination canonical
// Page 2 of products should NOT canonical to page 1
// Each page should have its own canonical
<link rel="canonical" href="https://example.com/products?page=2" />

// WRONG - all pages canonical to homepage
<link rel="canonical" href="https://example.com/" /> // On every page
```

---

## Priority 4: Social Cards (High)

Proper Open Graph and Twitter Card metadata for sharing.

### Rules
- Shareable pages need Open Graph title, description, image
- Open Graph and Twitter images must use **absolute URLs**
- Maintain stable aspect ratios (1.91:1 for OG, 2:1 for Twitter)
- `og:url` must match the canonical URL
- Default to `twitter:card` summary_large_image

### Examples
```tsx
// CORRECT - complete social metadata
export const metadata = {
  openGraph: {
    title: 'Product Name',
    description: 'Product description for social sharing',
    url: 'https://example.com/products/widget', // Must match canonical
    images: [
      {
        url: 'https://example.com/images/widget-og.png', // Absolute URL!
        width: 1200,
        height: 630, // 1.91:1 ratio
        alt: 'Widget product image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Product Name',
    description: 'Product description for Twitter',
    images: ['https://example.com/images/widget-twitter.png'],
  },
};

// WRONG - relative image URL
images: [{ url: '/images/widget-og.png' }] // Won't work on social platforms
```

---

## Priority 5: Icons & Manifest (Medium)

Proper favicon, icons, and web app manifest.

### Rules
- Include working favicon and apple-touch-icon where relevant
- Manifest must be valid and referenced when used
- Set `theme-color` intentionally
- Keep paths stable and cacheable

### Examples
```tsx
// CORRECT - complete icon setup
export const metadata = {
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

// In manifest.json
{
  "name": "My App",
  "short_name": "App",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

// CORRECT - theme color matching design
<meta name="theme-color" content="#1a1a2e" />
```

---

## Priority 6: Structured Data (Medium)

JSON-LD for search engine understanding.

### Rules
- Add JSON-LD only when it maps to real content
- **Never** invent ratings, reviews, prices, or organization details
- One block per page unless multiple schemas required

### Examples
```tsx
// CORRECT - real product data
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": product.image,
  "offers": {
    "@type": "Offer",
    "price": product.price,
    "priceCurrency": "USD",
    "availability": product.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock"
  }
})}
</script>

// WRONG - fabricated data
{
  "@type": "Product",
  "aggregateRating": {
    "ratingValue": "4.8", // Made up!
    "reviewCount": "1000" // Made up!
  }
}
```

---

## Priority 7: Locale & Alternates (Low-Medium)

Proper language and regional handling.

### Rules
- Set `html lang` correctly
- Include `og:locale` for localized content
- Add `hreflang` alternates only when pages truly exist

### Examples
```tsx
// CORRECT - language tag
<html lang="en">

// CORRECT - locale for OG
<meta property="og:locale" content="en_US" />

// CORRECT - hreflang for real alternate pages
<link rel="alternate" hreflang="en" href="https://example.com/products" />
<link rel="alternate" hreflang="es" href="https://example.com/es/productos" />
<link rel="alternate" hreflang="x-default" href="https://example.com/products" />

// WRONG - hreflang for pages that don't exist
<link rel="alternate" hreflang="de" href="https://example.com/de/produkte" />
// But /de/produkte returns 404!
```

---

## Priority 8: Tool Boundaries (Critical)

When fixing metadata, stay focused and minimal.

### Rules
- Make minimal, scoped changes only
- Follow existing project patterns (Next.js metadata, react-helmet, manual head)
- Don't introduce new metadata libraries without explicit request

---

## Review Approach

When reviewing code for metadata:

1. **Fix critical issues first** (duplicates, canonical, indexing)
2. **Align title, description, canonical, og:url**
3. **Test social cards on real URLs** (use debuggers: Facebook, Twitter, LinkedIn)
4. **Favor stable over clever metadata**

### Quick Audit Checklist

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

### Testing Tools

- **Facebook Sharing Debugger:** developers.facebook.com/tools/debug/
- **Twitter Card Validator:** cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** linkedin.com/post-inspector/
- **Google Rich Results Test:** search.google.com/test/rich-results
