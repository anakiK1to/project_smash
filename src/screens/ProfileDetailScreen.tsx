import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Rating,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CallIcon from '@mui/icons-material/Call';
import EventIcon from '@mui/icons-material/Event';
import StarIcon from '@mui/icons-material/Star';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  Profile,
  ProfileStatus,
  TimelineEvent,
  TimelineEventType,
} from '../domain/types';
import {
  addEvent,
  addPhoto,
  deleteEvent,
  deleteProfile,
  getPhoto,
  getProfile,
  listEvents,
  removePhoto,
  updateProfile,
} from '../storage';
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../utils/date';

const statusTones: Record<ProfileStatus, { bg: string; fg: string }> = {
  Новая: { bg: '#E3F2FD', fg: '#0D47A1' },
  Общаемся: { bg: '#E8F5E9', fg: '#1B5E20' },
  '1 свидание': { bg: '#FFF3E0', fg: '#E65100' },
  Регулярно: { bg: '#F3E5F5', fg: '#4A148C' },
  Остыли: { bg: '#ECEFF1', fg: '#37474F' },
  Закрыто: { bg: '#FFEBEE', fg: '#B71C1C' },
};

const eventTypeIcons: Record<TimelineEventType, JSX.Element> = {
  message: <ChatBubbleOutlineIcon fontSize="small" />,
  call: <CallIcon fontSize="small" />,
  date: <EventIcon fontSize="small" />,
  important: <StarIcon fontSize="small" />,
};

const eventTypeLabels: Record<TimelineEventType, string> = {
  message: 'Сообщение',
  call: 'Звонок',
  date: 'Свидание',
  important: 'Важно',
};

const profileStatuses: ProfileStatus[] = [
  'Новая',
  'Общаемся',
  '1 свидание',
  'Регулярно',
  'Остыли',
  'Закрыто',
];

