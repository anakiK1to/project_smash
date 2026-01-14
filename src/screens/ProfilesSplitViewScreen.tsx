import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useState } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import ProfilesListPane from './ProfilesListPane';

const ProfilesSplitViewScreen = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const detailMatch = useMatch('/p/:id');
  const [profilesCount, setProfilesCount] = useState<number | null>(null);

  const shouldAutoSelectFirst = isDesktop && location.pathname === '/';
  const showListPane = !detailMatch || isDesktop;
  const showDetailPane = Boolean(detailMatch) || isDesktop;

  const handleAutoSelect = useCallback(
    (id: string) => {
      if (!shouldAutoSelectFirst) {
        return;
      }
      navigate(`/p/${id}`, { replace: true });
    },
    [navigate, shouldAutoSelectFirst],
  );

  return (
    <Box
      sx={{
        display: { xs: 'block', md: 'flex' },
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {showListPane ? (
        <Box
          sx={{
            width: { md: 380, lg: 420 },
            minWidth: { md: 360 },
            maxWidth: { md: 420 },
            flexShrink: 0,
            borderRight: { md: '1px solid' },
            borderColor: { md: 'divider' },
            bgcolor: 'background.default',
          }}
        >
          <ProfilesListPane
            variant={isDesktop ? 'pane' : 'full'}
            shouldAutoSelectFirst={shouldAutoSelectFirst}
            onAutoSelectFirst={handleAutoSelect}
            onProfilesCountChange={(count) => setProfilesCount(count)}
          />
        </Box>
      ) : null}

      {showDetailPane ? (
        <Box
          sx={{
            flex: 1,
            bgcolor: 'background.default',
            px: { md: 3, lg: 4 },
            py: { md: 3, lg: 4 },
          }}
        >
          {detailMatch ? (
            <Outlet />
          ) : (
            <Box sx={{ maxWidth: 920, mx: 'auto' }}>
              <Stack
                spacing={2}
                alignItems="center"
                justifyContent="center"
                sx={{ height: '100%', py: 6 }}
              >
                <Typography variant="h4">📌</Typography>
                {profilesCount === 0 ? (
                  <>
                    <Typography variant="h6">Пока нет анкет</Typography>
                    <Typography color="text.secondary">
                      Создайте первую анкету, чтобы увидеть детали.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6">Выберите анкету</Typography>
                    <Typography color="text.secondary">
                      Детали выбранного профиля появятся здесь.
                    </Typography>
                  </>
                )}
              </Stack>
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
};

export default ProfilesSplitViewScreen;
