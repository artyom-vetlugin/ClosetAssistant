# ClosetAssistant - Vision & Scope Document

## 1. Product Vision

**Closet Assistant** helps people make faster outfit decisions with what they already own. Users snap/upload clothing photos, tag them in seconds, and get simple, rule-based outfit suggestions they can visualize and save—available on phone and desktop as a lightweight, installable web app.

## 2. Problem → Value

- **Problem:** Picking outfits is slow; people forget what they own and repeat the same few combinations.
- **Value:** A fast, visual tool that organizes clothes and proposes sensible outfits in under a minute—reducing decision fatigue and surfacing underused pieces.

## 3. Target Users

- **Time-savvy students/early professionals** who want quick outfit ideas.
- **Wardrobe owners (20–40 items+)** who lose track of what they have.
- **Minimalists/budget-conscious** users aiming to reuse more, buy less.

## 4. MVP Scope

### In
- Add items: photo upload (camera or gallery) + **manual tags** (type, color, season).
- Browse wardrobe by filters (type, color, season).
- **Edit & delete items**: modify item details or remove items from wardrobe.
- **Suggest outfits** using simple pairing rules (tops + bottoms + shoes; accessories optional).
- Visual outfit builder: display items in a clean collage; **Save look**.
- **Wear log**: "I wore this today" with date & saved outfit.

### Out (Push to v2)
- Deep AI (image segmentation, smart detection, social feeds).
- Weather API, calendar analytics, inspiration photo matching.
- E-commerce or shopping suggestions.

> Keep the app fast and smooth. You can always add "cool" later.

## 5. User Stories with Acceptance Criteria (MVP)

### 5.1 Add Clothing Item

**As a** user, **I want** to add a clothing item with a photo and tags **so that** I can organize my wardrobe.

**Acceptance Criteria:**
- Given I open **Add Item**, when I select/capture a photo and fill **Type, Color, Season**, **then** I can save the item.
- If **Type/Color/Season** is missing, **then** the **Save** button is disabled and I see a short hint.
- After save, I see a success toast and the new item appears in **My Wardrobe**.

### 5.2 Browse & Filter Wardrobe

**As a** user, **I want** to filter items by type/color/season **so that** I can quickly find clothes.

**Acceptance Criteria:**
- Given items exist, when I tap **Filters**, **then** I can apply any combination of Type/Color/Season and see only matching items.
- Clearing filters resets the list.

### 5.2b Edit & Delete Items

**As a** user, **I want** to edit or delete items from my wardrobe **so that** I can keep my wardrobe organized and up-to-date.

**Acceptance Criteria:**
- Given an item exists, when I tap on it in **My Wardrobe**, **then** I can see item details with **Edit** and **Delete** options.
- When I tap **Edit**, I can modify Type, Color, Season, and save changes (photo remains the same).
- When I tap **Delete** with confirmation, the item is permanently removed from my wardrobe.
- After edit/delete, I return to the wardrobe view with updated data.

### 5.3 Get Outfit Suggestions

**As a** user, **I want** the app to suggest a few outfits from my items **so that** I can decide quickly.

**Acceptance Criteria:**
- When I tap **Suggest Outfits**, the app returns **3–6** combinations using rules (see Section 6).
- Suggestions include at least **Top + Bottom + Shoes**.
- If there aren't enough items to form combinations, show a clear message and a shortcut to **Add Item**.

### 5.4 Visualize & Save Outfit

**As a** user, **I want** to view a suggested outfit as a simple collage and save it **so that** I can reuse it later.

**Acceptance Criteria:**
- Selecting a suggestion opens a collage with the three items.
- **Save Look** stores the outfit with a timestamp and a generated name (e.g., "Casual #3").
- Saved looks appear in **Saved Outfits** list.

### 5.5 Log Today's Outfit

**As a** user, **I want** to mark a saved outfit as worn today **so that** I have a simple history.

**Acceptance Criteria:**
- Tapping **I wore this** stores a log with today's date and outfit ID.
- **History** shows a reverse-chronological list (date + outfit name).

### 5.6 Basic Performance & Installability

**As a** user, **I want** the app to load fast and be installable on my phone **so that** I can access it like a native app.

**Acceptance Criteria:**
- First meaningful view renders in **≤2s** on a mid-range phone (cached).
- App is a **PWA**: install prompt available, offline shell loads, icons present.

## 6. Matching Rules v1 (No Heavy AI)

Start with deterministic, readable rules:

- **Required structure:** Top + Bottom + Shoes (Accessories optional if present).
- **Season match:** Prefer items with matching season to the current user-selected season filter (if set).
- **Color harmony:**
  - Avoid pairing identical bold colors unless they're neutrals.
  - **Neutrals** = black, white, gray, beige, navy. Neutrals can pair with anything.
  - If both Top and Bottom are non-neutral, suggest Shoes neutral.
- **Variation rule:** Prefer using items not used in the **last 3 worn logs** to surface underused pieces.
- Generate up to **6** unique combinations; de-duplicate by item IDs.

> Implementation tip: pre-compute neutral vs non-neutral at tag time. Keep rules in one file (e.g., `rules.ts`) for easy iteration.

## 7. Data Model

### users
- id (uuid), email, display_name, created_at

