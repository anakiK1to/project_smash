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

const statusOptions = [
  'Ищу серьёзные отношения',
  'Открыт для общения',
  'Свайп без спешки',
];

const ProfileNewScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [status, setStatus] = useState(statusOptions[0]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(-1);
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
          onChange={(event) => setStatus(event.target.value)}
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
