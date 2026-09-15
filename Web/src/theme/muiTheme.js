import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode = 'dark') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#00E5FF' : '#007799',
        light: isDark ? '#6effff' : '#3399b3',
        dark: isDark ? '#00b2cc' : '#00556b',
        contrastText: isDark ? '#000000' : '#ffffff'
      },
      secondary: {
        main: '#0288D1',
        light: '#5eb8ff',
        dark: '#005b9f',
        contrastText: '#ffffff'
      },
      error: {
        main: isDark ? '#D32F2F' : '#C62828',
        light: '#ef5350',
        dark: '#b71c1c',
        contrastText: '#ffffff'
      },
      warning: {
        main: isDark ? '#ED6C02' : '#D97706',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff'
      },
      info: {
        main: '#0288D1',
        light: '#29b6f6',
        dark: '#01579b',
        contrastText: '#ffffff'
      },
      success: {
        main: isDark ? '#00E676' : '#16A34A',
        light: '#69f0ae',
        dark: '#00c853',
        contrastText: isDark ? '#000000' : '#ffffff'
      },
      background: {
        default: isDark ? '#0a0e15' : '#f8fafc',
        paper: isDark ? '#111622' : '#ffffff'
      },
      text: {
        primary: isDark ? '#dfe2ed' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569'
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
    },
    typography: {
      fontFamily: '"Space Grotesk", "JetBrains Mono", system-ui, -apple-system, sans-serif',
      button: {
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.05em'
      }
    },
    shape: {
      borderRadius: 4
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease-in-out'
          },
          containedPrimary: {
            boxShadow: isDark ? '0 0 10px rgba(0, 229, 255, 0.3)' : '0 2px 8px rgba(0, 119, 153, 0.25)'
          },
          containedError: {
            boxShadow: '0 0 12px rgba(211, 47, 47, 0.4)'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            fontWeight: 600,
            fontFamily: '"JetBrains Mono", monospace'
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: isDark ? '#00E5FF' : '#007799'
          },
          thumb: {
            borderRadius: 2,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: isDark ? '0 0 0 8px rgba(0, 229, 255, 0.16)' : '0 0 0 8px rgba(0, 119, 153, 0.16)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      }
    }
  });
};
