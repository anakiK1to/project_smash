import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Profile } from '../domain/types';
import { getProfile } from '../storage';

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!id) {
        if (active) {
          setProfile(null);
          setLoaded(true);
        }
        return;
      }
      const data = await getProfile(id);
      if (active) {
        setProfile(data ?? null);
        setLoaded(true);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">Детали анкеты</Typography>
        {loaded && !profile ? (
          <Typography variant="body1" color="text.secondary">
            Не найдено
          </Typography>
        ) : null}
        {profile ? (
          <Stack spacing={1}>
            <Typography variant="h6">{profile.name}</Typography>
            <Typography variant="body1" color="text.secondary">
              {profile.status}
            </Typography>
            {profile.contacts.telegram ? (
              <Typography variant="body2">
                Telegram: {profile.contacts.telegram}
              </Typography>
            ) : null}
            {profile.contacts.instagram ? (
              <Typography variant="body2">
                Instagram: {profile.contacts.instagram}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Назад
        </Button>
      </Stack>
    </Box>
  );
};

export default ProfileDetailScreen;
