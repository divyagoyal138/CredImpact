# CredImpact Theme System

## Overview
CredImpact supports **Light**, **Midnight Obsidian (Dark)**, **Warm Espresso (Dark Academia)**, and **System Auto** themes with instant switching, live color swatches, and persistent storage.

## Implementation Details

### Components Created & Updated

#### 1. Theme Context (`lib/theme-context.tsx`)
- Provides global theme state management using React Context (`useTheme()`)
- Persists theme preference to localStorage (`credimpact_theme`)
- Supports options: `'light' | 'dark' | 'dark-warm' | 'system'`
- Automatically detects and syncs OS theme changes when set to `'system'`
- Dynamically manages `.dark` and `.dark-warm` classes on `<html>`

#### 2. Settings Page (`app/dashboard/settings/page.tsx`)
- Integrated into the unified `DashboardLayout`
- Located at `/dashboard/settings` and accessible via the sidebar
- Features:
  - Interactive theme selector cards with live color swatches
  - Option 1: **Midnight Obsidian** (Deep dark slate `#0A0E17` + glowing gold accents `#F59E0B`)
  - Option 2: **Warm Espresso** (Dark Academia charcoal `#161412` + antique gold `#E5B869`)
  - Option 3: **Classic Ivory** (Soft beige `#EDE8DC` + deep chestnut `#8B2C1F`)
  - Option 4: **System Auto** (Matches device operating system preference)
  - Current active theme label and status indicator
  - Account preferences (Email Notifications toggle, Public Profile toggle)
  - Sign out session button

#### 3. Updated Sidebar (`components/Sidebar.jsx`)
- Adds **Settings** link with `ti-settings` icon under the Profile section.

#### 4. Color Palettes (`app/globals.css`)

**Midnight Obsidian (Default Dark Mode)**:
- Background: `#0A0E17` (Deep Obsidian Slate)
- Foreground: `#F1F5F9` (Crisp Slate White)
- Card: `#141C2B` (Slate Glass Card)
- Primary: `#F59E0B` (Glowing Amber Gold)
- Accent: `#10B981` (Emerald Green)
- Border: `#233044` (Precision Slate Border)

**Warm Espresso (Dark Academia)**:
- Background: `#161412` (Espresso Charcoal)
- Foreground: `#F4EFEA` (Warm Cream Text)
- Card: `#231F1C` (Mahogany Slate Card)
- Primary: `#E5B869` (Antique Gold)
- Border: `#36302B`

**Classic Ivory (Light Mode)**:
- Background: `#EDE8DC` (Antique Ivory)
- Foreground: `#2C2E30` (Charcoal Slate)
- Card: `#FAF7F2`
- Primary: `#8B2C1F` (Deep Chestnut)

## Usage

### For Users
1. Navigate to **Settings** from the sidebar or go to `/dashboard/settings`.
2. Click any theme card to preview and apply it instantly.
3. Your selection persists across reloads and browser sessions.

### For Developers
```tsx
import { useTheme } from '@/lib/theme-context'

export function MyComponent() {
  const { theme, effectiveTheme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Midnight Obsidian
    </button>
  )
}
```
