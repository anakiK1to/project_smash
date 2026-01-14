import {
  Box,
  Dialog,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';

type PhotoViewerItem = {
  id: string;
  src: string;
};

type PhotoViewerDialogProps = {
  open: boolean;
  photos: PhotoViewerItem[];
  index: number;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
};

const PhotoViewerDialog = ({
  open,
  photos,
  index,
  onClose,
  onChangeIndex,
}: PhotoViewerDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const total = photos.length;

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (total === 0) {
        if (event.key === 'Escape') {
          onClose();
        }
        return;
      }
      if (event.key === 'ArrowLeft') {
        onChangeIndex(Math.max(0, index - 1));
      }
      if (event.key === 'ArrowRight') {
        onChangeIndex(Math.min(total - 1, index + 1));
      }
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, onChangeIndex, onClose, open, total]);

  const currentPhoto = photos[index];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="lg"
      fullWidth
    >
      <Box
        sx={{
          bgcolor: 'grey.900',
          color: 'common.white',
          minHeight: isMobile ? '100vh' : 560,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 'calc(env(safe-area-inset-top) + 16px)',
            pb: 1,
          }}
        >
          <Typography variant="body2">
            {total > 0 ? `${index + 1} / ${total}` : '0 / 0'}
          </Typography>
          <IconButton
            aria-label="Закрыть просмотр"
            onClick={onClose}
            sx={{ color: 'common.white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 4 },
            pb: 'calc(env(safe-area-inset-bottom) + 16px)',
          }}
        >
          {currentPhoto ? (
            <Box
              component="img"
              src={currentPhoto.src}
              alt=""
              sx={{
                width: '100%',
                height: '100%',
                maxHeight: isMobile ? '70vh' : '70vh',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Typography variant="body2">Нет фото для просмотра</Typography>
          )}
        </Box>

        <IconButton
          aria-label="Предыдущее фото"
          onClick={() => onChangeIndex(Math.max(0, index - 1))}
          disabled={index <= 0 || total === 0}
          sx={{
            position: 'absolute',
            left: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(0, 0, 0, 0.35)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' },
          }}
        >
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton
          aria-label="Следующее фото"
          onClick={() => onChangeIndex(Math.min(total - 1, index + 1))}
          disabled={index >= total - 1 || total === 0}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(0, 0, 0, 0.35)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.5)' },
          }}
        >
          <NavigateNextIcon />
        </IconButton>
      </Box>
    </Dialog>
  );
};

export default PhotoViewerDialog;
