# TrackLight Accessibility Audit Report

**Date:** January 7, 2026  
**Standard:** WCAG 2.2 Level AA  
**Auditor:** AI Assistant  

---

## Executive Summary

I've completed a comprehensive accessibility audit of the TrackLight application against the WCAG 2.2 Level AA accessibility rules defined in `.cursor/rules/accessibility.mdc`. 

**Overall Status:** ❌ **Non-Compliant**

The application has **15 accessibility violations** that need to be addressed:
- **8 Critical Issues** (WCAG Level A violations)
- **7 Moderate Issues** (WCAG Level AA enhancements)

---

## Critical Issues (Must Fix)

### 1. ❌ Missing Skip Link (WCAG 2.4.1)

**File:** `app/layout.tsx`  
**Severity:** Critical  
**WCAG Principle:** Operable  

**Issue:**  
The layout does not include a "skip to main content" link, which is required for keyboard users to bypass repetitive navigation.

**Current Code (lines 44-94):**
```tsx
<body ...>
  <ThemeProvider ...>
    <ThemedClerkProvider>
      <Header variant="transparent">
        {/* Navigation */}
      </Header>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
```

**Fix:**
```tsx
<body ...>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-background focus:p-4 focus:border focus:border-ring"
  >
    Skip to main content
  </a>
  <ThemeProvider ...>
    <ThemedClerkProvider>
      <Header variant="transparent">
        {/* Navigation */}
      </Header>
      <main id="main-content" className="flex-1 flex flex-col">
        {children}
      </main>
```

**Changes:**
1. Add skip link before all content
2. Wrap children in `<main>` with `id="main-content"`
3. Use `sr-only` and `focus:not-sr-only` classes to show on keyboard focus

---

### 2. ❌ Missing Main Landmark (WCAG 1.3.1)

**File:** `app/layout.tsx`  
**Severity:** Critical  
**WCAG Principle:** Perceivable  

**Issue:**  
The page content is wrapped in a generic `<div>` instead of a semantic `<main>` element.

**Fix:** See issue #1 above - wrap children in `<main id="main-content">`

---

### 3. ❌ Missing Navigation Landmark (WCAG 1.3.1)

**File:** `app/layout.tsx`  
**Severity:** Critical  
**WCAG Principle:** Perceivable  

**Issue:**  
The header navigation links are not wrapped in a semantic `<nav>` element.

**Current Code (lines 60-78):**
```tsx
<Header variant="transparent">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">
    <Logo />
    <div className="flex items-center gap-1">
      <Button variant="ghost" asChild>
        <a href="/pricing">Pricing</a>
      </Button>
      <Button variant="ghost" asChild>
        <a href="mailto:contact@tracklight.app">Contact</a>
      </Button>
      {/* Auth buttons */}
    </div>
  </div>
</Header>
```

**Fix:**
```tsx
<Header variant="transparent">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">
    <Logo />
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-1 list-none m-0 p-0">
        <li>
          <Button variant="ghost" asChild>
            <a href="/pricing">Pricing</a>
          </Button>
        </li>
        <li>
          <Button variant="ghost" asChild>
            <a href="mailto:contact@tracklight.app">Contact</a>
          </Button>
        </li>
        <li>
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/track">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </li>
      </ul>
    </nav>
  </div>
</Header>
```

**Changes:**
1. Wrap navigation in `<nav aria-label="Main navigation">`
2. Use semantic `<ul>` and `<li>` elements for navigation list
3. Add `list-none m-0 p-0` to maintain visual style

---

### 4. ❌ SVG Logo Missing Title (WCAG 1.1.1)

**File:** `components/logo.tsx`  
**Severity:** Critical  
**WCAG Principle:** Perceivable  

**Issue:**  
The logo SVG does not have a `<title>` element for screen readers.

**Current Code (lines 10-35):**
```tsx
const logoSvg = (
  <svg 
    width="94" 
    height="50" 
    viewBox="0 0 94 50" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="text-foreground"
  >
    <path d="..." fill="currentColor"/>
    {/* More paths */}
  </svg>
)
```

