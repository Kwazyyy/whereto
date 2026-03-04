# WhereTo — UI Redesign Plan
**Created:** March 4, 2026
**Status:** In Progress

---

## Tools
- **UI UX Pro Max Skill** — installed at `.claude/skills/ui-ux-pro-max/`, auto-activates for UI work
- **design-system/MASTER.md** — brand colors, typography, component specs (reference for every prompt)
- **21st.dev** — browse for premium components as needed
- **Nano Banana 2 Pro** — generate graphics/illustrations for Pro page, landing page, empty states

---

## Brand Reference (Quick)
- Primary: #E85D2A (burnt orange)
- Primary Hover: #D14E1F
- Accent/Gold: #CA8A04 (premium elements, Pro badges, achievements, success states)
- Dark BG: #0E1116 / Cards: #161B22 / Inner: #1C2128 / Border: #30363D
- Light BG: #FFFFFF / Cards: #F6F8FA / Border: #D0D7DE
- Text Dark Mode: #FFFFFF / Muted: #8B949E
- Text Light Mode: #0E1116 / Muted: #656D76
- Error: #F85149 / Warning: #D29922
- Font: Plus Jakarta Sans (all text)

---

## Phase 1: Foundation

### 1.1 — Desktop Sidebar Nav + Mobile Bottom Nav
**Priority:** HIGHEST — affects every page layout

**Desktop (lg: breakpoint and above):**
- Left sidebar, fixed position, full height
- WhereTo logo at top
- Nav items with icon + label: Discover, Map, Boards, Social, Profile
- Active state: orange highlight on icon + label
- User avatar at bottom of sidebar
- Collapsed mode (icons only) on medium screens (md:), expanded (icon + label) on large (lg:)
- Style references: Instagram sidebar (expanded + collapsed), Tinder sidebar

**Mobile (below md: breakpoint):**
- Keep current bottom nav bar
- WhereTo logo in a top bar header on every page
- Active tab: orange icon + label

**Technical:**
- Modify the root layout to conditionally render sidebar (desktop) or bottom nav (mobile)
- All page content shifts right when sidebar is present
- Sidebar width: ~240px expanded, ~72px collapsed
- Bottom nav height: stays as-is (~64px + safe area)

---

## Phase 2: Core Pages

### 2.1 — Profile Page — 3-Column Redesign
**Left column (sticky, ~280px):**
- Avatar (large), name, @username, location
- "Add a short bio..." / bio text
- Edit Profile button
- Stats row: Saved | Visited | Friends
- Taste Score card (big number + intent breakdown bars)

**Middle column (scrollable, flex-1):**
- Recent Boards (horizontal scroll of square cards)
- My Lists (list cards, + New List button)
- My Photos (horizontal scroll with status badges)
- My Regular Spots (horizontal scroll, only if 3+ visits exist)
- Badges (row of earned badges with labels, "X / 26 earned", See All link)
- Exploration (COMPACT version only):
  - Progress bar: "X/42 neighborhoods explored — Y%"
  - Top 3 recently unlocked neighborhoods
  - "Explore on Map →" link (navigates to Map tab)
  - NO full neighborhood grid here — that moves to Map tab

**Right column (sticky, ~300px):**
- Discovery Preferences: Default Intent, Default Distance, Auto-detect location, Theme
- Account: Email, Joined date, App Version
- About: Send Feedback, Privacy Policy, Terms of Service
- Sign Out button
- "Made with love in Toronto"

**Mobile:** Single column, all sections stacked vertically. Settings accessible via gear icon → modal (current behavior).

