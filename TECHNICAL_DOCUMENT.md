# Savrd — Technical Document

## 1. Overview

Savrd is a swipe-based cafe and restaurant discovery app built for Toronto. Users select an intent (Study, Date, Budget Eats, etc.), then swipe through place cards — right to save, left to skip, up to navigate. The app combines location-based discovery with social features, gamification, and a business-facing analytics platform.

**Tech Stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL on Neon (Prisma ORM) · NextAuth.js · Google Places API · Framer Motion · Cloudinary · Vercel

---

## 2. Core Features

### 2.1 Swipe Discovery Engine

**Files**: `app/page.tsx`, `components/SwipeCard.tsx`, `lib/storage.ts`, `lib/saved-places.ts`

The main discovery interface presents a deck of 3 visible cards (rendered via `visiblePlaces.slice(0, 3).reverse()` with `AnimatePresence`). Users choose from 10 intent categories:

| Intent | ID | Description |
|--------|----|-------------|
| Study Spots | `study` | Quiet cafes with WiFi/outlets |
| Date Night | `date` | Romantic atmosphere |
| Trending Now | `trending` | Popular right now |
| Quiet Vibes | `quiet` | Low noise |
| Laptop-Friendly | `laptop` | Work-friendly |
| Group Hangout | `group` | Large seating |
| Budget Eats | `budget` | $ price level |
| Desserts | `desserts` | Bakeries & dessert spots |
| Coffee | `coffee` | Specialty coffee |
| Outdoor | `outdoor` | Patio seating |

**Swipe Mechanics** (SwipeCard.tsx):
- **Right swipe** (x > 100px threshold): Save to board → `POST /api/saves`
- **Left swipe** (x < -100px threshold): Skip → persisted to localStorage per intent via `lib/storage.ts`
- **Up swipe**: "Go Now" → opens Google Maps directions, triggers visit tracking
- **Tap**: 3D card flip (front ↔ back) using CSS `transform: rotateY(180deg)` with `backfaceVisibility: hidden`
- Physics: Framer Motion `useMotionValue` + `useTransform` for drag momentum, spring-based return animation

**Card Front**: Full-bleed photo with gradient overlay, place name, distance, price, rating, type, tags. Optional badges: "Saved" (heart), "Featured" (star), friend signals ("Saved by X"), visited indicator with count.

**Card Back**: Photo carousel with drag navigation, details grid (noise level, busyness, outlets, seating), hours, community vibes, menu link, community photos link, action buttons (Save, Go Now, Share, Add Photos).

**Skip Persistence** (`lib/storage.ts`):
- localStorage key: `savrd_skipped`
- Structure: `Record<intentId, placeId[]>`
- Skipped places are filtered out in `visiblePlaces` useMemo so they don't reappear in the same intent

**Place Fetching**: `GET /api/places?intent={id}&lat={lat}&lng={lng}&radius={r}`
- Translates intent IDs to Google Places API text search queries
- Returns places with distance calculation, photo refs, tags, community photo counts
- Fallback search with broader query if initial results are sparse

---

### 2.2 Save System

**Files**: `lib/use-save-place.ts`, `app/api/saves/route.ts`

Saves are the core action — they persist a place to an intent-specific board.

**API**: `POST /api/saves`
```json
{
  "place": { "placeId": "...", "name": "...", "address": "...", "lat": 43.6, "lng": -79.3, ... },
  "intent": "study",
  "action": "save" | "go_now",
  "recommendationId": "optional-uuid"
}
```

**Behavior**:
- Upserts the Place record in the database (creates if new, updates if existing)
- Creates a Save record with `@@unique([userId, placeId, intent])` constraint
- If saving from a recommendation, also creates a save on the `recs_from_friends` board
- Triggers badge check via `BadgeProvider` context (non-blocking)
- Shows toast notification on success

**Database Model**:
```
Save { id, userId, placeId, intent, action, recommendationId?, createdAt }
```

---

### 2.3 Visit Verification & Tracking

**Files**: `lib/use-visit-tracker.ts`, `lib/haversine.ts`, `app/api/visits/route.ts`, `app/api/visits/stats/route.ts`

Visit verification uses geolocation proximity to confirm a user physically visited a place.

**Flow**:
1. User swipes up ("Go Now") → `setPendingVisit()` stores `{ placeId, lat, lng }` in localStorage with 24-hour expiration
2. On next app open, `checkPendingVisitProximity()` reads GPS via `navigator.geolocation`
3. Haversine distance calculated — if ≤ 200 meters, `verifyVisitOnServer()` fires
4. `POST /api/visits` validates proximity server-side, enforces 1-hour cooldown between visits to same place
5. Awards badges non-blocking, returns visit count

