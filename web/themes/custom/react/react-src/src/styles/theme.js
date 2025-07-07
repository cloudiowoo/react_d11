import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#F15D22',
      light: '#ff7b4d',
      dark: '#d14d1f',
      contrastText: '#fff',
    },
    secondary: {
      main: '#333333',
      light: '#4d4d4d',
      dark: '#1a1a1a',
      contrastText: '#fff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #eee',
        },
      },
    },
  },
});

export default theme;