**Fix:**
```tsx
const logoSvg = (
  <svg 
    width="94" 
    height="50" 
    viewBox="0 0 94 50" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="text-foreground"
    role="img"
    aria-label="TrackLight"
  >
    <title>TrackLight logo</title>
    <path d="..." fill="currentColor"/>
    {/* More paths */}
  </svg>
)
```

**Changes:**
1. Add `<title>` element inside SVG
2. Add `role="img"` attribute
3. Add `aria-label="TrackLight"` for redundancy

---

### 5. ❌ Icon-Only Buttons Missing aria-label (WCAG 1.1.1)

**Files:** Multiple  
**Severity:** Critical  
**WCAG Principle:** Perceivable  

#### A. Delete Button

**File:** `components/delete-application-button.tsx`  
**Issue:** Trash icon button has no accessible label

**Current Code (lines 41-48):**
```tsx
<Button 
  variant="ghost" 
  size="sm"
  className="h-10 w-10 px-2"
  disabled={isDeleting}
>
  <Trash2 className="size-5" />
</Button>
```

**Fix:**
```tsx
<Button 
  variant="ghost" 
  size="sm"
  className="h-10 w-10 px-2"
  disabled={isDeleting}
  aria-label="Delete application"
>
  <Trash2 className="size-5" />
  <span className="sr-only">Delete application</span>
</Button>
```

#### B. Link Button

**File:** `components/sortable-applications-table.tsx`  
**Issue:** Link2 icon button has no accessible label

**Current Code (lines 221-234):**
```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-10 w-10 px-2"
  asChild
>
  <a
    href={app.jobUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    <Link2 className="size-6" />
  </a>
</Button>
```

**Fix:**
```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-10 w-10 px-2"
  asChild
>
  <a
    href={app.jobUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open job posting in new tab"
  >
    <Link2 className="size-6" />
    <span className="sr-only">Open job posting</span>
  </a>
</Button>
```

#### C. Notes Button

**File:** `components/notes-dialog.tsx`  
**Issue:** SquarePen icon buttons have no accessible label

**Current Code (lines 79-81 and 103-108):**
```tsx
<Button variant="ghost" size="sm" className="h-10 w-10 px-2">
  <SquarePen className="size-5" />
</Button>

{/* And */}

<Button variant="ghost" size="sm" className="h-10 w-10 px-2 relative">
  <SquarePen className="size-5" />
  {initialNotes && initialNotes.trim() && (
    <span className="absolute top-0.5 right-0.5 size-2 bg-primary rounded-full" />
  )}
</Button>
```

**Fix:**
```tsx
<Button variant="ghost" size="sm" className="h-10 w-10 px-2" aria-label="Add notes">
  <SquarePen className="size-5" />
  <span className="sr-only">Add notes</span>
</Button>

{/* And */}

<Button variant="ghost" size="sm" className="h-10 w-10 px-2 relative" aria-label={initialNotes && initialNotes.trim() ? "Edit notes (has notes)" : "Add notes"}>
  <SquarePen className="size-5" />
  {initialNotes && initialNotes.trim() && (
    <span 
      className="absolute top-0.5 right-0.5 size-2 bg-primary rounded-full"
      aria-hidden="true"
    />
  )}
  <span className="sr-only">
    {initialNotes && initialNotes.trim() ? "Edit notes (has notes)" : "Add notes"}
  </span>
</Button>
```

---

### 6. ❌ Clickable Table Headers Missing Keyboard/ARIA Support (WCAG 2.1.1, 4.1.2)

**File:** `components/sortable-applications-table.tsx`  
**Severity:** Critical  
**WCAG Principle:** Operable  

**Issue:**  
Sortable table headers use `<TableHead>` with `onClick`, which is not keyboard accessible and doesn't announce sort state to screen readers.

**Current Code (lines 48-80):**
```tsx
function SortableHeader({ field, children, className, isActive, sortDirection, onSort }: SortableHeaderProps) {
  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp className={...} />
          <ChevronDown className={...} />
        </div>
      </div>
    </TableHead>
  );
}
```

