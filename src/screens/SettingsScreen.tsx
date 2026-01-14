import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { useRef, useState } from 'react';
import type { ExportDumpV1 } from '../domain/types';
import { exportData, importData, wipeAll } from '../storage';
import { usePrivacySettings } from '../app/usePrivacySettings';

const SettingsScreen = () => {
  const { hidePhotos, hideScores, setHidePhotos, setHideScores } =
    usePrivacySettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importDump, setImportDump] = useState<ExportDumpV1 | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const dump = await exportData();
      const blob = new Blob([JSON.stringify(dump, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const dateLabel = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `dating-cards-backup-${dateLabel}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось экспортировать данные');
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ExportDumpV1;
      if (!parsed || parsed.version !== 1) {
        setSnackbarMessage('Неверный формат файла');
        return;
      }
      setImportDump(parsed);
      setImportDialogOpen(true);
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось прочитать файл');
    }
  };

  const handleImportMode = async (mode: 'replace' | 'merge') => {
    if (!importDump) {
      return;
    }
    try {
      await importData(importDump, mode);
      setSnackbarMessage('Импорт завершён');
      setImportDialogOpen(false);
      setImportDump(null);
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось импортировать данные');
    }
  };

  const handleWipeAll = async () => {
    try {
      await wipeAll();
      setSnackbarMessage('Все данные удалены');
    } catch (error) {
      console.error(error);
      setSnackbarMessage('Не удалось удалить данные');
    } finally {
      setWipeDialogOpen(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
          <Typography variant="h5" fontWeight={700}>
            Настройки
          </Typography>
          <Typography color="text.secondary">
            Быстрые переключатели и управление данными.
          </Typography>
        </Box>

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
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Паник-режим
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Скрывайте чувствительные данные в интерфейсе.
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography fontWeight={600}>Скрывать фото</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Вместо фотографий показывается заглушка.
                    </Typography>
                  </Box>
                  <Switch
                    checked={hidePhotos}
                    onChange={(event) => setHidePhotos(event.target.checked)}
                  />
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography fontWeight={600}>Скрывать оценки</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Рейтинги скрыты во всех экранах.
                    </Typography>
                  </Box>
                  <Switch
                    checked={hideScores}
                    onChange={(event) => setHideScores(event.target.checked)}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: '24px' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Экспорт и импорт
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Сохраняйте резервную копию или переносите данные.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadRoundedIcon />}
                  onClick={handleExport}
                  fullWidth
                >
                  Экспортировать данные
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleImportFile(file);
                    }
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FileUploadRoundedIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                >
                  Импортировать файл
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              borderRadius: '24px',
              borderColor: 'error.light',
              gridColumn: { md: '1 / -1' },
            }}
            variant="outlined"
          >
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="error">
                    Danger zone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Удалит все анкеты, события и фото на этом устройстве.
                  </Typography>
                </Box>
                <Button
                  color="error"
                  variant="contained"
                  startIcon={<DeleteForeverRoundedIcon />}
                  onClick={() => setWipeDialogOpen(true)}
                  sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                  Удалить все данные
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <Dialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setImportDump(null);
        }}
      >
        <DialogTitle>Импорт данных</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Выберите режим импорта.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setImportDialogOpen(false);
              setImportDump(null);
            }}
          >
            Отмена
          </Button>
          <Button onClick={() => handleImportMode('merge')}>Объединить</Button>
          <Button variant="contained" onClick={() => handleImportMode('replace')}>
            Заменить всё
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={wipeDialogOpen} onClose={() => setWipeDialogOpen(false)}>
        <DialogTitle>Удалить все данные?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWipeDialogOpen(false)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleWipeAll}>
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
    </Container>
  );
};

export default SettingsScreen;