**Visit Stats** (`GET /api/visits/stats`):
- Total visits, streak days (consecutive days with activity)
- Regular spots: places with 3+ visits, sorted by frequency

**Database Model**:
```
Visit { id, userId, placeId, verifiedAt, method ("go_now" | "manual"), createdAt }
```

**Streak Calculation** (`lib/checkBadges.ts`): Counts consecutive calendar days with at least one save or visit. Used for streak badges (3-day, 7-day, 30-day).

---

### 2.4 Boards (Saved Places)

**Files**: `app/boards/page.tsx`, `app/boards/[intent]/page.tsx`

Three sections on the boards page:

1. **My Boards**: Auto-organized by intent. Each board shows a grid of saved place thumbnails. Tapping a board opens the intent detail page with all saved places, visit badges, and detail modals.

2. **Saved Lists**: User's bookmarked curated lists from creators (see §2.10).

3. **Featured Lists**: Community-published curated lists browsable by category (Date Night, Study Spots, Budget Eats, etc.) with category filter chips.

**Board Detail** (`/boards/[intent]`):
- 2-3 column grid of place cards with photo thumbnails
- Visit badge overlay (checkmark if visited)
- Remove button (X) to unsave
- Tap opens MapPlaceDetail modal with full info + actions

---

### 2.5 Map View

**Files**: `app/map/page.tsx`, `components/FogOverlay.tsx`, `components/Filters.tsx`, `components/MapPlaceDetail.tsx`, `components/ExplorationPanel.tsx`

Interactive Google Map (`@vis.gl/react-google-maps`) with custom pin system:

**Pin Colors**:
- Orange: Visited places
- Blue: Saved places
- Grey: Nearby (unsaved/unvisited)
- Cracked pins: Places in unexplored neighborhoods

**Fog of War** (`FogOverlay.tsx`):
- Canvas-based procedural cloud overlay covering the entire map
- Visited locations punch 300m-radius holes through the fog
- User location gets a glow effect in dark mode
- Uses Google Maps `OverlayView` custom rendering with 2D canvas gradients

**Filters** (`Filters.tsx`):
- Distance bubble: 1km, 2km, 5km, 10km, 25km, 50km, "All Toronto"
- Budget bubble: $, $$, $$$, $$$$, All
- Expandable from label to full option list with spring animations

**Place Detail** (`MapPlaceDetail.tsx`):
- Desktop: Modal overlay. Mobile: Bottom sheet
- Photo carousel with drag navigation
- Community vibes, friend saves, details grid, hours
- Save / Go Now / Share actions
- Card flip animation (3D transform)

**Exploration Panel** (`ExplorationPanel.tsx`):
- Glass-morphism side panel (Vision Pro-inspired frosted effect)
- Area filter chips (Downtown, West End, East End, Midtown, North York, Scarborough, Etobicoke)
- Neighborhood list with progress bars showing exploration percentage
- Neighborhood detail view with place checklist
- Pans map to selected neighborhood

---

### 2.6 Social System

**Files**: `app/social/page.tsx`, `app/social/compare/[friendId]/page.tsx`, `components/ShareModal.tsx`, `components/AddFriendModal.tsx`, `components/FriendsListModal.tsx`, `components/CompatibilityDrawer.tsx`, `components/FriendCompareModal.tsx`

#### Friends
- Add friends by email → `POST /api/friends` creates pending request
- Accept/decline via `PATCH /api/friends`
- Share invite link (copy, WhatsApp, Twitter/X)
- Friend list with compatibility scores

**Database Model**:
```
Friendship { id, senderId, receiverId, status ("pending" | "accepted"), createdAt }
```

#### Recommendations
- Send a place recommendation to a friend with optional note (120 char limit)
- Multi-screen share flow: Menu → Pick Friend → Write Note → Sent confirmation
- Recipient sees recommendations in Social inbox tab
- Saving a recommended place also creates a `recs_from_friends` board entry

**Database Model**:
```
Recommendation { id, senderId, receiverId, placeId, note?, seen, createdAt }
```

#### Taste Compatibility (`lib/tasteScore.ts`)
Scoring algorithm (0-100 scale):
- **Shared places** (50 pts): Up to 5 shared saves, 10 pts each
- **Shared intents** (30 pts): Jaccard similarity of saved intent sets
- **Price match** (10 pts): Modal price level comparison
- **Rating similarity** (10 pts): Average rating within 0.5 threshold

#### Social Feed
Three tabs:
- **Feed**: Friend saves, visits, recommendations (grouped by user)
- **Friends**: Friend list with compatibility scores, add button
- **Inbox**: Pending recommendations from friends

#### "It's a Match"
`GET /api/social/matches` — surfaces places that both the user and a friend independently saved.