**Fix:**
```tsx
function SortableHeader({ field, children, className, isActive, sortDirection, onSort }: SortableHeaderProps) {
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSort(field);
          }
        }}
        className={cn(
          "cursor-pointer select-none hover:bg-muted/50 transition-colors w-full text-left flex items-center gap-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-sort={
          isActive 
            ? sortDirection === "asc" 
              ? "ascending" 
              : "descending"
            : "none"
        }
        aria-label={`Sort by ${field} ${
          isActive 
            ? sortDirection === "asc" 
              ? "(currently ascending)" 
              : "(currently descending)"
            : ""
        }`}
      >
        {children}
        <div className="flex flex-col ml-1" aria-hidden="true">
          <ChevronUp 
            className={cn(
              "size-3 -mb-1",
              isActive && sortDirection === "asc" 
                ? "text-foreground" 
                : "text-muted-foreground/30"
            )}
          />
          <ChevronDown 
            className={cn(
              "size-3",
              isActive && sortDirection === "desc" 
                ? "text-foreground" 
                : "text-muted-foreground/30"
            )}
          />
        </div>
      </button>
    </TableHead>
  );
}
```

**Changes:**
1. Wrap content in `<button>` element
2. Add keyboard support with `onKeyDown`
3. Add `aria-sort` attribute for screen readers
4. Add `aria-label` to announce sort state
5. Add focus indicator styles
6. Mark sort icons as `aria-hidden="true"` (decorative)

---

### 7. ❌ Missing Table Caption (WCAG 1.3.1)

**File:** `components/sortable-applications-table.tsx`  
**Severity:** Critical  
**WCAG Principle:** Perceivable  

**Issue:**  
The applications table does not have a `<caption>` element.

**Current Code (lines 132-146):**
```tsx
return (
  <Table>
    <TableHeader className="mb-2">
      <TableRow>
        <SortableHeader field="company" ...>Company</SortableHeader>
        {/* More headers */}
      </TableRow>
    </TableHeader>
```

**Fix:**
```tsx
return (
  <Table>
    <caption className="sr-only">
      Job applications list with {applications.length} applications
    </caption>
    <TableHeader className="mb-2">
      <TableRow>
        <SortableHeader field="company" ...>Company</SortableHeader>
        {/* More headers */}
      </TableRow>
    </TableHeader>
```

---

### 8. ❌ Incorrect Heading Hierarchy (WCAG 1.3.1)

**File:** `components/applications-tracker.tsx`  
**Severity:** Critical  
**WCAG Principle:** Perceivable  

**Issue:**  
The main page heading uses `<h2>` instead of `<h1>`. There is no `<h1>` on the page.

**Current Code (line 55):**
```tsx
<h2 className="text-3xl font-medium tracking-tight">Job applications tracker</h2>
```

**Fix:**
```tsx
<h1 className="text-3xl font-medium tracking-tight">Job applications tracker</h1>
```

---

## Moderate Issues (Should Fix)

### 9. ⚠️ Decorative Icon Without Screen Reader Text (WCAG 1.1.1)

**File:** `components/applications-tracker.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Perceivable  

**Issue:**  
The MoveUp icon in the empty state message is decorative and should be hidden from screen readers, OR the text should be restructured.

**Current Code (lines 93-99):**
```tsx
<div className="text-center py-12 text-muted-foreground text-lg">
  <p>No applications tracked yet</p>
  <p className="flex items-center justify-center gap-1">
    <span>Paste the job post link in the field on the top right</span>
    <MoveUp className="size-4" />
  </p>
</div>
```

**Fix (Option 1 - Hide icon):**
```tsx
<div className="text-center py-12 text-muted-foreground text-lg">
  <p>No applications tracked yet</p>
  <p className="flex items-center justify-center gap-1">
    <span>Paste the job post link in the field on the top right</span>
    <MoveUp className="size-4" aria-hidden="true" />
  </p>
