import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  useMediaQuery,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const railWidth = 96;
  const currentValue = location.pathname.startsWith('/settings')
    ? '/settings'
    : '/';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
      }}
    >
      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: railWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: railWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              alignItems: 'center',
              pt: 3,
            },
          }}
        >
          <List sx={{ width: '100%' }}>
            <ListItemButton
              selected={currentValue === '/'}
              onClick={() => navigate('/')}
              sx={{
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <HomeRoundedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Анкеты"
                primaryTypographyProps={{ variant: 'caption', textAlign: 'center' }}
              />
            </ListItemButton>
            <ListItemButton
              selected={currentValue === '/settings'}
              onClick={() => navigate('/settings')}
              sx={{
                flexDirection: 'column',
                gap: 0.5,
                py: 1.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <SettingsRoundedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Настройки"
                primaryTypographyProps={{ variant: 'caption', textAlign: 'center' }}
              />
            </ListItemButton>
          </List>
        </Drawer>
      ) : null}
      <Box
        component="main"
        sx={{
          flex: 1,
          pb: isDesktop ? 0 : 'calc(env(safe-area-inset-bottom) + 96px)',
        }}
      >
        <Outlet />
      </Box>
      {!isDesktop ? (
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
      ) : null}
    </Box>
  );
};

export default AppShell;