#### Friend Comparison (`/social/compare/[friendId]`)
- VS header with avatars
- Side-by-side stat cards
- Exploration overlap (shared/unique neighborhoods)
- Competitive nudge CTA

---

### 2.7 Badges & Achievements

**Files**: `lib/badges.ts`, `lib/checkBadges.ts`, `components/BadgesStats.tsx`, `components/BadgeProvider.tsx`

50 badges across 6 categories:

| Category | Badges | Examples |
|----------|--------|----------|
| Exploration | 8 | First Visit, Explorer (5/10/25/50 places), Neighborhood Pioneer (3/10/all) |
| Social | 4 | First Friend, Social Butterfly (5 friends), First Rec Sent, Rec Master (10) |
| Collector | 5 | First Save, Curator (10/25/50 saves), Intent Master (all intents) |
| Streak | 3 | 3-Day, 7-Day, 30-Day Streak |
| Photos | 5 | First Snap, Shutterbug, Full Picture, Crowd Favorite, Featured Contributor |
| Loyalty | 1 | Regular (5 visits to same place) |

**Badge Check Flow**:
1. `checkAndAwardBadges()` in `lib/checkBadges.ts` queries user stats
2. Evaluates all badge rules against current stats
3. Creates `Badge` records for newly earned badges
4. `BadgeProvider` context polls for new badges, queues display with 2-second delay
5. Badge modal appears with confetti animation, auto-dismisses after 5 seconds

**Badge Stats Calculation**:
- `visitedPlacesCount`, `neighborhoodsExploredCount` (via neighborhoods.ts)
- `friendsCount`, `recommendationsSentCount`
- `savesCount`, `allIntentsCount`
- `currentStreak` (consecutive days with activity)
- `approvedPhotosCount`, `maxLikesOnSinglePhoto`
- `hasAllCategoriesForAnyPlace` (photo categories)
- `maxVisitsToSinglePlace` (loyalty)

**Database Model**:
```
Badge { id, userId, badgeType, earnedAt }
@@unique([userId, badgeType])
```

---

### 2.8 Neighborhood Exploration

**Files**: `lib/neighborhoods.ts`, `lib/exploration-challenges.ts`, `components/ExplorationStats.tsx`, `components/ExplorationPanel.tsx`, `providers/NeighborhoodRevealProvider.tsx`

42 Toronto neighborhoods across 7 areas, each with center coordinates, radius, and popular intents.

**Neighborhood Status**: `"undiscovered"` → `"in_progress"` → `"unlocked"`

**Unlock Requirements** (scales with place count):
| Places in Neighborhood | Visits Required |
|-----------------------|-----------------|
| < 5 | 1 |
| 5–10 | 2 |
| 11–20 | 3 |
| 21–35 | 5 |
| 36+ | 7 |

**Neighborhood Detection** (`getNeighborhoodForPlace(lat, lng)`): Uses haversine distance to find which neighborhood a place falls within.

**Exploration Stats UI**:
- Expandable section with area filter chips
- Neighborhood grid with explored/unexplored status indicators
- Recent discoveries timeline
- Progress bars per neighborhood
- Neighborhood detail modal with place checklist

---

### 2.9 Community Photos

**Files**: `lib/cloudinary.ts`, `lib/photo-categories.ts`, `components/PhotoUploadPrompt.tsx`, `app/places/[id]/photos/page.tsx`, `app/api/photos/route.ts`

User-submitted photos for places, hosted on Cloudinary.

**Upload Flow**:
1. User visits a place → "Add Photos" CTA appears
2. `PhotoUploadPrompt` modal: select category, pick image, add caption (200 char limit)
3. Client-side image compression (max 1200px via Canvas API)
4. Upload to Cloudinary (`lib/cloudinary.ts`): auto-quality, auto-format, 400×400 thumbnail
5. `POST /api/photos` creates `PlacePhoto` record with `status: "pending"`
6. Admin moderates via `/business/admin/photos`

**Photo Categories**:
| ID | Label |
|----|-------|
| `food_drink` | Food & Drink |
| `vibe_interior` | Vibe & Interior |
| `seating_workspace` | Seating & Workspace |
| `exterior_entrance` | Exterior & Entrance |
| `special_features` | Special Features |

**Limits**: 10 photos per category per place, 3 categories per visit, 90-day photo age limit.

**Like System**: `POST/DELETE /api/photos/{id}/like` with `@@unique([userId, photoId])`.

**Database Models**:
```
PlacePhoto { id, userId, placeId, cloudinaryUrl, publicId, category, caption, status, createdAt }
PhotoLike { id, userId, photoId, createdAt }
```

---

### 2.10 Curated Lists (Creator Feature)

