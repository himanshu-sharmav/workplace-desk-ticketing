import { createTheme } from '@mui/material/styles';

export const colors = {
  primary: '#234cc7',
  ink: '#20283e',
  muted: '#626b7e',
  background: '#f6f8fc',
  surface: '#ffffff',
  border: '#e1e6ef',
  paleBlue: '#edf2ff',
  success: '#237653',
  warning: '#936009',
  danger: '#b52d38',
  rail: '#172842',
  railText: '#f4f7ff',
  railMuted: '#b9c7dd',
  railActive: '#294268',
  railBorder: '#3c506d',
  scrollThumb: '#a5afc1',
  scrollHover: '#76839b',
};

export const theme = createTheme({
  palette: {
    primary: { main: colors.primary },
    text: { primary: colors.ink, secondary: colors.muted },
    background: { default: colors.background, paper: colors.surface },
    divider: colors.border,
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.danger },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 14,
    h1: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h3: { fontSize: '1.125rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': Object.fromEntries(
          Object.entries(colors).map(([name, value]) => [`--${name}`, value]),
        ),
        body: { margin: 0 },
        '*': { scrollbarWidth: 'thin', scrollbarColor: `${colors.scrollThumb} transparent` },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': { background: colors.scrollThumb, borderRadius: 8 },
        '*::-webkit-scrollbar-thumb:hover': { background: colors.scrollHover },
        '*::-webkit-scrollbar-thumb:active': { background: colors.muted },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '@media (forced-colors: active)': { '*': { scrollbarColor: 'auto' } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, borderRadius: 8, paddingInline: 18 } },
    },
    MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
    MuiOutlinedInput: {
      styleOverrides: { root: { backgroundColor: colors.surface, borderRadius: 8 } },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 650,
          minHeight: 62,
          paddingInline: 4,
          marginRight: 28,
        },
      },
    },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
