import {
  Box,
  Button,
  Card,
  CardActionArea,
  Container,
  Fab,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile, ProfileStatus } from '../domain/types';
import ProfileCard from '../components/ProfileCard';
import { listProfiles } from '../storage';
import { daysSince } from '../utils/time';

type StatusFilter = 'Все' | ProfileStatus;

type SortOption =
  | 'updatedDesc'
  | 'updatedAsc'
  | 'attractivenessDesc'
  | 'followUpDesc';

type ViewMode = 'list' | 'grid';

type ProfilesListPaneProps = {
  variant?: 'full' | 'pane';
  onProfileOpen?: (id: string) => void;
  onProfilesCountChange?: (count: number) => void;
  shouldAutoSelectFirst?: boolean;
  onAutoSelectFirst?: (id: string) => void;
};

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
  { value: 'followUpDesc', label: 'Сначала давно без контакта' },
  { value: 'attractivenessDesc', label: 'По привлекательности' },
];

const ProfilesListPane = ({
  variant = 'full',
  onProfileOpen,
  onProfilesCountChange,
  shouldAutoSelectFirst = false,
  onAutoSelectFirst,
}: ProfilesListPaneProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Все');
  const [sortOption, setSortOption] = useState<SortOption>('updatedDesc');
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const autoSelectRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await listProfiles();
      if (active) {
        setProfiles(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onProfilesCountChange?.(profiles.length);
  }, [onProfilesCountChange, profiles.length]);

  const totalCount = profiles.length;
  const activeCount = profiles.filter((profile) => profile.status !== 'Закрыто')
    .length;
  const followUpCount = profiles.filter((profile) => {
    if (profile.status === 'Закрыто') {
      return false;
    }
    const days = daysSince(profile.lastInteractionAt ?? profile.updatedAt);
    return days !== null && days >= 7;
  }).length;

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

    const matchesFollowUp = (profile: Profile) => {
      if (!followUpOnly) {
        return true;
      }
      if (profile.status === 'Закрыто') {
        return false;
      }
      const days = daysSince(profile.lastInteractionAt ?? profile.updatedAt);
      return days !== null && days >= 7;
    };

    const sorted = profiles
      .filter(
        (profile) =>
          matchesQuery(profile) &&
          matchesStatus(profile) &&
          matchesFollowUp(profile),
      )
      .slice()
      .sort((a, b) => {
        if (sortOption === 'followUpDesc') {
          const aDays = daysSince(a.lastInteractionAt ?? a.updatedAt) ?? 0;
          const bDays = daysSince(b.lastInteractionAt ?? b.updatedAt) ?? 0;
          if (aDays !== bDays) {
            return bDays - aDays;
          }
          return b.updatedAt.localeCompare(a.updatedAt);
        }
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
  }, [profiles, query, statusFilter, sortOption, followUpOnly]);

  useEffect(() => {
    if (!shouldAutoSelectFirst || loading) {
      return;
    }
    const first = filteredProfiles[0];
    if (!first) {
      return;
    }
    if (autoSelectRef.current === first.id) {
      return;
    }
    autoSelectRef.current = first.id;
    onAutoSelectFirst?.(first.id);
  }, [filteredProfiles, loading, onAutoSelectFirst, shouldAutoSelectFirst]);

  const handleOpenProfile =
    onProfileOpen ?? ((id: string) => navigate(`/p/${id}`));

  const isGrid = isDesktop && viewMode === 'grid';
  const listContent = loading ? (
    <Stack spacing={2}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={`skeleton-${index}`} variant="rounded" height={124} />
      ))}
    </Stack>
  ) : filteredProfiles.length === 0 ? (
    <Stack spacing={2} alignItems="center" textAlign="center" sx={{ py: 6 }}>
      <Typography variant="h3">🗂️</Typography>
      <Typography variant="h6">Пока нет анкет</Typography>
      <Button variant="contained" onClick={() => navigate('/new')}>
        Создать первую
      </Button>
    </Stack>
  ) : isGrid ? (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {filteredProfiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onOpen={handleOpenProfile}
          layout="grid"
          onEventAdded={async () => {
            const data = await listProfiles();
            setProfiles(data);
          }}
        />
      ))}
    </Box>
  ) : (
    <Stack spacing={2}>
      {filteredProfiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onOpen={handleOpenProfile}
          dense={isDesktop}
          onEventAdded={async () => {
            const data = await listProfiles();
            setProfiles(data);
          }}
        />
      ))}
    </Stack>
  );

  const wrapperSx = {
    px: variant === 'full' ? { xs: 2, sm: 3 } : { xs: 2, md: 3 },
    py: 3,
  };

  const body = (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h5">Мои анкеты</Typography>
          <Typography variant="body1" color="text.secondary">
            Соберите карточки и возвращайтесь к ним в любое время.
          </Typography>
        </Box>
        {isDesktop ? (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => {
              if (value) {
                setViewMode(value);
              }
            }}
            size="small"
            aria-label="Режим списка"
          >
            <ToggleButton value="list" aria-label="Список">
              <ViewListRoundedIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Список
              </Typography>
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Сетка">
              <ViewModuleRoundedIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 1 }}>
                Сетка
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardActionArea
          onClick={() => {
            setFollowUpOnly(true);
            setSortOption('followUpDesc');
          }}
          sx={{ p: 2 }}
        >
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Всего
              </Typography>
              <Typography variant="h6">{totalCount}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Активные
              </Typography>
              <Typography variant="h6">{activeCount}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Нужны follow-up
              </Typography>
              <Typography variant="h6" color="primary">
                {followUpCount}
              </Typography>
            </Stack>
          </Stack>
        </CardActionArea>
      </Card>

      <Stack spacing={2}>
        <TextField
          label="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fullWidth
        />
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Нужны follow-up
          </Typography>
          <Switch
            checked={followUpOnly}
            onChange={(event) => setFollowUpOnly(event.target.checked)}
            inputProps={{ 'aria-label': 'Нужны follow-up' }}
          />
        </Stack>
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
    </Stack>
  );

  return (
    <Box sx={{ pb: { xs: 12, md: 2 } }}>
      {variant === 'full' ? (
        <Container maxWidth="sm" sx={wrapperSx}>
          {body}
          {listContent}
        </Container>
      ) : (
        <Box sx={wrapperSx}>
          {body}
          {listContent}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="Добавить"
        variant={isWide ? 'extended' : 'circular'}
        sx={{
          position: 'fixed',
          right: { xs: 24, md: 32 },
          bottom: { xs: 'calc(env(safe-area-inset-bottom) + 88px)', md: 24 },
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

export default ProfilesListPane;