**Files**: `app/boards/list/[id]/page.tsx`, `components/CreatorMyLists.tsx`, `components/CreatorDashboard.tsx`, `app/api/curated-lists/`

Creators can build and publish curated place lists.

**Creator Flow**:
1. Apply for creator status → `POST /api/creators`
2. Toggle creator mode (dev tool) → `POST /api/creators/dev-toggle`
3. Create list with title + description → `POST /api/curated-lists`
4. Add places to list → `POST /api/curated-lists/{id}/items`
5. Drag-to-reorder items → `PATCH /api/curated-lists/{id}/reorder`
6. Publish with category (requires ≥ 3 places) → `PATCH /api/curated-lists/{id}/publish`

**List Categories**: Date Night, Study Spots, Budget Eats, Hidden Gems, Brunch, Coffee, and more.

**User Interaction**:
- Browse featured lists on Boards page with category filter
- Save/unsave lists → `POST/DELETE /api/curated-lists/{id}/save`
- View list detail with all places, creator info, share modal

**Creator Dashboard**:
- Editable bio, Instagram, TikTok handles
- Stats: followers, views, saves
- Top places by saves
- List management (create, edit, delete, publish/unpublish)

**Database Models**:
```
CuratedList { id, creatorId, title, description, category, status, isPublic, publishedAt, viewCount }
CuratedListItem { id, listId, placeId, note, position }
CuratedListSave { id, userId, listId }
```

---

### 2.11 Vibe Voting

**Files**: `lib/vibeTags.ts`, `components/VibeVotingSheet.tsx`, `components/CommunityVibes.tsx`, `app/api/vibe-votes/route.ts`

Community-sourced vibe tags for places. 32 tags across 4 categories:

| Category | Tags |
|----------|------|
| Atmosphere | Cozy, Trendy, Chill, Lively, Romantic, Minimalist, Rustic, Artsy |
| Good For | Studying, Date Night, Group Hangout, Solo Visit, Working Remote, Catching Up, People Watching, Reading |
| Food & Drink | Great Coffee, Amazing Pastries, Healthy Options, Brunch Spot, Late-Night Eats, Cocktail Bar, Budget-Friendly, Splurge-Worthy |
| Practical | Fast WiFi, Lots of Outlets, Quiet, Loud/Energetic, Good for Photos, Pet-Friendly, Spacious, Hidden Gem |

**Voting**: Bottom sheet with categorized tags, max 8 selections per vote. `POST /api/vibe-votes` with `@@unique([userId, placeId, vibeTag])`.

**Display**: `CommunityVibes` component fetches aggregated vibe votes for a place, shows top tags with emoji + count + attribution.

---

### 2.12 Featured Placements (Paid Promotions)

**Files**: `app/page.tsx` (insertion logic), `components/SwipeCard.tsx` (badge), `app/api/featured-placements/route.ts`, `app/api/featured-placements/[id]/impressions/route.ts`, `app/api/business/admin/featured/route.ts`

Paid promotion system for businesses to feature their places in the swipe deck.

**Insertion Logic** (`app/page.tsx`):
1. `fetchFeatured` fetches from `GET /api/featured-placements?intent={id}&lat={lat}&lng={lng}`
2. API maps intent IDs to labels, filters by active status + date range + distance (haversine)
3. Featured card inserted at position `Math.min(2, merged.length)` in `visiblePlaces` useMemo
4. Featured cards bypass skip/save history filters (always shown once per session)
5. `setFeaturedPlace(null)` after swipe prevents re-insertion

**Detection**: `isFeatured` prop computed via `placementId` property — only featured cards have this property set (reliable detection independent of state sync).

**Badge**: Gold star badge with `#CA8A04` color, positioned inline above the place name. Styled with semi-transparent gold background, blur backdrop, on both card front and back.

**Impression Tracking**: `POST /api/featured-placements/{id}/impressions` with actions: `"impression"`, `"swipe_right"`, `"swipe_left"`.

**Admin Management**: `GET/PATCH /api/business/admin/featured` — list placements with CTR metrics, update status.

**Database Model**:
```
FeaturedPlacement {
  id, googlePlaceId, businessUserId,
  intents (JSON array), status, priority,
  startDate, endDate,
  impressions, swipeRights, swipeLefts,
  createdAt
}
```

---

### 2.13 Visit Streaks & Regular Spots

**Files**: `components/VisitStatsSection.tsx`, `app/api/visits/stats/route.ts`

**Regular Spots**: Places with 3+ visits shown in a horizontal carousel on the profile, with visit count badges and photo thumbnails.

**Active Streaks**: Weekly streak tracking showing current and best streak (consecutive days with saves/visits). Streak badges at 3, 7, and 30 days.

---

### 2.14 Onboarding Tutorial

**File**: `components/OnboardingTutorial.tsx`

