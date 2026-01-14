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

const mockProfiles = [
  {
    id: '1',
    name: 'Аня Л.',
    status: 'Ищу серьёзные отношения',
  },
  {
    id: '2',
    name: 'Дима К.',
    status: 'Открыт для общения',
  },
  {
    id: '3',
    name: 'Марина П.',
    status: 'Свайп без спешки',
  },
];

const ProfilesListScreen = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ pb: 10 }}>
      <Stack spacing={2.5} sx={{ mb: 3 }}>
        <Typography variant="h5">Мои анкеты</Typography>
        <Typography variant="body1" color="text.secondary">
          Соберите карточки и возвращайтесь к ним в любое время.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {mockProfiles.map((profile) => (
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
