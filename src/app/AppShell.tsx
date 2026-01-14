import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentValue = location.pathname.startsWith('/settings')
    ? '/settings'
    : '/';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        pb: 'calc(env(safe-area-inset-bottom) + 96px)',
      }}
    >
      <Outlet />
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          pb: 'env(safe-area-inset-bottom)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: 'hidden',
        }}
      >
        <BottomNavigation
          showLabels
          value={currentValue}
          onChange={(_, value) => navigate(value)}
        >
          <BottomNavigationAction
            label="Анкеты"
            value="/"
            icon={<HomeRoundedIcon />}
          />
          <BottomNavigationAction
            label="Настройки"
            value="/settings"
            icon={<SettingsRoundedIcon />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default AppShell;