3-step tooltip overlay shown on first visit:
1. Swipe mechanics (left/right/up)
2. Pick your vibe (intent selection)
3. See place details (card flip)

Progress dots indicate current step. Dismissed permanently after completion.

---

## 3. User-Facing Pages

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Discover | Optional | Swipe deck with intent chips, budget filter, featured placements |
| `/landing` | Landing | No | Marketing page with waitlist signup, city showcase, confetti |
| `/boards` | My Boards | Yes | Saved places by intent, saved lists, featured lists |
| `/boards/[intent]` | Board Detail | Yes | Grid of saved places for one intent |
| `/boards/list/[id]` | List Detail | Yes | Curated list view with creator controls |
| `/map` | Map View | Optional | Google Map with pins, fog-of-war, exploration panel |
| `/social` | Social Hub | Yes | Feed, friends, inbox tabs |
| `/social/compare/[id]` | Friend Compare | Yes | Side-by-side exploration comparison |
| `/profile` | Profile | Yes | Stats, badges, settings, photos, creator dashboard |
| `/places/visited` | Visited Places | Yes | Visit history with counts |
| `/places/[id]/photos` | Photo Gallery | Optional | Community photos for a place |
| `/pro` | Savrd Pro | No | Subscription pricing (coming soon) |
| `/for-business` | For Business | No | B2B marketing page |
| `/creators/[id]` | Creator Profile | No | Public creator page with lists |

---

## 4. Business & Admin Pages

| Route | Page | Role | Description |
|-------|------|------|-------------|
| `/business/login` | Login | Public | Business account authentication |
| `/business/register` | Register | Public | Business account creation |
| `/business/dashboard` | Dashboard | Business | Key metrics, analytics overview |
| `/business/analytics` | Analytics | Business | Save trends, visitor demographics |
| `/business/pricing` | Pricing | Business | Subscription tiers (Starter/Growth/Pro) |
| `/business/settings` | Settings | Business | Account and place settings |
| `/business/claim` | Claim | Business | Claim ownership of a place |
| `/business/admin` | Admin | Admin | User management, moderation, system stats |
| `/business/admin/analytics` | Admin Analytics | Admin | Platform-wide analytics |
| `/business/admin/photos` | Photo Moderation | Admin | Review/approve/reject community photos |

**Access Control** (`app/business/layout.tsx`): Checks `session.user.role` — requires `"business"` or `"admin"`. Shows `AccessDenied` UI for unauthorized users. Admin routes additionally require `role === "admin"`.

---

## 5. API Routes

### Places & Discovery
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/places` | No | Search nearby places by intent + location |
| GET | `/api/places/photo` | No | Proxy Google Places photo by reference |
| GET | `/api/places/photos` | No | Community photos for a place |

### Saves
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/saves` | Yes | User's saved places (grouped by intent) |
| POST | `/api/saves` | Yes | Save a place to a board |
| DELETE | `/api/saves` | Yes | Remove a place from boards |

### Visits
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/visits` | Yes | Visit history (deduplicated, with counts) |
| POST | `/api/visits` | Yes | Verify visit (proximity check, cooldown) |
| GET | `/api/visits/stats` | Yes | Streaks, regular spots, totals |

### Recommendations
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/recommendations` | Yes | Received recommendations (unseen or all) |
| POST | `/api/recommendations` | Yes | Send recommendation to friend |
| PATCH | `/api/recommendations` | Yes | Mark recommendations as seen |
| DELETE | `/api/recommendations/[id]` | Yes | Dismiss a recommendation |

### Friends & Social
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/friends` | Yes | User's friends list |
| POST | `/api/friends` | Yes | Send friend request |
| DELETE | `/api/friends` | Yes | Remove friend |
| GET | `/api/friends/[id]/compatibility` | Yes | Taste compatibility score |
| GET | `/api/friends/[id]/saves` | Yes | Friend's saved places |
| GET | `/api/friends/[id]/exploration-compare` | Yes | Exploration comparison |
| POST | `/api/friends/place-signals` | Optional | Friend signals for place list |
| GET | `/api/social/matches` | Yes | Places both user + friend saved |

### Activity
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/activity` | Yes | Social feed (saves, visits, recs) |

