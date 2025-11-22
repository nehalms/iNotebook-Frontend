# iNotebook Redesign - Comprehensive Design Guidelines

## Design Approach

**Selected System:** Material Design 3 with custom adaptations for productivity workflows

**Rationale:** iNotebook is a feature-rich productivity application requiring clear information hierarchy, consistent patterns across complex features (notes, tasks, admin, games, image editing), and scalable component architecture. Material Design 3 provides the elevated card systems, data visualization patterns, and form controls needed for this application while maintaining modern aesthetics.

**Key Principles:**
- Information clarity over decoration
- Consistent elevation and surface treatments
- Purposeful motion that aids comprehension
- Scalable component system across all feature modules

---

## Typography System

**Font Family:** 
- Primary: Inter (via Google Fonts) for UI elements, body text, forms
- Accent: Space Grotesk for headings and emphasis

**Type Scale:**
- Display: text-4xl (36px) - Dashboard headers, feature section titles
- H1: text-3xl (30px) - Page titles
- H2: text-2xl (24px) - Section headers, card titles
- H3: text-xl (20px) - Subsection headers
- Body Large: text-base (16px) - Primary content, form labels
- Body: text-sm (14px) - Secondary content, descriptions
- Caption: text-xs (12px) - Metadata, timestamps, helper text

**Weights:**
- Bold (700): Headers, primary actions
- Semibold (600): Subheaders, emphasis
- Medium (500): Navigation, tabs
- Regular (400): Body text, form inputs

---

## Layout & Spacing System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16 (as in p-2, h-8, gap-4, m-6, etc.)

**Container Strategy:**
- Dashboard/App Shell: Full-width with sidebar (sidebar w-64 fixed, main area flex-1)
- Content Containers: max-w-7xl mx-auto for main content areas
- Card Grids: gap-6 for desktop, gap-4 for mobile
- Form Groups: space-y-4 for stacked inputs
- Section Padding: py-8 for desktop sections, py-6 for mobile

**Responsive Breakpoints:**
- Mobile: base (< 768px) - Single column, bottom nav
- Tablet: md (768px+) - Two columns where appropriate, sidebar toggleable
- Desktop: lg (1024px+) - Full sidebar, three-column grids, expanded admin charts

---

## Navigation Architecture

**Desktop Navigation:**
- Fixed left sidebar (w-64) with collapsible behavior
- Top app bar with user profile, notifications, search
- Sidebar sections: Notes, Tasks, Games, Messages, Images, Admin (conditional)
- Each item with icon + label, active state highlighting
- Breadcrumb trail in top bar showing current location

**Mobile Navigation:**
- Fixed bottom navigation bar with 5 primary items
- Hamburger menu for secondary features
- Floating action button (FAB) for primary actions (Add Note, Add Task)

---

## Core Component Library

### Authentication Screens
**Layout:** Centered card on gradient background
- Card: max-w-md, rounded-2xl, elevated shadow
- Form inputs: Full-width with floating labels, h-12
- Buttons: Full-width primary actions, h-12
- Links: Inline for "Forgot Password", "Sign Up"
- OTP Input: 6 individual boxes (w-12 h-12 each, gap-3)

### Notes Dashboard
**Layout:** Grid-based card system
- Header: Flex row with search bar, filter dropdown, "Add Note" button
- Notes Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Note Cards: Rounded-xl, p-6, hover elevation
- Card Contents: Title (text-xl font-semibold), content preview (text-sm, line-clamp-3), metadata row (flex justify-between, timestamp + encryption badge)
- Actions: Three-dot menu with Edit/Delete options

### Task Management
**Layout:** Dual-pane for desktop, stacked for mobile
- Left Pane (w-80): Folder list with expandable tree structure
- Right Pane (flex-1): Task kanban board or list view toggle
- Folder Items: Nested structure with indent levels (pl-4 per level), folder icon, count badge
- Task Cards: Compact cards (p-4) with checkbox, title, due date, priority indicator (colored left border)
- Drag handles: Visible on hover, vertical grip icon

### Games Section
**Layout:** Menu grid leading to game boards
- Game Menu: Grid of game cards (grid-cols-2 md:grid-cols-3, gap-8), each with game preview image, title, best score
- Game Board: Centered layout with score header, game grid, controls footer
- Tic-Tac-Toe: 3×3 grid, each cell h-24 w-24, large X/O symbols
- Four-in-Row: 7×6 grid, each cell h-16 w-16, circular tokens with drop animation

### Admin Dashboard
**Layout:** Multi-section dashboard with data visualization
- Dashboard Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for stat cards
- Stat Cards: p-6, icon + number (text-3xl) + label, trend indicator
- Charts Section: Full-width or 2-column layout, cards with h-80 for charts
- User Table: Full-width table with fixed header, alternating row backgrounds
- Permissions Panel: Two-column layout (users list | permission checkboxes)

### Image Editor
**Layout:** Tool palette + canvas + properties panel
- Left Sidebar (w-64): Vertical tool list with icons + labels
- Center Canvas: flex-1, scrollable, image preview on neutral background
- Right Sidebar (w-72): Active tool controls, sliders (with value labels), apply/reset buttons
- Tools: Enhance, Round Corners, Rotate, Sharpen, Generative Background each get dedicated control panels
- Slider Controls: Full-width range inputs with numeric value display, h-10

