import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import { alpha, useTheme } from '@mui/material/styles';

export type PhotoFrameVariant = 'hero' | 'avatar' | 'tile';

export type PhotoFrameProps = {
  src?: string | null;
  alt?: string;
  variant: PhotoFrameVariant;
  hide?: boolean;
  onClick?: () => void;
  overlay?: ReactNode;
};

const placeholderLabel = (hide: boolean) => (hide ? 'Фото скрыто' : 'Нет фото');

const PhotoFrame = ({
  src,
  alt = '',
  variant,
  hide = false,
  onClick,
  overlay,
}: PhotoFrameProps) => {
  const theme = useTheme();
  const shouldShowImage = Boolean(src) && !hide;

  const radius = variant === 'hero' ? 28 : variant === 'tile' ? 20 : 16;
  const radiusPx = `${radius}px`;

  const baseStyles = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radiusPx,
    border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
    bgcolor: theme.palette.action.hover,
    cursor: onClick ? 'pointer' : 'default',
  } as const;

  const variantStyles =
    variant === 'hero'
      ? {
          width: '100%',
          aspectRatio: { xs: '16 / 9', sm: '16 / 9', lg: '4 / 3' },
          // Avoid maxHeight + aspectRatio conflicts that compress the hero into a capsule.
        }
      : variant === 'tile'
        ? {
            width: '100%',
            aspectRatio: '1 / 1',
          }
        : {
            width: { xs: 56, md: 48 },
            height: { xs: 56, md: 48 },
          };

  return (
    <Box
      sx={{ ...baseStyles, ...variantStyles }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? alt || 'Фото' : undefined}
    >
      {shouldShowImage ? (
        <Box
          component="img"
          src={src ?? undefined}
          alt={alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <Stack
          spacing={0.5}
          alignItems="center"
          justifyContent="center"
          sx={{
            width: '100%',
            height: '100%',
            color: 'text.secondary',
            textAlign: 'center',
            px: 1,
          }}
        >
          <InsertPhotoOutlinedIcon fontSize="medium" />
          <Typography variant="caption">
            {placeholderLabel(hide)}
          </Typography>
        </Stack>
      )}
      {overlay}
    </Box>
  );
};

export default PhotoFrame;