### Curated Lists
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/curated-lists` | No | Featured/category lists |
| POST | `/api/curated-lists` | Yes | Create new list |
| GET | `/api/curated-lists/[id]` | No | List detail with items |
| PATCH | `/api/curated-lists/[id]` | Yes | Edit list metadata |
| DELETE | `/api/curated-lists/[id]` | Yes | Delete list (creator only) |
| POST | `/api/curated-lists/[id]/publish` | Yes | Publish list to community |
| PATCH | `/api/curated-lists/[id]/unpublish` | Yes | Move to draft |
| POST | `/api/curated-lists/[id]/items` | Yes | Add place to list |
| DELETE | `/api/curated-lists/[id]/items` | Yes | Remove place from list |
| PATCH | `/api/curated-lists/[id]/reorder` | Yes | Reorder list items |
| POST | `/api/curated-lists/[id]/save` | Yes | Save list to collection |
| DELETE | `/api/curated-lists/[id]/save` | Yes | Unsave list |
| GET | `/api/curated-lists/mine` | Yes | Creator's own lists |
| GET | `/api/curated-lists/saved` | Yes | User's saved lists |

### Photos
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/photos` | No | Photos for a place |
| POST | `/api/photos` | Yes | Upload community photo |
| GET | `/api/photos/me` | Yes | User's uploaded photos |
| GET | `/api/photos/categories` | No | Available photo categories |
| POST | `/api/photos/[id]/like` | Yes | Like a photo |
| DELETE | `/api/photos/[id]/like` | Yes | Unlike a photo |

### Badges
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/badges` | Yes | User's earned badges |
| GET | `/api/badges/check` | Yes | Check + award new badges |

### Exploration
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/exploration-stats` | Yes | Neighborhood exploration stats |
| GET | `/api/exploration-stats/check-new-neighborhood` | Yes | Check if visit unlocks new area |
| GET | `/api/exploration/challenges` | Yes | Active exploration challenges |

### Vibe Voting
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/vibe-votes` | Yes | User's vibe votes |
| POST | `/api/vibe-votes` | Yes | Submit vibe vote for a place |

### User & Profile
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/user` | Yes | Current user info |
| PATCH | `/api/user` | Yes | Update user profile |
| GET | `/api/profile` | Yes | Profile data |
| PATCH | `/api/profile` | Yes | Update profile fields |
| GET | `/api/profile/check-username` | No | Check username availability |
| GET | `/api/profile/taste-score` | Yes | Taste score breakdown by intent |

### Featured Placements
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/featured-placements` | No | Get featured placement for intent |
| POST | `/api/featured-placements/[id]/impressions` | No | Track impression/swipe |

### Creators
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/creators` | No | Featured creators list |
| POST | `/api/creators` | Yes | Apply for creator status |
| GET | `/api/creators/me` | Yes | Creator's own stats |
| GET | `/api/creators/[id]` | No | Creator public profile |
| GET | `/api/creators/[id]/analytics` | Yes | Creator list performance |
| POST | `/api/creators/dev-toggle` | Yes | Toggle creator mode (dev) |

### Business & Admin
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/business/register` | No | Register business account |
| GET | `/api/business/account` | Business | Business account info |
| POST | `/api/business/claim` | Business | Claim a place |
| GET | `/api/business/search-places` | Business | Search places to claim |
| GET | `/api/business/analytics` | Business | Claimed place analytics |
| GET | `/api/business/admin/places` | Admin | All places management |
| GET | `/api/business/admin/saves` | Admin | Aggregate save stats |
| GET | `/api/business/admin/visits` | Admin | Aggregate visit stats |
| GET/PATCH | `/api/business/admin/photos` | Admin | Photo moderation queue |
| GET | `/api/business/admin/users` | Admin | User management |
| GET | `/api/business/admin/claims` | Admin | Pending business claims |
| GET | `/api/business/admin/analytics` | Admin | Platform-wide analytics |
| POST | `/api/business/admin/make-admin` | Admin | Grant admin role |
| GET/PATCH | `/api/business/admin/featured` | Admin | Manage featured placements |

### Other
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/waitlist` | No | Add email to waitlist |
| POST | `/api/follow` | Yes | Follow a creator |

---

## 6. Database Schema

### Core Models