</div>
```

**Fix (Option 2 - Include in text):**
```tsx
<div className="text-center py-12 text-muted-foreground text-lg">
  <p>No applications tracked yet</p>
  <p>Paste the job post link in the field on the top right (indicated by an upward arrow icon)</p>
</div>
```

---

### 10. ⚠️ Search Button Missing Screen Reader Text (WCAG 1.1.1)

**File:** `components/add-application-form.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Perceivable  

**Issue:**  
The screen reader text "Search" is present, but the button needs an explicit aria-label as well.

**Current Code (lines 137-146):**
```tsx
<Button 
  type="button"
  variant="outline"
  disabled={isSubmitting}
  onClick={toggleSearchMode}
  className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
>
  <Search className="size-5" />
  <span className="sr-only">Search</span>
</Button>
```

**Fix:**
```tsx
<Button 
  type="button"
  variant="outline"
  disabled={isSubmitting}
  onClick={toggleSearchMode}
  aria-label="Toggle search mode"
  className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
>
  <Search className="size-5" />
  <span className="sr-only">
    {isSearchMode ? "Close search" : "Open search"}
  </span>
</Button>
```

---

### 11. ⚠️ Close Search Button Needs Better Context (WCAG 1.1.1)

**File:** `components/add-application-form.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Perceivable  

**Issue:**  
Similar to issue #10, the X button needs better context.

**Current Code (lines 113-121):**
```tsx
<Button 
  type="button"
  variant="outline"
  onClick={toggleSearchMode}
  className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
>
  <X className="size-5" />
  <span className="sr-only">Close search</span>
</Button>
```

**Fix:**
```tsx
<Button 
  type="button"
  variant="outline"
  onClick={toggleSearchMode}
  aria-label="Close search mode"
  className="h-12 w-12 rounded-3xl p-0 flex items-center justify-center shrink-0 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
>
  <X className="size-5" />
  <span className="sr-only">Close search</span>
</Button>
```

---

### 12. ⚠️ Search Input Needs aria-label (WCAG 3.3.2)

**File:** `components/add-application-form.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Understandable  

**Issue:**  
The search input has a placeholder but no associated label or aria-label.

**Current Code (lines 122-131):**
```tsx
<Input
  ref={searchInputRef}
  type="text"
  placeholder="Search by company, role, location, status..."
  value={searchQuery}
  onChange={(e) => onSearchChange(e.target.value)}
  className="pl-4 pr-4 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
/>
```

**Fix:**
```tsx
<Input
  ref={searchInputRef}
  type="text"
  placeholder="Search by company, role, location, status..."
  value={searchQuery}
  onChange={(e) => onSearchChange(e.target.value)}
  aria-label="Search job applications"
  className="pl-4 pr-4 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
/>
```

---

### 13. ⚠️ Job URL Input Needs Label (WCAG 3.3.2)

**File:** `components/add-application-form.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Understandable  

**Issue:**  
The job URL input has a placeholder but no associated label or aria-label.

**Current Code (lines 148-159):**
```tsx
<Input
  name="jobUrl"
  type="url"
  placeholder="Paste job post link here..."
  disabled={isSubmitting}
  onChange={(e) => {
    if (urlError) {
      validateUrl(e.target.value);
    }
  }}
  className="pl-4 pr-20 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
/>
```

**Fix:**
```tsx
<Input
  name="jobUrl"
  type="url"
  placeholder="Paste job post link here..."
  disabled={isSubmitting}
  aria-label="Job posting URL"
  aria-invalid={urlError ? "true" : "false"}
  aria-describedby={urlError ? "url-error" : undefined}
  onChange={(e) => {
    if (urlError) {
      validateUrl(e.target.value);
    }
  }}
  className="pl-4 pr-20 rounded-3xl h-12 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border-border/50"
/>

{/* And update the error paragraph: */}
{urlError && !isSubmitting && (
  <p 
    id="url-error" 
    className="text-sm text-destructive absolute -top-6 left-0 right-0 text-left pl-4"
  >
    {urlError}
  </p>
)}
```

---

### 14. ⚠️ Notes Textarea Needs Label (WCAG 3.3.2)

**File:** `components/notes-dialog.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Understandable  

