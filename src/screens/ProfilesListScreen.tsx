import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Fab,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Profile } from '../domain/types';
import { listProfiles } from '../storage';

const ProfilesListScreen = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let active = true;
    const loadProfiles = async () => {
      const data = await listProfiles();
      if (active) {
        setProfiles(data);
      }
    };
    loadProfiles();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ pb: 10 }}>
      <Stack spacing={2.5} sx={{ mb: 3 }}>
        <Typography variant="h5">Мои анкеты</Typography>
        <Typography variant="body1" color="text.secondary">
          Соберите карточки и возвращайтесь к ним в любое время.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {profiles.map((profile) => (
          <Card key={profile.id} elevation={2}>
            <CardActionArea onClick={() => navigate(`/p/${profile.id}`)}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6">{profile.name}</Typography>
                  <Chip
                    label={profile.status}
                    color="secondary"
                    variant="outlined"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>

      <Fab
        color="primary"
        aria-label="Добавить"
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          boxShadow: 4,
        }}
        onClick={() => navigate('/new')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default ProfilesListScreen;