```
User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  username      String?   @unique
  customAvatar  String?
  displayName   String?
  isCreator     Boolean   @default(false)
  creatorBio    String?
  instagramHandle String?
  tiktokHandle  String?
  websiteUrl    String?
  verifiedAt    DateTime?
  hashedPassword String?
  role          String    @default("user")  // "user" | "business" | "admin"
}

Place {
  id            String   @id @default(uuid())
  googlePlaceId String   @unique
  name          String
  address       String
  lat           Float
  lng           Float
  placeType     String?
  priceLevel    Int?     // 1-4
  rating        Float?
  photoUrl      String?
  vibeTags      Json?
}

Save {
  id               String   @id @default(uuid())
  userId           String
  placeId          String
  intent           String
  action           String   // "save" | "go_now"
  recommendationId String?
  @@unique([userId, placeId, intent])
}

Visit {
  id         String   @id @default(uuid())
  userId     String
  placeId    String
  verifiedAt DateTime
  method     String   // "go_now" | "manual"
  @@index([userId, placeId])
}

Friendship {
  id         String @id @default(uuid())
  senderId   String
  receiverId String
  status     String @default("pending")  // "pending" | "accepted"
  @@unique([senderId, receiverId])
}

Recommendation {
  id         String  @id @default(uuid())
  senderId   String
  receiverId String
  placeId    String
  note       String?
  seen       Boolean @default(false)
}

Badge {
  id        String   @id @default(uuid())
  userId    String
  badgeType String
  earnedAt  DateTime
  @@unique([userId, badgeType])
}

VibeVote {
  id      String @id @default(uuid())
  userId  String
  placeId String
  vibeTag String
  @@unique([userId, placeId, vibeTag])
}

CuratedList {
  id          String  @id @default(uuid())
  creatorId   String
  title       String
  description String?
  category    String?
  status      String  // "draft" | "published"
  isPublic    Boolean @default(false)
  publishedAt DateTime?
  viewCount   Int     @default(0)
}

CuratedListItem {
  id       String @id @default(uuid())
  listId   String
  placeId  String
  note     String?
  position Int
  @@unique([listId, placeId])
}

CuratedListSave {
  id     String @id @default(uuid())
  userId String
  listId String
  @@unique([userId, listId])
}

PlacePhoto {
  id            String @id @default(uuid())
  userId        String
  placeId       String
  cloudinaryUrl String
  publicId      String
  category      String
  caption       String?
  status        String @default("pending")  // "pending" | "approved" | "rejected"
  @@index([placeId, status, category])
}

PhotoLike {
  id      String @id @default(uuid())
  userId  String
  photoId String
  @@unique([userId, photoId])
}

Follow {
  id          String @id @default(uuid())
  followerId  String
  followingId String
  @@unique([followerId, followingId])
}

BusinessClaim {
  id            String @id @default(uuid())
  userId        String
  googlePlaceId String
  businessName  String
  businessEmail String?
  businessPhone String?
  ownerRole     String?
  status        String @default("pending")
  @@unique([userId, googlePlaceId])
}

BusinessAnalytics {
  id            String @id @default(uuid())
  googlePlaceId String
  date          DateTime
  totalSaves    Int @default(0)
  totalVisits   Int @default(0)
  swipeRights   Int @default(0)
  swipeLefts    Int @default(0)
  topIntents    Json?
  @@unique([googlePlaceId, date])
}

FeaturedPlacement {
  id             String   @id @default(uuid())
  googlePlaceId  String
  businessUserId String?
  intents        Json     // string[]
  status         String   @default("active")
  priority       Int      @default(0)
  startDate      DateTime
  endDate        DateTime
  impressions    Int      @default(0)
  swipeRights    Int      @default(0)
  swipeLefts     Int      @default(0)
  @@index([status, startDate, endDate])
}

Waitlist {
  id    String @id @default(uuid())
  email String @unique
}
```

---

## 7. Key Components

| Component | File | Purpose |
|-----------|------|---------|
| SwipeCard | `components/SwipeCard.tsx` | 3D-flippable discovery card with swipe gestures |
| AppShell | `components/AppShell.tsx` | Desktop sidebar + mobile layout wrapper |
| BottomNav | `components/BottomNav.tsx` | Mobile bottom navigation (5 tabs) |
| MapPlaceDetail | `components/MapPlaceDetail.tsx` | Place detail modal/sheet for map view |
| PlaceDetailSheet | `components/PlaceDetailSheet.tsx` | Mobile bottom sheet for place details |
| FogOverlay | `components/FogOverlay.tsx` | Canvas fog-of-war on map |
| ExplorationPanel | `components/ExplorationPanel.tsx` | Neighborhood exploration glass panel |
| ExplorationStats | `components/ExplorationStats.tsx` | Neighborhood grid with progress |
| ShareModal | `components/ShareModal.tsx` | Multi-screen share/recommend flow |
| AddFriendModal | `components/AddFriendModal.tsx` | Friend request + invite sharing |
| FriendsListModal | `components/FriendsListModal.tsx` | Friend management list |
| CompatibilityDrawer | `components/CompatibilityDrawer.tsx` | Taste compatibility circular score |
| FriendCompareModal | `components/FriendCompareModal.tsx` | Side-by-side exploration comparison |
| BadgesStats | `components/BadgesStats.tsx` | Badge carousel with detail modal |
| BadgeProvider | `components/BadgeProvider.tsx` | Global badge unlock notifications |
| VisitCelebration | `components/VisitCelebration.tsx` | Confetti celebration on visit verify |
| VisitStatsSection | `components/VisitStatsSection.tsx` | Regular spots + streak display |
| PhotoUploadPrompt | `components/PhotoUploadPrompt.tsx` | Photo upload with compression |
| CommunityVibes | `components/CommunityVibes.tsx` | Aggregated vibe tag display |
| VibeVotingSheet | `components/VibeVotingSheet.tsx` | Vibe tag selection sheet |
| CreatorDashboard | `components/CreatorDashboard.tsx` | Creator analytics + settings |
| CreatorMyLists | `components/CreatorMyLists.tsx` | Creator list CRUD interface |
| OnboardingTutorial | `components/OnboardingTutorial.tsx` | First-visit tutorial overlay |
| SignInModal | `components/SignInModal.tsx` | Google OAuth sign-in |
| Filters | `components/Filters.tsx` | Distance + budget filter bubbles |
| ThemeProvider | `components/ThemeProvider.tsx` | Light/Dark/System theme management |
| Toast | `components/Toast.tsx` | Toast notification system |
| Providers | `components/Providers.tsx` | NextAuth session wrapper |

