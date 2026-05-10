import type { ReactNode } from 'react';

import { CssBaseline } from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2ac7a8',
    },
    secondary: {
      main: '#f4bf61',
    },
    background: {
      default: '#081019',
      paper: 'rgba(12, 18, 26, 0.86)',
    },
    divider: alpha('#b6c7d8', 0.16),
    text: {
      primary: '#eef5fb',
      secondary: '#95a5b6',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0.15,
      textTransform: 'none',
    },
    overline: {
      letterSpacing: '0.18em',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'dark',
        },
        body: {
          backgroundImage: `
            radial-gradient(circle at top left, rgba(42, 199, 168, 0.16), transparent 32%),
            radial-gradient(circle at top right, rgba(244, 191, 97, 0.12), transparent 24%),
            linear-gradient(180deg, #09131d 0%, #070d14 100%)
          `,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${alpha('#b6c7d8', 0.12)}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: alpha('#b6c7d8', 0.16),
          backdropFilter: 'blur(14px)',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: alpha('#dfe8f0', 0.16),
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
