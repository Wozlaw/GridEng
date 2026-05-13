import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { CssBaseline } from '@mui/material';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';

import { useUiStore } from '../store';
import { AppNotifications } from '../../shared/ui';
import type { AppThemeMode } from '../store';

function createAppTheme(themeMode: AppThemeMode) {
  const isDark = themeMode === 'dark';
  const surfaceBase = isDark ? '#060606' : '#f2f2f2';
  const surfaceRaised = isDark ? '#101010' : '#fbfbfb';
  const textPrimary = isDark ? '#f2f2f2' : '#151515';
  const textSecondary = isDark ? '#9c9c9c' : '#5c5c5c';
  const divider = alpha(isDark ? '#ffffff' : '#000000', 0.12);
  const selected = isDark ? '#d8d8d8' : '#2a2a2a';

  return createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: textPrimary,
      },
      secondary: {
        main: textSecondary,
      },
      success: {
        main: isDark ? '#c8c8c8' : '#525252',
      },
      warning: {
        main: isDark ? '#b0b0b0' : '#6b6b6b',
      },
      error: {
        main: isDark ? '#e0e0e0' : '#3d3d3d',
      },
      info: {
        main: isDark ? '#d2d2d2' : '#5d5d5d',
      },
      selected: {
        main: selected,
      },
      profile: {
        main: isDark ? '#bcbcbc' : '#666666',
      },
      restraint: {
        main: isDark ? '#adadad' : '#585858',
      },
      loadForce: {
        main: isDark ? '#cfcfcf' : '#707070',
      },
      loadMoment: {
        main: isDark ? '#e4e4e4' : '#808080',
      },
      background: {
        default: surfaceBase,
        paper: surfaceRaised,
      },
      divider,
      text: {
        primary: textPrimary,
        secondary: textSecondary,
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
            colorScheme: themeMode,
          },
          body: {
            backgroundColor: surfaceBase,
            color: textPrimary,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surfaceBase,
            borderBottom: `1px solid ${divider}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderColor: divider,
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
            borderColor: divider,
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
}

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const language = useUiStore((state) => state.language);
  const themeMode = useUiStore((state) => state.themeMode);
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

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
