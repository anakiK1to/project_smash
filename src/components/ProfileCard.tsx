import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import PhotoIcon from '@mui/icons-material/InsertPhotoOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import type { Profile, ProfileStatus } from '../domain/types';
import { getPhoto } from '../storage';
import { formatRelative } from '../utils/time';
import { usePrivacySettings } from '../app/usePrivacySettings';

const statusTones: Record<ProfileStatus, { bg: string; fg: string }> = {
  Новая: { bg: '#E3F2FD', fg: '#0D47A1' },
  Общаемся: { bg: '#E8F5E9', fg: '#1B5E20' },
  '1 свидание': { bg: '#FFF3E0', fg: '#E65100' },
  Регулярно: { bg: '#F3E5F5', fg: '#4A148C' },
  Остыли: { bg: '#ECEFF1', fg: '#37474F' },
  Закрыто: { bg: '#FFEBEE', fg: '#B71C1C' },
};

type ProfileCardProps = {
  profile: Profile;
  onOpen: (id: string) => void;
};

const ProfileCard = ({ profile, onOpen }: ProfileCardProps) => {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const { hidePhotos, hideScores } = usePrivacySettings();

  useEffect(() => {
    let active = true;
    let url: string | undefined;

    const loadPhoto = async () => {
      if (hidePhotos) {
        setPhotoUrl(undefined);
        return;
      }
      const [photoId] = profile.photoIds;
      if (!photoId) {
        setPhotoUrl(undefined);
        return;
      }
      const photo = await getPhoto(photoId);
      if (!active) {
        return;
      }
      if (photo) {
        url = URL.createObjectURL(photo.blob);
        setPhotoUrl(url);
      } else {
        setPhotoUrl(undefined);
      }
    };

    loadPhoto();

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [profile.photoIds, hidePhotos]);

  const relativeLabel = useMemo(() => {
    if (profile.lastInteractionAt) {
      return `последний контакт: ${formatRelative(profile.lastInteractionAt)}`;
    }
    return `обновлено: ${formatRelative(profile.updatedAt)}`;
  }, [profile.lastInteractionAt, profile.updatedAt]);

  const attractiveness = useMemo(() => {
    if (!profile.attractiveness || profile.attractiveness <= 0) {
      return '';
    }
    const count = Math.max(0, Math.floor(profile.attractiveness));
    if (count === 0) {
      return '';
    }
    return '🍑'.repeat(count);
  }, [profile.attractiveness]);

  const statusTone = statusTones[profile.status];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0px 10px 24px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
      }}
    >
      <CardActionArea
        onClick={() => onOpen(profile.id)}
        sx={{ p: 2 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: 'grey.100',
            }}
          >
            {photoUrl ? (
              <Box
                component="img"
                src={photoUrl}
                alt={profile.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(135deg, rgba(224,231,255,0.9), rgba(254,215,170,0.9))',
                  color: 'text.secondary',
                }}
              >
                <PhotoIcon fontSize="medium" />
              </Stack>
            )}
          </Box>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mr: 0.5 }}
                noWrap
              >
                {profile.name}
              </Typography>
              <Chip
                label={profile.status}
                size="small"
                sx={{
                  borderRadius: 999,
                  bgcolor: statusTone.bg,
                  color: statusTone.fg,
                  fontWeight: 600,
                }}
              />
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              {profile.contacts.telegram ? (
                <TelegramIcon fontSize="small" color="primary" />
              ) : null}
              {profile.contacts.instagram ? (
                <InstagramIcon fontSize="small" color="secondary" />
              ) : null}
              {attractiveness && !hideScores ? (
                <Typography variant="body2">{attractiveness}</Typography>
              ) : null}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {relativeLabel}
            </Typography>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
};

export default ProfileCard;
