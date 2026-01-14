import { Box, Container } from '@mui/material';
import AppRouter from './router';

const AppShell = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        py: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <AppRouter />
      </Container>
    </Box>
  );
};

export default AppShell;