### Encrypted Messaging
**Layout:** Chat-like interface
- Message Input: Bottom-fixed input bar with text area (h-12) + encrypt/decrypt toggle + send button
- Message List: Scrollable area, messages in speech-bubble style cards
- Encrypted Messages: Distinguished with lock icon badge, monospace font for encrypted text
- Action Buttons: "Encrypt" and "Decrypt" as primary/secondary button pair below input

---

## Form Controls & Inputs

**Text Inputs:**
- Height: h-12 standard, h-10 compact
- Padding: px-4
- Border: rounded-lg, focus ring with 2px offset
- Labels: Floating label animation or top-aligned (mb-2)

**Buttons:**
- Primary: h-12, px-6, rounded-lg, font-medium
- Secondary: h-10, px-4, rounded-md
- Icon Buttons: h-10 w-10, rounded-full for circular, rounded-md for square
- FAB: h-14 w-14, rounded-full, fixed bottom-6 right-6

**Dropdowns/Selects:**
- Height: h-12, matches text input
- Custom styling with chevron icon
- Dropdown menu: rounded-lg, elevated shadow, max-h-60 scrollable

**Checkboxes/Radio:**
- Size: h-5 w-5 for standard forms
- Custom styled with brand accent when checked

---

## Card & Surface Treatments

**Elevation Levels:**
- Level 0: Flush with background (list items)
- Level 1: Subtle shadow (default cards) - shadow-sm
- Level 2: Medium elevation (hover states) - shadow-md
- Level 3: High elevation (modals, dropdowns) - shadow-lg
- Level 4: Floating elements (FAB, tooltips) - shadow-xl

**Corner Radius:**
- Cards: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Inputs: rounded-lg (8px)
- Modals: rounded-2xl (16px)
- Chips/Badges: rounded-full

---

## Data Display Patterns

**Tables:**
- Header: Sticky top, font-semibold, border-b-2
- Rows: h-14, hover background change, border-b
- Cell Padding: px-6 py-4
- Actions Column: Right-aligned, icon buttons

**Lists:**
- List Items: h-12 minimum, py-3 px-4
- Dividers: border-b between items
- Leading Icons: mr-3, size h-6 w-6

**Badges/Chips:**
- Height: h-6, px-3
- Rounded: rounded-full
- Uses: Status indicators, counts, tags

---

## Modal & Overlay Patterns

**Modals:**
- Backdrop: Fixed overlay with opacity-50 background
- Modal Container: Centered, max-w-lg (small), max-w-2xl (medium), max-w-4xl (large)
- Structure: Header (p-6, border-b), Body (p-6), Footer (p-6, border-t, action buttons right-aligned)

**Toasts/Snackbar:**
- Position: Fixed bottom-6 right-6
- Size: min-w-80, max-w-md
- Auto-dismiss: 4-second timer with progress bar

**Tooltips:**
- Small text (text-xs), p-2, rounded-md
- Positioned with 8px offset from trigger

---

## Loading & Empty States

**Loading Indicators:**
- Skeleton Screens: Animated gradient placeholders matching content structure
- Spinner: Centered in container, size h-8 w-8 for inline, h-12 w-12 for full-page
- Progress Bars: h-1, rounded-full, for file uploads and processing

**Empty States:**
- Centered layout with icon (h-24 w-24), heading (text-xl), description (text-sm), call-to-action button
- Used for: No notes yet, No tasks, No game history, etc.

---

## Animation Guidelines

**Micro-interactions:** Use sparingly
- Button Press: Scale down to 98% on active
- Card Hover: Subtle lift (translate-y-1 + shadow increase)
- Page Transitions: Fade-in for new content (200ms)
- Drawer/Sidebar: Slide animation (300ms ease-out)

**Avoid:** Excessive animations on data-heavy screens (admin tables, note lists)

---

## Image Strategy

**Hero Images:** Not applicable for this productivity dashboard application

**In-Application Images:**
- Game Menu Cards: Preview images showing game board state (aspect ratio 16:9, rounded-lg)
- User Avatars: Circular, h-10 w-10 (navigation), h-24 w-24 (profile pages)
- Empty State Illustrations: Centered decorative SVG illustrations (h-48, neutral tones)
- Image Editor Canvas: User-uploaded images displayed on neutral gray background (bg-neutral-100)
- Admin Dashboard: Icon-based stat cards, no large imagery

**Image Placement:**
- Game selection: Grid of cards with game preview images
- Profile section: Circular avatar in top navigation
- Empty states: Centered illustration above text
- Image editor: Main canvas area with tool sidebars

---

## Responsive Behavior

**Mobile Adaptations (< 768px):**
- Hide sidebar, show bottom navigation
- Single-column card grids
- Stacked form layouts
- Collapsible admin chart panels
- Touch-optimized tap targets (minimum h-12)

**Tablet Adaptations (768px - 1024px):**
- Toggleable sidebar with overlay
- Two-column grids
- Condensed admin charts
- Horizontal scrolling for wide tables

**Desktop (1024px+):**
- Full sidebar visible
- Three-column note/task grids
- Expanded admin dashboard with multiple charts visible
- Split-pane layouts for task management

---

This design system ensures consistency across all features while maintaining the flexibility needed for diverse functionality from note-taking to game playing to administrative tasks.