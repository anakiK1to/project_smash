import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { ProfileStatus } from '../domain/types';
import { createProfile } from '../storage';

const statusOptions: ProfileStatus[] = [
  'Новая',
  'Общаемся',
  '1 свидание',
  'Регулярно',
  'Остыли',
  'Закрыто',
];

const ProfileNewScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProfileStatus>(statusOptions[0]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profile = await createProfile({
      name,
      status,
      contacts: {},
    });
    navigate(`/p/${profile.id}`);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <Typography variant="h5">Новая анкета</Typography>
        <TextField
          label="Имя"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />
        <TextField
          label="Статус"
          select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProfileStatus)}
          fullWidth
        >
          {statusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" size="large">
          Создать
        </Button>
        <Button variant="text" onClick={() => navigate(-1)}>
          Отмена
        </Button>
      </Stack>
    </Box>
  );
};

export default ProfileNewScreen;
