import { createTheme } from '@mui/material/styles';

export const viewerTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#356b9a', dark: '#244f78', light: '#dceafb' },
    background: { default: '#edf4fb', paper: '#fafdff' },
    text: { primary: '#1e334a', secondary: '#647b92' },
    divider: '#d8e4f1',
    info: { main: '#557a9e' },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  typography: {
    fontFamily: 'system-ui, "Noto Sans JP", sans-serif',
    h1: { fontSize: 'clamp(1.65rem, 3vw, 2.35rem)', lineHeight: 1.35, fontWeight: 700 },
    h2: { fontSize: '1.45rem', lineHeight: 1.45, fontWeight: 650 },
    h3: { fontSize: '1.2rem', lineHeight: 1.45, fontWeight: 650 },
    h4: { fontSize: '1.1rem', lineHeight: 1.45, fontWeight: 650 },
    h5: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 600 },
    h6: { fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 600 },
    body1: { lineHeight: 1.85 },
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: { '&.Mui-focusVisible': { outline: '3px solid #b8d7f8', outlineOffset: 1 } },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': { backgroundColor: '#dceafb' },
          '&.Mui-selected:hover': { backgroundColor: '#d2e4f8' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { backgroundColor: '#e3eef9', color: '#47637f' } } },
  },
});
