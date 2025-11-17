import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { RuleBuilder } from './components/RuleBuilder/RuleBuilder'
import './App.css'
import { EnhancedRuleBuilder } from './components/RuleBuilder/EnhancedRuleBuilder';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<EnhancedRuleBuilder />} />
          </Routes>
        </BrowserRouter>
      </Box>
    </ThemeProvider>
  )
}

export default App
