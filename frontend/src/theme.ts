import { createTheme, type PaletteMode } from '@mui/material/styles';

const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode Colors
          primary: {
            main: '#D81B60', // Pink/Red
          },
          secondary: {
            main: '#FBC02D', // Yellow
          },
          info: {
            main: '#2196F3', // Blue
          },
          success: {
            main: '#4CAF50', // Green
          },
          background: {
            default: '#FAFAFA',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#212121',
            secondary: '#757575',
          },
        }
      : {
          // Dark Mode Colors
          primary: {
            main: '#F48FB1', // Lighter Pink
          },
          secondary: {
            main: '#FDD835', // Brighter Yellow
          },
          info: {
            main: '#64B5F6', // Lighter Blue
          },
          success: {
            main: '#81C784', // Lighter Green
          },
          background: {
            default: '#121212',
            paper: '#1E1E1E',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#B0BEC5',
          },
        }),
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          color: mode === 'light' ? '#fff' : '#121212',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: mode === 'light' 
            ? '0px 4px 20px rgba(0,0,0,0.05)' 
            : '0px 4px 20px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          color: mode === 'light' ? '#212121' : '#FFFFFF',
          boxShadow: mode === 'light' 
            ? '0px 2px 10px rgba(0,0,0,0.05)'
            : '0px 2px 10px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#FAFAFA' : '#121212',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: mode === 'light' 
              ? 'rgba(216, 27, 96, 0.1)' 
              : 'rgba(244, 143, 177, 0.15)',
            color: mode === 'light' ? '#D81B60' : '#F48FB1',
            '&:hover': {
              backgroundColor: mode === 'light'
                ? 'rgba(216, 27, 96, 0.15)'
                : 'rgba(244, 143, 177, 0.25)',
            },
            '& .MuiListItemIcon-root': {
              color: mode === 'light' ? '#D81B60' : '#F48FB1',
            },
          },
        },
      },
    },
  },
});

export default getTheme;
