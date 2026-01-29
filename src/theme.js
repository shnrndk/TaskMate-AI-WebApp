
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    // Accent color remains #E94560 for consistency, maybe slightly adjusted for light mode if needed
    primary: {
      main: '#E94560',
      contrastText: '#fff',
    },
    secondary: {
      main: '#0F3460',
    },
    ...(mode === 'light'
      ? {
        // Light Mode Palette
        background: {
          default: '#F4F6F8',
          paper: 'rgba(255, 255, 255, 0.7)',
        },
        text: {
          primary: '#1A1A2E',
          secondary: 'rgba(0, 0, 0, 0.6)',
        },
      }
      : {
        // Dark Mode Palette
        background: {
          default: '#121212',
          paper: 'rgba(30, 30, 30, 0.6)',
        },
        text: {
          primary: '#EDEDED',
          secondary: 'rgba(255, 255, 255, 0.6)',
        },
      }),
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 500 },
    h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 500 },
    button: { fontFamily: "'Outfit', sans-serif", textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: mode, // Critical for native date/time pickers
        },
        body: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #F5F7FA 0%, #C3CFE2 100%)' // Generic light gradient
            : 'linear-gradient(180deg, #121212 0%, #1A1A2E 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        // Fix for native time/date picker icons
        'input[type="time"]::-webkit-calendar-picker-indicator, input[type="date"]::-webkit-calendar-picker-indicator': {
          filter: mode === 'dark' ? 'invert(1)' : 'none',
          cursor: 'pointer',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          backgroundColor: mode === 'light'
            ? 'rgba(255, 255, 255, 0.75)'
            : 'rgba(30, 30, 30, 0.4)',
          border: mode === 'light'
            ? '1px solid rgba(0, 0, 0, 0.05)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: mode === 'light'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' // Gentle shadow for light mode
            : 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: 'rgba(233, 69, 96, 0.1)',
          },
        },
        contained: {
          backgroundColor: '#E94560',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#C81D3D',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
          color: mode === 'light' ? '#E94560' : '#fff', // Use accent color for outlined text in light mode
          '&:hover': {
            borderColor: '#E94560',
            backgroundColor: 'rgba(233,69,96,0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: mode === 'light'
              ? 'rgba(255, 255, 255, 0.5)'
              : 'rgba(255, 255, 255, 0.03)',
            '& fieldset': {
              borderColor: mode === 'light'
                ? 'rgba(0, 0, 0, 0.12)'
                : 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: mode === 'light'
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E94560',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 255, 255, 0.85) !important'
            : 'rgba(18, 18, 18, 0.8) !important',
          backdropFilter: 'blur(20px)',
          borderBottom: mode === 'light'
            ? '1px solid rgba(0, 0, 0, 0.05)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
          color: mode === 'light' ? '#1A1A2E' : '#fff', // Explicitly set text color
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: mode === 'light'
            ? '1px solid rgba(0,0,0,0.08)'
            : '1px solid rgba(255,255,255,0.1)',
          backgroundColor: 'transparent',
          color: mode === 'light' ? '#1A1A2E' : '#fff',
        },
        filled: {
          backgroundColor: mode === 'light'
            ? 'rgba(0, 0, 0, 0.05)'
            : 'rgba(255, 255, 255, 0.05)',
        }
      }
    },
    // Customize Select/Menu item hover
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(233, 69, 96, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(233, 69, 96, 0.16)',
            '&:hover': {
              backgroundColor: 'rgba(233, 69, 96, 0.24)',
            }
          }
        }
      }
    }
  },
});

export default getDesignTokens;
