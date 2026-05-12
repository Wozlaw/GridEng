import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { CssBaseline } from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';

import { useUiStore } from '../store';
import { AppNotifications } from '../../shared/ui';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f5f5f5',
    },
    secondary: {
      main: '#b7b7b7',
    },
    success: {
      main: '#79d7a7',
    },
    warning: {
      main: '#e2c06a',
    },
    error: {
      main: '#e47c7c',
    },
    info: {
      main: '#8fb1e8',
    },
    selected: {
      main: '#8fb1e8',
    },
    profile: {
      main: '#d5c181',
    },
    restraint: {
      main: '#d39a72',
    },
    loadForce: {
      main: '#89c7ff',
    },
    loadMoment: {
      main: '#d999ff',
    },
    background: {
      default: '#060606',
      paper: '#101010',
    },
    divider: alpha('#ffffff', 0.12),
    text: {
      primary: '#f2f2f2',
      secondary: '#9c9c9c',
    },
  },
  shape: {
    borderRadius: 0,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: 0.12,
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0.1,
      textTransform: 'none',
    },
    overline: {
      letterSpacing: '0.16em',
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
          backgroundColor: '#060606',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#060606',
          borderBottom: `1px solid ${alpha('#ffffff', 0.12)}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: alpha('#ffffff', 0.12),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
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
          borderColor: alpha('#ffffff', 0.12),
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <AppNotifications />
    </ThemeProvider>
  );
}