const TabPanel = ({
  value,
  index,
  children,
}: {
  value: number;
  index: number;
  children: ReactNode;
}) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    sx={{ pt: 2 }}
  >
    {value === index ? children : null}
  </Box>
);

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [tab, setTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [eventDeleteId, setEventDeleteId] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Array<{ id: string; url: string }>>(
    [],
  );
  const [notesDraft, setNotesDraft] = useState('');
  const [telegramDraft, setTelegramDraft] = useState('');
  const [instagramDraft, setInstagramDraft] = useState('');
  const [attractivenessDraft, setAttractivenessDraft] = useState<number | null>(
    null,
  );
  const [vibeDraft, setVibeDraft] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<ProfileStatus>('Новая');
  const [editTelegram, setEditTelegram] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [eventType, setEventType] = useState<TimelineEventType>('message');
  const [eventAt, setEventAt] = useState('');
  const [eventMood, setEventMood] = useState('');
  const [eventText, setEventText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skipNotesSaveRef = useRef(true);

  const openMenu = Boolean(menuAnchor);

  const loadProfile = useCallback(async () => {
    if (!id) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    try {
      const data = await getProfile(id);
      setProfile(data ?? null);
      setLoaded(true);
      if (data) {
        setNotesDraft(data.notes ?? '');
        setTelegramDraft(data.contacts.telegram ?? '');
        setInstagramDraft(data.contacts.instagram ?? '');
        setAttractivenessDraft(data.attractiveness ?? null);
        setVibeDraft(data.vibe ?? null);
        skipNotesSaveRef.current = true;
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось загрузить анкету');
      setLoaded(true);
    }
  }, [id]);

  const loadEvents = useCallback(async () => {
    if (!id) {
      setEvents([]);
      return;
    }
    try {
      const data = await listEvents(id);
      setEvents(data);
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось загрузить события');
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
    loadEvents();
  }, [loadProfile, loadEvents]);

  useEffect(() => {
    if (!profile?.photoIds.length) {
      setPhotoUrls([]);
      return;
    }
    let active = true;
    const urls: string[] = [];

    const loadPhotos = async () => {
      const photos = await Promise.all(
        profile.photoIds.map(async (photoId) => {
          const photo = await getPhoto(photoId);
          if (!photo) {
            return null;
          }
          const url = URL.createObjectURL(photo.blob);
          urls.push(url);
          return { id: photoId, url };
        }),
      );
      if (!active) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      setPhotoUrls(photos.filter(Boolean) as Array<{ id: string; url: string }>);
    };

    loadPhotos();

    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [profile?.photoIds]);

  useEffect(() => {
    const profileId = profile?.id;
    if (!profileId) {
      return;
    }
    if (skipNotesSaveRef.current) {
      skipNotesSaveRef.current = false;
      return;
    }
    const handler = window.setTimeout(async () => {
      try {
        const updated = await updateProfile(profileId, {
          notes: notesDraft.trim() ? notesDraft : undefined,
          contacts: {
            telegram: telegramDraft.trim() || undefined,
            instagram: instagramDraft.trim() || undefined,
          },
          attractiveness: attractivenessDraft ?? undefined,
          vibe: vibeDraft ?? undefined,
        });
        setProfile(updated);
      } catch (error) {
        console.error(error);
        setSnackbarMessage('Не удалось сохранить изменения');
      }
    }, 600);

    return () => window.clearTimeout(handler);
  }, [
    profile?.id,
    notesDraft,
    telegramDraft,
    instagramDraft,
    attractivenessDraft,
    vibeDraft,
  ]);

  const statusTone = profile ? statusTones[profile.status] : null;

  const ratingLabel = useMemo(() => {
    if (!profile) {
      return '';
    }
    const peachCount = Math.max(0, Math.round(profile.attractiveness ?? 0));
    const vibeCount = Math.max(0, Math.round(profile.vibe ?? 0));
    const peachLabel = peachCount ? '🍑'.repeat(peachCount) : '';
    const vibeLabel = vibeCount ? '✨'.repeat(vibeCount) : '';
    return [peachLabel, vibeLabel].filter(Boolean).join(' ');
  }, [profile]);

  const handleAddPhotos = async (files: FileList | null) => {
    if (!profile || !files || files.length === 0) {
      return;
    }
    try {
      await Promise.all(
        Array.from(files).map((file) => addPhoto(profile.id, file)),
      );
      await loadProfile();
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось добавить фото');
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile) {
      return;
    }
    try {
      await deleteProfile(profile.id);
      navigate('/');
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось удалить анкету');
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventDeleteId) {
      return;
    }
    try {
      await deleteEvent(eventDeleteId);
      await loadEvents();
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось удалить событие');
    } finally {
      setEventDeleteId(null);
    }
  };

  const handleAddEventSubmit = async () => {
    if (!profile) {
      return;
    }
    try {
      await addEvent(profile.id, {
        type: eventType,
        at: fromDatetimeLocalValue(eventAt),
        mood: eventMood.trim() || undefined,
        text: eventText.trim() || undefined,
      });
      await loadEvents();
      await loadProfile();
      setEventDialogOpen(false);
      setEventMood('');
      setEventText('');
      setEventType('message');
      setEventAt('');
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось добавить событие');
    }
  };

  const handleOpenEdit = () => {
    if (!profile) {
      return;
    }
    setEditName(profile.name);
    setEditStatus(profile.status);
    setEditTelegram(profile.contacts.telegram ?? '');
    setEditInstagram(profile.contacts.instagram ?? '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!profile) {
      return;
    }
    try {
      const updated = await updateProfile(profile.id, {
        name: editName.trim() || profile.name,
        status: editStatus,
        contacts: {
          telegram: editTelegram.trim() || undefined,
          instagram: editInstagram.trim() || undefined,
        },
      });
      setProfile(updated);
      setEditDialogOpen(false);
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось сохранить изменения');
    }
  };

  const handleMakeMainPhoto = async (photoId: string) => {
    if (!profile) {
      return;
    }
    const updatedIds = [
      photoId,
      ...profile.photoIds.filter((idValue) => idValue !== photoId),
    ];
    try {
      const updated = await updateProfile(profile.id, {
        photoIds: updatedIds,
      });
      setProfile(updated);
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось обновить главное фото');
    }
  };

  const heroPhotoUrl = photoUrls[0]?.url;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ backdropFilter: 'blur(12px)', bgcolor: 'rgba(255,255,255,0.9)' }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          <IconButton onClick={() => navigate(-1)} edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
            {profile?.name ?? 'Анкета'}
          </Typography>
          <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={openMenu}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setConfirmDeleteOpen(true);
              }}
            >
              Удалить анкету
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        {!loaded ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={160} />
          </Stack>
        ) : null}

        {loaded && !profile ? (
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6">Не найдено</Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              Назад
            </Button>
          </Stack>
        ) : null}

        {profile ? (
          <Stack spacing={3}>
            <Box
              sx={{
                borderRadius: 7,
                overflow: 'hidden',
                boxShadow: '0px 18px 40px rgba(15, 23, 42, 0.14)',
                position: 'relative',
                bgcolor: 'grey.100',
              }}
            >
              <Box
                sx={{
                  aspectRatio: '16 / 9',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: heroPhotoUrl
                    ? 'transparent'
                    : 'rgba(248,250,252,1)',
                  background: heroPhotoUrl
                    ? 'transparent'
                    : 'linear-gradient(135deg, rgba(224,231,255,0.9), rgba(254,215,170,0.9))',
                }}
              >
                {heroPhotoUrl ? (
                  <Box
                    component="img"
                    src={heroPhotoUrl}
                    alt={profile.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Stack alignItems="center" spacing={1}>
                    <InsertPhotoOutlinedIcon fontSize="large" />
                    <Typography color="text.secondary">
                      Нет основного фото
                    </Typography>
                  </Stack>
                )}
              </Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.75,
                  boxShadow: '0px 6px 20px rgba(15, 23, 42, 0.12)',
                }}
              >
                {statusTone ? (
                  <Chip
                    label={profile.status}
                    size="small"
                    sx={{
                      bgcolor: statusTone.bg,
                      color: statusTone.fg,
                      fontWeight: 600,
                    }}
                  />
                ) : null}
                {ratingLabel ? (
                  <Typography variant="body2">{ratingLabel}</Typography>
                ) : null}
              </Stack>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems="stretch"
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ borderRadius: 999, textTransform: 'none' }}
                onClick={() => {
                  setEventAt(toDatetimeLocalValue(new Date().toISOString()));
                  setEventDialogOpen(true);
                }}
              >
                Добавить событие
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                sx={{ borderRadius: 999, textTransform: 'none' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Добавить фото
              </Button>
              <Button
                variant="text"
                startIcon={<EditOutlinedIcon />}
                sx={{ borderRadius: 999, textTransform: 'none' }}
                onClick={handleOpenEdit}
              >
                Редактировать
              </Button>
            </Stack>

            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="fullWidth"
              sx={{
                bgcolor: 'grey.100',
                borderRadius: 999,
                minHeight: 44,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 44,
                },
                '& .MuiTabs-indicator': { height: 4, borderRadius: 999 },
              }}
            >
              <Tab label="Таймлайн" />
              <Tab label="Заметки" />
              <Tab label="Галерея" />
            </Tabs>

            <TabPanel value={tab} index={0}>
              <Stack spacing={2}>
                {events.length === 0 ? (
                  <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Typography color="text.secondary">
                        Пока нет событий. Добавьте первое.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <List sx={{ p: 0 }}>
                    {events.map((event, index) => (
                      <Box key={event.id}>
                        <ListItem
                          alignItems="flex-start"
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => setEventDeleteId(event.id)}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                              }}
                            >
                              {eventTypeIcons[event.type]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Typography fontWeight={600}>
                                  {eventTypeLabels[event.type]}
                                </Typography>
                                {event.mood ? (
                                  <Typography variant="body2">
                                    {event.mood}
                                  </Typography>
                                ) : null}
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.5}>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateTime(event.at)}
                                </Typography>
                                {event.text ? (
                                  <Typography variant="body2">{event.text}</Typography>
                                ) : null}
                              </Stack>
                            }
                          />
                        </ListItem>
                        {index < events.length - 1 ? <Divider /> : null}
                      </Box>
                    ))}
                  </List>
                )}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 999, textTransform: 'none' }}
                  onClick={() => {
                    setEventAt(toDatetimeLocalValue(new Date().toISOString()));
                    setEventDialogOpen(true);
                  }}
                >
                  Добавить событие
                </Button>
              </Stack>
            </TabPanel>

            <TabPanel value={tab} index={1}>
              <Stack spacing={2}>
                <TextField
                  label="Заметки"
                  multiline
                  minRows={5}
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                />
                <Stack spacing={2}>
                  <TextField
                    label="Telegram"
                    value={telegramDraft}
                    onChange={(event) => setTelegramDraft(event.target.value)}
                  />
                  <TextField
                    label="Instagram"
                    value={instagramDraft}
                    onChange={(event) => setInstagramDraft(event.target.value)}
                  />
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Привлекательность
                    </Typography>
                    <Rating
                      value={attractivenessDraft}
                      max={5}
                      icon={<span role="img" aria-label="attractiveness">🍑</span>}
                      emptyIcon={<span role="img" aria-label="attractiveness">🍑</span>}
                      onChange={(_, value) => setAttractivenessDraft(value)}
                    />
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Вайб
                    </Typography>
                    <Rating
                      value={vibeDraft}
                      max={5}
                      icon={<span role="img" aria-label="vibe">✨</span>}
                      emptyIcon={<span role="img" aria-label="vibe">✨</span>}
                      onChange={(_, value) => setVibeDraft(value)}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </TabPanel>

            <TabPanel value={tab} index={2}>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 999, textTransform: 'none', alignSelf: 'flex-start' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Добавить фото
                </Button>
                {photoUrls.length === 0 ? (
                  <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Typography color="text.secondary">
                        Здесь будут фото. Добавьте первые снимки.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 2,
                    }}
                  >
                    {photoUrls.map((photo) => (
                      <Box
                        key={photo.id}
                        sx={{
                          position: 'relative',
                          borderRadius: 4,
                          overflow: 'hidden',
                          boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.12)',
                        }}
                      >
                        <Box
                          component="img"
                          src={photo.url}
                          alt={profile.name}
                          sx={{
                            width: '100%',
                            height: 160,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                        >
                          <IconButton
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                            onClick={() => handleMakeMainPhoto(photo.id)}
                          >
                            <StarIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                            onClick={async () => {
                              try {
                                await removePhoto(profile.id, photo.id);
                                await loadProfile();
                              } catch (error) {
                                console.error(error);
                                setSnackbarMessage('Не удалось удалить фото');
                              }
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        {profile.photoIds[0] === photo.id ? (
                          <Chip
                            label="Главное"
                            size="small"
                            sx={{
                              position: 'absolute',
                              left: 8,
                              bottom: 8,
                              bgcolor: 'rgba(255,255,255,0.9)',
                            }}
                          />
                        ) : null}
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
            </TabPanel>
          </Stack>
        ) : null}
      </Container>

      <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)}>
        <DialogTitle>Новое событие</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1, minWidth: { xs: '280px', sm: '360px' } }}>
            <FormControl fullWidth>
              <InputLabel id="event-type-label">Тип</InputLabel>
              <Select
                labelId="event-type-label"
                label="Тип"
                value={eventType}
                onChange={(event) =>
                  setEventType(event.target.value as TimelineEventType)
                }
              >
                {(['message', 'call', 'date', 'important'] as TimelineEventType[]).map(
                  (type) => (
                    <MenuItem key={type} value={type}>
                      {eventTypeLabels[type]}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>
            <TextField
              label="Дата и время"
              type="datetime-local"
              value={eventAt}
              onChange={(event) => setEventAt(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Настроение"
              value={eventMood}
              onChange={(event) => setEventMood(event.target.value)}
              fullWidth
            />
            <TextField
              label="Описание"
              multiline
              minRows={3}
              value={eventText}
              onChange={(event) => setEventText(event.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleAddEventSubmit}>
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Редактировать анкету</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1, minWidth: { xs: '280px', sm: '360px' } }}>
            <TextField
              label="Имя"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel id="status-label">Статус</InputLabel>
              <Select
                labelId="status-label"
                label="Статус"
                value={editStatus}
                onChange={(event) =>
                  setEditStatus(event.target.value as ProfileStatus)
                }
              >
                {profileStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Telegram"
              value={editTelegram}
              onChange={(event) => setEditTelegram(event.target.value)}
            />
            <TextField
              label="Instagram"
              value={editInstagram}
              onChange={(event) => setEditInstagram(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Удалить анкету?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleDeleteProfile}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(eventDeleteId)} onClose={() => setEventDeleteId(null)}>
        <DialogTitle>Удалить событие?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Событие будет удалено без возможности восстановления.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDeleteId(null)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleDeleteEvent}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage ?? ''}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(event) => handleAddPhotos(event.target.files)}
      />
    </Box>
  );
};

export default ProfileDetailScreen;
