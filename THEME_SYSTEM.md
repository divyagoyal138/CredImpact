# CampusLink Theme System

## Overview
The application now supports both Light and Dark themes with seamless switching and persistent storage.

## Implementation Details

### Components Created

#### 1. Theme Context (`lib/theme-context.tsx`)
- Provides global theme state management using React Context
- Persists theme preference to localStorage (`campuslink_theme`)
- Respects system preference on first load
- Exposes `useTheme()` hook for component consumption
- Applies `.dark` class to `<html>` element for CSS-based theme switching

#### 2. Settings Page (`app/dashboard/settings/page.tsx`)
- Protected route requiring user authentication
- Located at `/dashboard/settings`
- Features:
  - Visual theme toggle with sun/moon icons
  - Light and Dark mode options with descriptions
  - Current theme indicator
  - Account preferences (Email Notifications, Privacy Settings)
  - Logout button
- Accessible from sidebar navigation

#### 3. Updated Layout (`app/layout.tsx`)
- Wraps entire app with `ThemeProvider`
- Enables theme context for all child components

#### 4. Color Palettes (`app/globals.css`)

**Light Mode** (Default):
- Background: Soft beige (#f5f3f0)
- Foreground: Dark charcoal (#2a2520)
- Primary: Navy (#1a1f3a)
- Accent: Muted gold (#c9a961)
- Destructive: Coral red (#d74545)

**Dark Mode**:
- Background: Very dark (#0f1117)
- Foreground: Light gray (#e6edf3)
- Primary: Light/white (#e6edf3)
- Accent: Warmer gold (#d4a574)
- Destructive: Light red (#f85149)

### How It Works

1. **On App Load**:
   - `ThemeProvider` checks localStorage for `campuslink_theme`
   - Falls back to system preference or 'light'
   - Applies theme by adding/removing `.dark` class on HTML element

2. **Theme Switching**:
   - User clicks theme button in Settings page
   - `setTheme()` updates both state and localStorage
   - CSS transitions smoothly between color variables

3. **Persistence**:
   - Theme preference saved to localStorage
   - Persists across page reloads and browser sessions
   - Works across all pages in the application

4. **Smooth Transitions**:
   - All elements have `transition-colors duration-300` applied
   - Colors fade smoothly when switching themes
   - 300ms transition duration for comfortable user experience

## Usage

### For Users
1. Navigate to `/dashboard/settings` (requires login)
2. Click on "Light" or "Dark" theme option
3. Theme applies instantly and persists automatically

### For Developers
```tsx
import { useTheme } from '@/lib/theme-context'

export function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme()
  
  return (
    <button onClick={toggleTheme}>
      Switch to {theme === 'light' ? 'dark' : 'light'} mode
    </button>
  )
}
```

## Color System

All colors are defined as CSS variables at `:root` and `.dark`:
- `--background`: Page background
- `--foreground`: Primary text color
- `--card`: Card/container backgrounds
- `--primary`: Main action color (buttons)
- `--accent`: Highlight/accent color (gold in both themes)
- `--destructive`: Error/delete action color
- `--border`: Border color
- `--input`: Input field background
- `--muted`: Muted/secondary text color
- `--sidebar`: Sidebar background
- `--sidebar-foreground`: Sidebar text color
- `--sidebar-primary`: Sidebar accent/active color

## Theme Testing

### Light Mode
- Background: Soft beige with white cards
- Emphasis: Navy blue primary, gold accents
- Text: Dark charcoal for contrast
- Use case: Default, daytime usage

### Dark Mode
- Background: Very dark with slightly lighter cards
- Emphasis: Light text on dark background
- Text: Light gray for readability
- Use case: Low-light/nighttime usage

## Browser Support
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- CSS variables fully supported
- localStorage available on all modern browsers
- Gracefully degrades if localStorage unavailable

## Future Enhancements
- Add scheduled/auto dark mode based on time
- Add more theme options (high contrast, etc.)
- Add theme preview before applying
- Add custom theme builder
