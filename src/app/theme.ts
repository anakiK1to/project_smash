import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  shape: {
    borderRadius: 24,
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#6A5ACD',
    },
    secondary: {
      main: '#F06292',
    },
    background: {
      default: '#F5F3FF',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
    },
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(17, 12, 46, 0.08)',
    '0px 6px 16px rgba(17, 12, 46, 0.12)',
    '0px 8px 20px rgba(17, 12, 46, 0.14)',
    '0px 12px 24px rgba(17, 12, 46, 0.16)',
    ...Array.from({ length: 20 }, () => '0px 12px 24px rgba(17, 12, 46, 0.16)'),
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 28,
        },
      },
    },
  },
});

export default theme;
