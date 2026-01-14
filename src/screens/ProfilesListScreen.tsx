import {
  Box,
  Button,
  Fab,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import type { Profile, ProfileStatus } from '../domain/types';
import { listProfiles } from '../storage';
import ProfileCard from '../components/ProfileCard';

type StatusFilter = 'Все' | ProfileStatus;

type SortOption = 'updatedDesc' | 'updatedAsc' | 'attractivenessDesc';

const statusOptions: StatusFilter[] = [
  'Все',
  'Новая',
  'Общаемся',
  '1 свидание',
  'Регулярно',
  'Остыли',
  'Закрыто',
];

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'updatedDesc', label: 'Недавно обновлялись' },
  { value: 'updatedAsc', label: 'Давно обновлялись' },
  { value: 'attractivenessDesc', label: 'По привлекательности' },
];

const ProfilesListScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('sm'));
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Все');
  const [sortOption, setSortOption] = useState<SortOption>('updatedDesc');

  useEffect(() => {
    let active = true;
    const loadProfiles = async () => {
      const data = await listProfiles();
      if (active) {
        setProfiles(data);
        setLoading(false);
      }
    };
    loadProfiles();
    return () => {
      active = false;
    };
  }, []);

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matchesQuery = (profile: Profile) => {
      if (!normalizedQuery) {
        return true;
      }
      const searchText = [
        profile.name,
        profile.contacts.telegram,
        profile.contacts.instagram,
        profile.notes,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();
      return searchText.includes(normalizedQuery);
    };

    const matchesStatus = (profile: Profile) =>
      statusFilter === 'Все' ? true : profile.status === statusFilter;

    const sorted = profiles
      .filter((profile) => matchesQuery(profile) && matchesStatus(profile))
      .slice()
      .sort((a, b) => {
        if (sortOption === 'updatedDesc') {
          return b.updatedAt.localeCompare(a.updatedAt);
        }
        if (sortOption === 'updatedAsc') {
          return a.updatedAt.localeCompare(b.updatedAt);
        }
        const aValue = a.attractiveness ?? -1;
        const bValue = b.attractiveness ?? -1;
        if (aValue !== bValue) {
          return bValue - aValue;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });

    return sorted;
  }, [profiles, query, statusFilter, sortOption]);

  return (
    <Box sx={{ pb: 12 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h5">Мои анкеты</Typography>
        <Typography variant="body1" color="text.secondary">
          Соберите карточки и возвращайтесь к ним в любое время.
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fullWidth
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="status-filter-label">Статус</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Статус"
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="sort-option-label">Сортировка</InputLabel>
            <Select
              labelId="sort-option-label"
              value={sortOption}
              label="Сортировка"
              onChange={(event) =>
                setSortOption(event.target.value as SortOption)
              }
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {loading ? (
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={`skeleton-${index}`}
              variant="rounded"
              height={124}
            />
          ))}
        </Stack>
      ) : filteredProfiles.length === 0 ? (
        <Stack
          spacing={2}
          alignItems="center"
          textAlign="center"
          sx={{ py: 6 }}
        >
          <Typography variant="h3">🗂️</Typography>
          <Typography variant="h6">Пока нет анкет</Typography>
          <Button variant="contained" onClick={() => navigate('/new')}>
            Создать первую
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onOpen={(id) => navigate(`/p/${id}`)}
            />
          ))}
        </Stack>
      )}

      <Fab
        color="primary"
        aria-label="Добавить"
        variant={isWide ? 'extended' : 'circular'}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          boxShadow: 4,
        }}
        onClick={() => navigate('/new')}
      >
        <AddIcon sx={{ mr: isWide ? 1 : 0 }} />
        {isWide ? 'Добавить' : null}
      </Fab>
    </Box>
  );
};

export default ProfilesListScreen;
