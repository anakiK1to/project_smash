import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import type { Profile, ProfileStatus } from '../domain/types';
import {
  addPhoto,
  createProfile,
  getPhoto,
  getProfile,
  removePhoto,
  updateProfile,
} from '../storage';
import { usePrivacySettings } from '../app/usePrivacySettings';
import PhotoFrame from '../components/PhotoFrame';

const profileStatuses: ProfileStatus[] = [
  'Новая',
  'Общаемся',
  '1 свидание',
  'Регулярно',
  'Остыли',
  'Закрыто',
];

const ProfileEditorScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { hidePhotos, hideScores } = usePrivacySettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(isEditMode);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProfileStatus>('Новая');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');
  const [notes, setNotes] = useState('');
  const [attractiveness, setAttractiveness] = useState<number | null>(null);
  const [vibe, setVibe] = useState<number | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Array<{ id: string; url: string }>>(
    [],
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<
    Array<{ id: string; url: string; file: File }>
  >([]);
  const pendingPreviewsRef = useRef(pendingPreviews);

  const nameError = nameTouched && name.trim().length < 2;

  const loadProfile = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const data = await getProfile(id);
      setProfile(data ?? null);
      if (data) {
        setName(data.name);
        setStatus(data.status);
        setTelegram(data.contacts.telegram ?? '');
        setInstagram(data.contacts.instagram ?? '');
        setNotes(data.notes ?? '');
        setAttractiveness(data.attractiveness ?? null);
        setVibe(data.vibe ?? null);
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось загрузить анкету');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    pendingPreviewsRef.current = pendingPreviews;
  }, [pendingPreviews]);

  useEffect(() => {
    return () => {
      pendingPreviewsRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    };
  }, []);

  useEffect(() => {
    if (!profile?.photoIds.length || hidePhotos) {
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
  }, [profile?.photoIds, hidePhotos]);

  const handleSave = async () => {
    setNameTouched(true);
    if (name.trim().length < 2) {
      setSnackbarMessage('Введите имя (минимум 2 символа)');
      return;
    }
    try {
      if (isEditMode && id) {
        const updated = await updateProfile(id, {
          name: name.trim(),
          status,
          contacts: {
            telegram: telegram.trim() || undefined,
            instagram: instagram.trim() || undefined,
          },
          notes: notes.trim() || undefined,
          attractiveness: attractiveness ?? undefined,
          vibe: vibe ?? undefined,
        });
        setProfile(updated);
        navigate(`/p/${id}`);
      } else {
        const created = await createProfile({
          name: name.trim(),
          status,
          contacts: {
            telegram: telegram.trim() || undefined,
            instagram: instagram.trim() || undefined,
          },
          notes: notes.trim() || undefined,
          attractiveness: attractiveness ?? undefined,
          vibe: vibe ?? undefined,
        });
        setProfile(created);
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(
              pendingFiles.map((file) => addPhoto(created.id, file)),
            );
            pendingPreviews.forEach((preview) =>
              URL.revokeObjectURL(preview.url),
            );
            setPendingFiles([]);
            setPendingPreviews([]);
          } catch (error) {
            console.error(error);
            setSnackbarMessage('Не удалось загрузить фото');
            return;
          }
        }
        navigate(`/p/${created.id}`);
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось сохранить анкету');
    }
  };

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    if (!profile) {
      const previews = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      }));
      setPendingFiles((prev) => [...prev, ...previews.map((item) => item.file)]);
      setPendingPreviews((prev) => [...prev, ...previews]);
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

  const handleRemovePendingPhoto = (photoId: string) => {
    let removedFile: File | null = null;
    let removedUrl: string | null = null;
    setPendingPreviews((prev) => {
      const target = prev.find((preview) => preview.id === photoId);
      removedFile = target?.file ?? null;
      removedUrl = target?.url ?? null;
      return prev.filter((preview) => preview.id !== photoId);
    });
    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }
    if (removedFile) {
      setPendingFiles((prev) => prev.filter((file) => file !== removedFile));
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

  const notesHelper = useMemo(
    () =>
      hideScores
        ? 'Оценки скрыты. Переключите паник-режим в настройках.'
        : undefined,
    [hideScores],
  );
  const tileItems = profile
    ? hidePhotos
      ? profile.photoIds.map((photoId) => ({ id: photoId, url: null }))
      : photoUrls
    : hidePhotos
      ? pendingPreviews.map((photo) => ({ id: photo.id, url: null, file: photo.file }))
      : pendingPreviews;
  const emptyPhotosLabel = hidePhotos
    ? 'Фото скрыты паник-режимом.'
    : 'Добавьте первые фото для анкеты.';

  return (
    <Box>
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
            {isEditMode ? 'Редактирование' : 'Новая анкета'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSave}
            sx={{ borderRadius: 999, textTransform: 'none' }}
          >
            Сохранить
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={isDesktop ? 'md' : 'sm'}
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
      >
        {loading ? (
          <Typography color="text.secondary">Загрузка...</Typography>
        ) : null}

        {!loading && isEditMode && !profile ? (
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6">Анкета не найдена</Typography>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Назад
            </Button>
          </Stack>
        ) : null}

        {!loading && (!isEditMode || profile) ? (
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            <Card variant="outlined" sx={{ borderRadius: '24px' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Основное
                  </Typography>
                  <TextField
                    label="Имя"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onBlur={() => setNameTouched(true)}
                    error={nameError}
                    helperText={nameError ? 'Минимум 2 символа' : ' '}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Статус</InputLabel>
                    <Select
                      labelId="status-label"
                      label="Статус"
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as ProfileStatus)
                      }
                    >
                      {profileStatuses.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: '24px' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Контакты
                  </Typography>
                  <TextField
                    label="Telegram"
                    value={telegram}
                    onChange={(event) => setTelegram(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Instagram"
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: '24px' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Оценки
                  </Typography>
                  {!hideScores ? (
                    <>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          🍑 Привлекательность
                        </Typography>
                        <Rating
                          value={attractiveness}
                          max={5}
                          onChange={(_, value) => setAttractiveness(value)}
                        />
                      </Stack>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          ✨ Вайб
                        </Typography>
                        <Rating
                          value={vibe}
                          max={5}
                          onChange={(_, value) => setVibe(value)}
                        />
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {notesHelper}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: '24px' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Заметки
                  </Typography>
                  <TextField
                    label="Заметки"
                    multiline
                    minRows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              sx={{ borderRadius: '24px', gridColumn: { md: '1 / -1' } }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Фото
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddPhotoAlternateOutlinedIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ borderRadius: 999, textTransform: 'none' }}
                    >
                      Добавить фото
                    </Button>
                  </Stack>
                  {tileItems.length > 0 ? (
                    <Grid container spacing={1.5} columns={{ xs: 2, sm: 3, md: 4 }}>
                      {tileItems.map((photo) => (
                        <Grid item xs={1} key={photo.id}>
                          <PhotoFrame
                            variant="tile"
                            src={photo.url ?? undefined}
                            alt={name || 'Фото'}
                            hide={hidePhotos}
                            overlay={
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                }}
                              >
                                {profile ? (
                                  <IconButton
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                                    aria-label="Сделать главным"
                                    onClick={() => handleMakeMainPhoto(photo.id)}
                                  >
                                    <StarRoundedIcon fontSize="small" />
                                  </IconButton>
                                ) : null}
                                <IconButton
                                  size="small"
                                  sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
                                  aria-label="Удалить фото"
                                  onClick={async () => {
                                    if (!profile) {
                                      handleRemovePendingPhoto(photo.id);
                                      return;
                                    }
                                    try {
                                      await removePhoto(profile.id, photo.id);
                                      await loadProfile();
                                    } catch (error) {
                                      console.error(error);
                                      setSnackbarMessage('Не удалось удалить фото');
                                    }
                                  }}
                                >
                                  <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box
                      sx={{
                        borderRadius: 3,
                        p: 3,
                        bgcolor: 'grey.50',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {emptyPhotosLabel}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ) : null}
      </Container>

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
        onChange={(event) => {
          handleAddPhotos(event.target.files);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
    </Box>
  );
};

export default ProfileEditorScreen;
