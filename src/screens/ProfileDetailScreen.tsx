import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">Детали анкеты</Typography>
        <Typography variant="body1" color="text.secondary">
          Профиль #{id}
        </Typography>
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
