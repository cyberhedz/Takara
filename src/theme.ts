import { createTheme } from '@mui/material/styles'

// Palette mirrors the Figma "Color" variable collection:
// primary   -> accent/persimmon (#c1502e) — the app's dominant CTA / accent color
// secondary -> brand/indigo   (#2b3a55) — used sparingly (scan FAB, etc.)
export const takaraTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#c1502e' },
    secondary: { main: '#2b3a55' },
    background: { default: '#f6f2e9', paper: '#ffffff' },
    text: { primary: '#211f1b', secondary: '#6b6459' },
    divider: '#e4dccb',
  },
  shape: { borderRadius: 14 },
  typography: {
    // Figma's Body/Label/Caption styles all use Inter; Display/Heading use Shippori Mincho.
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Shippori Mincho', serif" },
    h2: { fontFamily: "'Shippori Mincho', serif" },
    h3: { fontFamily: "'Shippori Mincho', serif" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, borderRadius: 14 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
})