---

## 8. Utility Libraries

| File | Purpose |
|------|---------|
| `lib/prisma.ts` | Singleton PrismaClient with Neon HTTP adapter |
| `lib/types.ts` | `Place` and `FriendSignal` type definitions |
| `lib/haversine.ts` | Haversine distance formula (meters) |
| `lib/storage.ts` | localStorage skip tracking per intent |
| `lib/saved-places.ts` | localStorage saved places cache |
| `lib/use-save-place.ts` | Save/unsave hook with API calls + badge checks |
| `lib/use-visit-tracker.ts` | Visit verification workflow (pending → proximity → verify) |
| `lib/use-photo-url.ts` | Google Places photo URL fetcher hook |
| `lib/tasteScore.ts` | Taste compatibility algorithm (0-100) |
| `lib/vibeTags.ts` | 32 vibe tags across 4 categories |
| `lib/badges.ts` | 50 badge definitions (6 categories) |
| `lib/checkBadges.ts` | Badge evaluation + awarding logic |
| `lib/neighborhoods.ts` | 42 Toronto neighborhoods with coordinates |
| `lib/exploration-challenges.ts` | Neighborhood unlock requirements |
| `lib/cloudinary.ts` | Cloudinary upload/delete with transforms |
| `lib/photo-categories.ts` | Photo category definitions + limits |
| `lib/utils/time.ts` | Relative time formatting |

---

## 9. Authentication

**Provider**: NextAuth.js v5 (beta 30) with Prisma adapter

**Methods**:
1. **Google OAuth**: Primary sign-in method (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. **Credentials**: Email + bcrypt-hashed password (business accounts)

**Session Strategy**: JWT with `user.id` and `user.role` injected via callbacks

**Roles**:
- `user` (default): Standard consumer features
- `business`: Business dashboard access, place claiming, analytics
- `admin`: Full admin panel, photo moderation, user management, featured placement management

---

## 10. Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#E85D2A` | Orange accent, CTAs, active states |
| Secondary | `#CA8A04` | Gold, featured badges, star ratings |
| Dark BG | `#0E1116` | Text color, dark mode background |
| Card BG | `#161B22` | Dark mode card surfaces |
| Inner Card | `#1C2128` | Nested card backgrounds |
| Border Light | `#D0D7DE` | Light mode borders |
| Border Dark | `#30363D` | Dark mode borders |

**Principles**: Mobile-first, full-bleed photos with gradient overlays, no emojis as icons (inline SVGs only), edge-to-edge navigation with `px-4 md:px-6`.

**Theme Support**: Light / Dark / System via ThemeProvider with localStorage persistence.

---

## 11. External Integrations

| Service | Usage | Config |
|---------|-------|--------|
| Google Places API | Place search, photos, details | `GOOGLE_PLACES_API_KEY` |
| Google Maps JS API | Map rendering, markers, overlays | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Google OAuth | User authentication | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Neon PostgreSQL | Primary database | `DATABASE_URL` |
| Cloudinary | Community photo hosting | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Vercel | Hosting & deployment | Automatic via Next.js |

---

## 12. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.12 | Framework (App Router + Turbopack) |
| react | 19.1.0 | UI library |
| typescript | — | Type safety |
| prisma | 7.4.0 | ORM + migrations |
| @prisma/adapter-neon | — | Neon serverless adapter |
| next-auth | 5.0.0-beta.30 | Authentication |
| framer-motion | 12.34.0 | Animations & gestures |
| @vis.gl/react-google-maps | 1.7.1 | Google Maps React wrapper |
| cloudinary | 2.9.0 | Image hosting SDK |
| tailwindcss | 4.x | Utility-first CSS |
| bcryptjs | — | Password hashing |
| lucide-react | — | Icon library |
| react-confetti | — | Celebration animations |