**Fixes:**
- Neighborhood names: show full text (wider cards or tooltip)
- Badge labels visible on hover (desktop) or tap (mobile)
- Input borders: thinner, subtler (#30363D not orange)
- Creator Dashboard: keep at bottom of middle column
- "My Lists" cards: better styling, fix broken image placeholder

### 2.2 — Discover / Swipe Cards
**Desktop:**
- Constrain card to max-width ~500-600px, centered in content area
- Card should feel like an actual card floating on the page, not full-bleed
- Subtle shadow around card edges

**Mobile:**
- Keep current full-width immersive style

**Both:**
- Center intent chips horizontally
- Card back action buttons: make Save, Go Now, Share equal width (not Go Now dominating)
- "Saved" button state: filled heart + subtle orange border, NOT alarming red background
- Community Photos empty state: show place photo as blurred background + camera icon + text
- Share button: `navigator.share()` on mobile (native share sheet), centered modal on desktop
- Share modal on desktop: Copy Link, Send to Friend, X (Twitter), WhatsApp — centered, not bottom sheet

**Filters (budget + distance):**
- Keep current position (top-right of card) but ensure they're not hidden behind card content

### 2.3 — Social Page Redesign
**Desktop — full-width 3-column layout:**
- Left: could hold friends list / navigation
- Center: Activity feed with larger images in feed cards (not tiny thumbnails)
- Right: Sidebar with Inbox, It's a Match!, Suggested Friends

**Add Friend:**
- Desktop: centered modal (not bottom sheet)
- Include: email input + Send Request button
- Add "Invite Friends" section: Copy invite link, Share on WhatsApp, Share on X/Twitter, Share on Instagram

**Friends section (reference: Duolingo):**
- Following / Followers style tabs (or "My Friends" / "Find Friends")
- Find friends (by email)
- Invite friends (share link, socials)

**"It's a Match!" popup:**
- Triggers when a new mutual save match happens (only in Social tab)
- Celebratory design: both avatars overlapping, "It's a Match!" heading
- Shows matched place card: photo, name, category, price, rating, address
- "Plan it" CTA button (future: booking system entry point)
- "Share to Story" / dismiss option
- Confetti or subtle animation

**Exploration Comparison:**
- Proper desktop layout (not phone-only stretched)
- Side-by-side stats in a wider card layout
- Neighborhood comparison in a proper grid

**Mobile:**
- Tabbed layout (Activity | Friends | Inbox) — keep current approach but polish

### 2.4 — Map Page Fixes
**Marker colors:**
- Saved places → Blue markers
- Visited places → Orange markers (on-brand)
- Nearby/Explore → Grey or White markers (neutral)
- Update legend to match

**Intent chips:** Center horizontally

**Marker popup:**
- Dark themed (match map background, not white card)
- Larger text, better contrast
- Show: photo, name, rating, price, distance, "View Details" button

**Place detail (from marker tap):**
- Desktop: slide-in side panel (right side), NOT full-screen takeover
- Mobile: bottom sheet that slides up
- Fill with full details: photo carousel, details grid, hours, menu link, community photos, friend signals, action buttons
- Same rich detail view as Discover card back

**Exploration integration (NEW — moved from Profile):**
- Collapsible panel or overlay showing:
  - Exploration progress bar
  - Neighborhood list with discovered/undiscovered status
  - Area filter chips (Downtown, West End, East End, Midtown)
  - Ties into fog-of-war visual
- This replaces the full neighborhood grid that was on the Profile page

### 2.5 — Boards Page
**Your Boards section:**
- Keep 2-column grid but make cards slightly taller (better photo display)
- Board cover collage + title + place count overlay

**Board detail page (when you tap into a board):**
- Board header: collage cover photo + title + place count
- Desktop: place cards in 2-3 column grid with large photos, name, address, rating, price
- Mobile: vertically scrollable large place cards (reference: travel app style with big photos)
- NOT a plain list of small rows

**Place detail from board:**
- Show full rich detail view inline (side panel on desktop, bottom sheet expanding on mobile)
- Same detail component used everywhere (discover, map, boards)

**Saved Lists + Featured Lists:**
- Smaller square/portrait cards
- Desktop: 3-4 column grid
- Mobile: 2 column grid
- Each card: cover photo, list title, place count, creator name/avatar
- Bookmark toggle for save/unsave

**Section separation:**
- Visual dividers or different background tones between Your Boards / Saved Lists / Featured Lists

---

## Phase 3: Premium & Marketing

### 3.1 — Pro Page Polish
- Hero section: gradient background (orange #E85D2A → gold #CA8A04), phone mockup showing Pro features
- PRO badge: gold (#CA8A04) with subtle glow, larger and more prominent
- Feature cards: accent borders or gradient top edges, not all identical flat dark cards
- Add Free vs Pro comparison table (side-by-side)
- Move pricing section higher (don't make users scroll)
- Tighten spacing throughout
- Use Nano Banana 2 Pro for feature illustrations
- FAQ accordion: ensure it's visible without scrolling past empty space

### 3.2 — Landing Page Refresh
- Evaluate current landing page against new design system
- Use 21st.dev components for sections (hero, features, testimonials, CTA)
- Use Nano Banana 2 Pro for hero graphics and illustrations
- Leverage ui-ux-pro-max skill for layout pattern recommendations
- Ensure consistency with new sidebar nav (landing page likely excluded from sidebar since it's marketing)

### 3.3 — Business Pages & Admin Polish
- Dashboard, claims page, analytics, photo moderation
- Consistency pass: align with MASTER.md design system
- Professional dark theme matching consumer app
- Better data visualization for analytics

---

## Phase 4: Global Polish

### 4.1 — Consistency Pass (applies to ALL pages)
**Modals:**
- Desktop: centered modal with backdrop blur
- Mobile: bottom sheet (slide up from bottom)
- Exception: small confirmations can be centered on both

**Input fields:**
- Thinner borders (#30363D dark, #D0D7DE light)
- NOT thick orange borders
- Orange only on focus state (border + subtle ring)

**Chips/Badges:**
- Consistent sizing across all pages
- Active: bg-[#E85D2A] text-white
- Inactive: bg-[#1C2128] text-[#8B949E] border border-[#30363D]

**Buttons:**
- Primary: bg-[#E85D2A] hover:bg-[#D14E1F] text-white rounded-xl
- Secondary: border border-[#30363D] bg-transparent rounded-xl hover:border-[#E85D2A]
- All buttons equal sizing when in a row (no single button dominating)

**Transitions:**
- All interactive elements: 200ms ease transitions
- Hover states: subtle, no layout-shifting transforms

**Toast notifications:**
- Consistent position (top-right on desktop, top-center on mobile)
- Consistent styling matching design system

**Empty states:**
- Warm, inviting — not just grey icon + text on black void
- Use blurred background images or subtle illustrations where possible

---

## Implementation Order
1. Desktop sidebar nav + mobile bottom nav (foundation)
2. Profile 3-column redesign
3. Discover/swipe card desktop sizing + centered chips
4. Social page redesign
5. Map fixes (markers, chips, popup, exploration panel)
6. Boards page (card sizing, board detail, featured lists)
7. Pro page polish
8. Landing page refresh
9. Business pages consistency pass
10. Global polish pass

---

## Responsive Approach
Every feature is built responsive in ONE prompt:
- Desktop behavior specified with `lg:` and `md:` breakpoints
- Mobile behavior is the default (mobile-first)
- No separate mobile codebase
- Test both with screenshots before committing
