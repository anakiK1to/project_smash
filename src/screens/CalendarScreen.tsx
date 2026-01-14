import {
  Box,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  TextField,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CallIcon from '@mui/icons-material/Call';
import EventIcon from '@mui/icons-material/Event';
import StarIcon from '@mui/icons-material/Star';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import type { Profile, TimelineEvent, TimelineEventType } from '../domain/types';
import {
  addEvent,
  deleteEvent,
  listEventsRange,
  listProfiles,
  updateEvent,
} from '../storage';
import {
  addDays,
  addMonths,
  buildMonthGrid,
  endOfDay,
  formatDayHeader,
  formatMonthTitle,
  formatTime,
  fromDatetimeLocalValue,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDatetimeLocalValue,
  toIso,
} from '../utils/date';

const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type ViewMode = 'month' | 'week' | 'day';

type EventGroupMap = Record<string, TimelineEvent[]>;

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

const eventTypeTones: Record<TimelineEventType, { bg: string; fg: string }> = {
  message: { bg: '#E3F2FD', fg: '#1565C0' },
  call: { bg: '#E8F5E9', fg: '#2E7D32' },
  date: { bg: '#FFF3E0', fg: '#EF6C00' },
  important: { bg: '#F3E5F5', fg: '#6A1B9A' },
};

const statusTones: Record<string, { bg: string; fg: string }> = {
  Новая: { bg: '#E3F2FD', fg: '#0D47A1' },
  Общаемся: { bg: '#E8F5E9', fg: '#1B5E20' },
  '1 свидание': { bg: '#FFF3E0', fg: '#E65100' },
  Регулярно: { bg: '#F3E5F5', fg: '#4A148C' },
  Остыли: { bg: '#ECEFF1', fg: '#37474F' },
  Закрыто: { bg: '#FFEBEE', fg: '#B71C1C' },
};

const pad = (value: number): string => String(value).padStart(2, '0');

const getDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const groupEventsByDay = (items: TimelineEvent[]): EventGroupMap =>
  items.reduce((acc, event) => {
    const key = getDayKey(new Date(event.at));
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as EventGroupMap);

const formatShortDate = (date: Date): string =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
    .format(date)
    .replace('.', '');

const CalendarScreen = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [view, setView] = useState<ViewMode>('month');
  const [lastNonDayView, setLastNonDayView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [eventType, setEventType] = useState<TimelineEventType>('message');
  const [eventAt, setEventAt] = useState('');
  const [eventMood, setEventMood] = useState('');
  const [eventText, setEventText] = useState('');
  const [eventProfileId, setEventProfileId] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuEvent, setMenuEvent] = useState<TimelineEvent | null>(null);

  const profilesById = useMemo(() => {
    return profiles.reduce(
      (acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      },
      {} as Record<string, Profile>,
    );
  }, [profiles]);

  const range = useMemo(() => {
    if (view === 'month') {
      const gridStart = startOfWeek(startOfMonth(currentDate));
      const gridEnd = endOfDay(addDays(gridStart, 41));
      return { from: gridStart, to: gridEnd };
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate);
      return { from: start, to: endOfDay(addDays(start, 6)) };
    }
    return { from: startOfDay(currentDate), to: endOfDay(currentDate) };
  }, [view, currentDate]);

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const monthDates = useMemo(() => buildMonthGrid(currentDate), [currentDate]);

  const title = useMemo(() => {
    if (view === 'month') {
      return formatMonthTitle(currentDate);
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      return `${formatShortDate(start)} — ${formatShortDate(end)} ${end.getFullYear()}`;
    }
    return formatDayHeader(currentDate);
  }, [view, currentDate]);

  const loadProfiles = async () => {
    const items = await listProfiles();
    setProfiles(items);
    if (!eventProfileId && items.length > 0) {
      setEventProfileId(items[0].id);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const items = await listEventsRange(toIso(range.from), toIso(range.to));
      setEvents(items);
    } catch (error) {
      console.error('calendar: failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    const handleFocus = () => {
      loadProfiles();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [range.from, range.to]);

  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, -1));
      return;
    }
    if (view === 'week') {
      setCurrentDate((prev) => addDays(prev, -7));
      return;
    }
    setCurrentDate((prev) => addDays(prev, -1));
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
      return;
    }
    if (view === 'week') {
      setCurrentDate((prev) => addDays(prev, 7));
      return;
    }
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openAddDialog = () => {
    setEditingEvent(null);
    const defaultDate = new Date(currentDate);
    if (view === 'day') {
      const now = new Date();
      defaultDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
    setEventAt(toDatetimeLocalValue(toIso(defaultDate)));
    setEventMood('');
    setEventText('');
    setEventType('message');
    if (!eventProfileId && profiles.length > 0) {
      setEventProfileId(profiles[0].id);
    }
    setDialogOpen(true);
  };

  const openEditDialog = (event: TimelineEvent) => {
    setEditingEvent(event);
    setEventType(event.type);
    setEventAt(toDatetimeLocalValue(event.at));
    setEventMood(event.mood ?? '');
    setEventText(event.text ?? '');
    setEventProfileId(event.profileId);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async () => {
    if (!eventProfileId) {
      return;
    }
    try {
      const payload = {
        type: eventType,
        at: fromDatetimeLocalValue(eventAt),
        mood: eventMood.trim() || undefined,
        text: eventText.trim() || undefined,
      };
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          ...payload,
          profileId: eventProfileId,
        });
      } else {
        await addEvent(eventProfileId, payload);
      }
      await loadEvents();
      setDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('calendar: failed to save event', error);
    }
  };

  const handleMenuOpen = (
    event: MouseEvent<HTMLButtonElement>,
    item: TimelineEvent,
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuEvent(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuEvent(null);
  };

  const handleDelete = async () => {
    if (!menuEvent) {
      return;
    }
    try {
      await deleteEvent(menuEvent.id);
      await loadEvents();
    } catch (error) {
      console.error('calendar: failed to delete event', error);
    } finally {
      handleMenuClose();
    }
  };

  const renderMonthCell = (date: Date) => {
    const dayKey = getDayKey(date);
    const dayEvents = eventsByDay[dayKey] ?? [];
    const uniqueProfiles = new Set(dayEvents.map((item) => item.profileId));
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const typeCounts = dayEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<TimelineEventType, number>,
    );
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return (
      <Box
        key={dayKey}
        onClick={() => {
          setCurrentDate(date);
          setLastNonDayView('month');
          setView('day');
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setCurrentDate(date);
            setLastNonDayView('month');
            setView('day');
          }
        }}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          p: 1,
          minHeight: { xs: 76, sm: 92, md: 110 },
          overflow: 'hidden',
          cursor: 'pointer',
          bgcolor: isCurrentMonth ? 'background.paper' : 'action.hover',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Typography
          variant="subtitle2"
          color={isCurrentMonth ? 'text.primary' : 'text.secondary'}
          sx={{ lineHeight: 1.2, maxWidth: '100%', pl: 0.5 }}
        >
          {date.getDate()}
        </Typography>
        {dayEvents.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`${dayEvents.length} событий`}
              sx={{ bgcolor: 'action.selected' }}
            />
            <Chip
              size="small"
              label={`${uniqueProfiles.size} людей`}
              sx={{ bgcolor: 'action.selected' }}
            />
            {topType ? (
              <Chip
                size="small"
                label={`${eventTypeLabels[topType[0] as TimelineEventType]}: ${topType[1]}`}
                sx={{ bgcolor: 'action.selected' }}
              />
            ) : null}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Нет событий
          </Typography>
        )}
      </Box>
    );
  };

  const renderWeekView = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(7, 1fr)',
        },
        gap: 1.5,
      }}
    >
      {weekDates.map((date) => {
        const key = getDayKey(date);
        const dayEvents = (eventsByDay[key] ?? []).slice().sort((a, b) =>
          a.at.localeCompare(b.at),
        );
        return (
          <Card key={key} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Button
                onClick={() => {
                  setCurrentDate(date);
                  setLastNonDayView('week');
                  setView('day');
                }}
                sx={{ textTransform: 'none', px: 0, minWidth: 'unset' }}
              >
                <Stack alignItems="flex-start">
                  <Typography variant="subtitle2">
                    {weekdayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatShortDate(date)}
                  </Typography>
                </Stack>
              </Button>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {dayEvents.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    Нет событий
                  </Typography>
                ) : (
                  dayEvents.map((event) => (
                    <Box
                      key={event.id}
                      onClick={() => openEditDialog(event)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === 'Enter') {
                          openEditDialog(event);
                        }
                      }}
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        cursor: 'pointer',
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {eventTypeIcons[event.type]}
                          <Typography variant="caption">
                            {formatTime(event.at)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                          {profilesById[event.profileId]?.name ?? 'Профиль'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {eventTypeLabels[event.type]}
                          {event.text ? ` · ${event.text}` : ''}
                        </Typography>
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  const renderDayView = () => {
    const key = getDayKey(currentDate);
    const dayEvents = (eventsByDay[key] ?? []).slice().sort((a, b) =>
      a.at.localeCompare(b.at),
    );
    const grouped = dayEvents.reduce((acc, event) => {
      if (!acc[event.profileId]) {
        acc[event.profileId] = [];
      }
      acc[event.profileId].push(event);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);
    const profileIds = Object.keys(grouped);

    if (profileIds.length === 0) {
      return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary">
              Пока нет событий на этот день.
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Stack spacing={2}>
        {profileIds.map((profileId) => {
          const profile = profilesById[profileId];
          const eventsList = grouped[profileId].slice().sort((a, b) =>
            a.at.localeCompare(b.at),
          );
          const tone = profile ? statusTones[profile.status] : undefined;
          return (
            <Card key={profileId} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {profile?.name ?? 'Профиль'}
                    </Typography>
                    {profile ? (
                      <Chip
                        size="small"
                        label={profile.status}
                        sx={{ bgcolor: tone?.bg, color: tone?.fg }}
                      />
                    ) : null}
                  </Stack>
                  <List sx={{ p: 0 }}>
                    {eventsList.map((event) => (
                      <ListItem
                        key={event.id}
                        alignItems="flex-start"
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="Действия"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              handleMenuOpen(clickEvent, event);
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        }
                        sx={{ px: 0 }}
                        onClick={() => openEditDialog(event)}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: eventTypeTones[event.type].bg,
                              color: eventTypeTones[event.type].fg,
                              width: 36,
                              height: 36,
                            }}
                          >
                            {eventTypeIcons[event.type]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight={600}>
                                {eventTypeLabels[event.type]}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatTime(event.at)}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5}>
                              {event.mood ? (
                                <Typography variant="body2">{event.mood}</Typography>
                              ) : null}
                              {event.text ? (
                                <Typography variant="body2" color="text.secondary">
                                  {event.text}
                                </Typography>
                              ) : null}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Календарь
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {view === 'day' ? (
                <Button
                  variant="text"
                  onClick={() => setView(lastNonDayView)}
                  sx={{ textTransform: 'none' }}
                >
                  Назад
                </Button>
              ) : null}
              <IconButton aria-label="Предыдущий период" onClick={handlePrev}>
                <ChevronLeftIcon />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<TodayIcon />}
                sx={{ textTransform: 'none' }}
                onClick={handleToday}
              >
                Сегодня
              </Button>
              <IconButton aria-label="Следующий период" onClick={handleNext}>
                <ChevronRightIcon />
              </IconButton>
              <Typography
                variant={isDesktop ? 'h5' : 'subtitle1'}
                fontWeight={600}
                sx={{ ml: { xs: 0, md: 2 } }}
              >
                {title}
              </Typography>
            </Stack>
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(_, value: ViewMode | null) => {
                  if (value) {
                    if (value !== 'day') {
                      setLastNonDayView(value);
                    }
                    setView(value);
                  }
                }}
              color="primary"
              size={isDesktop ? 'medium' : 'small'}
              sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
            >
              <ToggleButton value="month">Месяц</ToggleButton>
              <ToggleButton value="week">Неделя</ToggleButton>
              <ToggleButton value="day">День</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {loading ? (
          <Typography color="text.secondary">Загрузка событий...</Typography>
        ) : null}

        {view === 'month' ? (
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
              }}
            >
              {weekdayLabels.map((label) => (
                <Typography
                  key={label}
                  variant="caption"
                  fontWeight={600}
                  textAlign="center"
                  color="text.secondary"
                >
                  {label}
                </Typography>
              ))}
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
              }}
            >
              {monthDates.map((date) => renderMonthCell(date))}
            </Box>
          </Stack>
        ) : null}

        {view === 'week' ? renderWeekView() : null}

        {view === 'day' ? (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ textTransform: 'none' }}
                onClick={openAddDialog}
                disabled={profiles.length === 0}
              >
                Добавить событие
              </Button>
              {profiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Сначала добавьте профиль, чтобы создать событие.
                </Typography>
              ) : null}
            </Stack>
            {renderDayView()}
          </Stack>
        ) : null}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingEvent ? 'Редактирование события' : 'Новое событие'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1, minWidth: { xs: 280, sm: 380 } }}>
            <FormControl fullWidth>
              <InputLabel id="event-profile-label">Профиль</InputLabel>
              <Select
                labelId="event-profile-label"
                label="Профиль"
                value={eventProfileId}
                onChange={(event) => setEventProfileId(event.target.value)}
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleDialogSubmit}
            disabled={!eventProfileId}
          >
            {editingEvent ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuEvent) {
              openEditDialog(menuEvent);
            }
            handleMenuClose();
          }}
        >
          Редактировать
        </MenuItem>
        <MenuItem onClick={handleDelete}>Удалить</MenuItem>
      </Menu>
    </Container>
  );
};

export default CalendarScreen;