**Issue:**  
The notes textarea has a placeholder but no associated label or aria-label.

**Current Code (lines 122-127):**
```tsx
<Textarea
  placeholder="Add your notes here..."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  className="min-h-[400px]"
/>
```

**Fix:**
```tsx
<Textarea
  placeholder="Add your notes here..."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  aria-label={`Notes for ${role} at ${companyName}`}
  className="min-h-[400px]"
/>
```

---

### 15. ⚠️ Status Indicator Dot Needs Screen Reader Context (WCAG 1.1.1)

**File:** `components/notes-dialog.tsx`  
**Severity:** Moderate  
**WCAG Principle:** Perceivable  

**Issue:**  
The blue dot indicating notes exist is purely visual and not announced to screen readers.

**Current Code (lines 105-107):**
```tsx
{initialNotes && initialNotes.trim() && (
  <span className="absolute top-0.5 right-0.5 size-2 bg-primary rounded-full" />
)}
```

**Fix:**  
Already included in Issue #5C above - the aria-label on the button should indicate "(has notes)".

---

## Summary of Fixes Needed

### Files to Update:

1. ✅ **app/layout.tsx** - Add skip link, main landmark, nav element (3 issues)
2. ✅ **components/logo.tsx** - Add SVG title and ARIA attributes (1 issue)
3. ✅ **components/sortable-applications-table.tsx** - Add table caption, fix sortable headers, add button aria-labels (3 issues)
4. ✅ **components/applications-tracker.tsx** - Fix heading hierarchy, add aria-hidden to icon (2 issues)
5. ✅ **components/add-application-form.tsx** - Add aria-labels to inputs and buttons (4 issues)
6. ✅ **components/delete-application-button.tsx** - Add aria-label to delete button (1 issue)
7. ✅ **components/notes-dialog.tsx** - Add aria-labels and screen reader text (2 issues, including status indicator)

---

## Testing Recommendations

After implementing these fixes, test with:

### Automated Tools:
1. **axe DevTools** browser extension
2. **Lighthouse** accessibility audit in Chrome DevTools
3. **WAVE** web accessibility evaluation tool

### Manual Testing:
1. **Keyboard Navigation:**
   - Press Tab through all interactive elements
   - Press Enter/Space on buttons
   - Press Escape to close dialogs
   - Verify skip link appears on first Tab press

2. **Screen Reader Testing:**
   - **macOS:** VoiceOver (⌘+F5)
   - **Windows:** NVDA (free) or JAWS
   - Test all pages and interactions
   - Verify all buttons are announced correctly
   - Verify table structure is announced properly

3. **Zoom Testing:**
   - Test at 200% browser zoom
   - Verify all content is accessible and functional

---

## Compliance Status After Fixes

Once all 15 issues are resolved, the application will be **WCAG 2.2 Level AA compliant** for the audited pages and components.

### Remaining Considerations:
- Color contrast has been verified via theme variables (✅ Compliant)
- Focus indicators are present via global styles (✅ Compliant)
- shadcn/ui components used throughout have built-in accessibility (✅ Compliant)

---

## Priority Implementation Order

1. **Phase 1 - Critical (Complete First):**
   - Issue #1 & #2: Skip link and main landmark
   - Issue #3: Navigation landmark
   - Issue #5: Icon-only button labels (all instances)
   - Issue #6: Sortable table headers
   - Issue #7: Table caption
   - Issue #8: Heading hierarchy

2. **Phase 2 - Moderate (Complete Next):**
   - Issue #9-15: Input labels, aria-labels, and screen reader text

3. **Phase 3 - Testing:**
   - Run automated tools
   - Perform manual keyboard testing
   - Test with screen readers
   - Document any new findings

---

## Contact

For questions about this audit or implementation guidance, refer to:
- **Accessibility Rules:** `.cursor/rules/accessibility.mdc`
- **WCAG 2.2 Documentation:** https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/