### items
- id (uuid), user_id (fk), **photo_url**, **type** (top|bottom|shoes|accessory), **color** (string), **season** (all|winter|spring|summer|fall), created_at

### outfits
- id (uuid), user_id (fk), name, created_at

### outfit_items
- outfit_id (fk), item_id (fk), **role** (top|bottom|shoes|accessory), PK (outfit_id, item_id)

### wear_logs
- id (uuid), user_id (fk), outfit_id (fk), worn_date (date), created_at

### Indexes
- items(user_id, type), items(user_id, color), outfit_items(outfit_id), wear_logs(user_id, worn_date)

## 8. Tech Stack (Ship Fast on Web & Mobile)

- **Frontend: React + Vite** + **PWA** (installable on iOS/Android/Desktop), **Tailwind CSS** for speed.
  - Why: One codebase; instantly demo-able on phones; no app-store friction.
- **Backend & Auth & Storage: Supabase** (Postgres, Auth, Storage)
  - Why: You like SQL; easy row-level security; image storage out-of-the-box; free tier.
  - Alternative: Firebase if you prefer it—same architecture.
- **Image Handling:** client-side compression (e.g., browser-image-compression) before upload.
- **State Management:** React Query (server state) + simple local component state.
- **Deployment:** Vercel/Netlify for frontend; Supabase hosted.

> You'll be "browser + mobile" on day 1 via PWA. Later, if you want a true native app: reuse logic with Expo React Native v2.

## 9. Simplified Implementation Plan (Junior Developer Friendly)

### Week 1: Core Functionality

**Day 1-2: Foundation**
- Set up Vite + React + TypeScript + Tailwind
- Create basic project structure and components
- Set up Supabase project and get familiar with the dashboard

**Day 3-4: Authentication & Basic Layout**
- Implement Supabase Auth (use their pre-built UI)
- Create basic navigation and responsive layout
- Set up protected routes

**Day 5-7: Add Items Feature**
- Build "Add Item" form (photo + basic info)
- Implement image upload to Supabase Storage
- Create simple item display/grid

### Week 2: Outfit Features

**Day 8-10: Wardrobe & Filtering**
- Build "My Wardrobe" page with item grid
- Add basic filtering (type, color)
- Implement item detail view with edit/delete options

**Day 11-12: Basic Outfit Suggestions**
- Create simple outfit combination logic
- Build outfit display (simple layout)
- Add "Save Outfit" functionality

**Day 13-14: Polish & PWA**
- Add PWA manifest and basic service worker
- Test on mobile devices
- Fix responsive design issues
- Deploy to Vercel

### Optional Extensions (if time permits)
- Wear logging
- Outfit history
- Advanced filtering
- Better outfit suggestion rules

## 10. Success Metrics (MVP)

- **TTFS (Time-to-first-suggestion):** ≤ 60 seconds for a new user to add 3 items and see suggestions.
- **Add rate:** ≥ 8 items added by a new user in first session.
- **Retention proxy:** User returns and logs at least 1 outfit within 3 days.

## 11. Future v2 (When MVP Feels Solid)

- **Inspiration photo matching:** extract dominant colors and types from a reference image; map to items.
- **Weather-based suggestions** (optional API).
- **Usage analytics:** "least worn" nudges; simple stats.
- **Simple sharing:** export outfit collage image.
- **Native app (Expo)** if you want push notifications later.

## 12. Additional Implementation Notes

### For Junior Developer Context
- **Primary Goal:** Learning experience + daily-use app
- **Complexity Level:** Simple MVP, avoid over-engineering
- **Timeline:** Focus on working prototype ASAP
- **Platform:** Web-first with mobile PWA support

### Simplified Tech Decisions
- **Start with:** Basic React + Vite + Tailwind (skip React Query initially)
- **Database:** Use Supabase free tier (no need for complex backend)
- **Authentication:** Use Supabase Auth UI (pre-built components)
- **Image Storage:** Supabase Storage with basic compression
- **State Management:** Start with basic React useState/useContext
- **Deployment:** Vercel (free tier, zero config)

### Development Approach
1. **Build in working increments** - each day should have a demo-able feature
2. **Mobile-first design** - start with mobile layout, then desktop
3. **Use component libraries** - consider Headless UI or Radix for faster development
4. **Keep it simple** - avoid premature optimization

### Quick Start Checklist
- [ ] Create Vite React app with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Create Supabase project and get API keys
- [ ] Set up basic routing (React Router)
- [ ] Create basic layout with navigation
- [ ] Implement Supabase auth
- [ ] Start with "Add Item" feature first

### Learning Opportunities
- **React Hooks:** useState, useEffect, useContext
- **API Integration:** Supabase SDK
- **File Handling:** Image upload and compression
- **Responsive Design:** Mobile-first CSS
- **PWA Basics:** Service workers and manifest
- **Form Handling:** Validation and error states

### Potential Simplifications for MVP
- **Color matching:** Start with exact color matching, refine later
- **Season logic:** Make it optional initially
- **Outfit suggestions:** Start with random combinations, add rules later
- **Image compression:** Use basic browser compression first
- **Offline support:** Add after core features work

### When to Add Complexity
- **After basic CRUD works:** Add outfit suggestion rules
- **After MVP is stable:** Add React Query for caching
- **After user testing:** Add advanced features like wear tracking
- **After performance testing:** Optimize image handling

---