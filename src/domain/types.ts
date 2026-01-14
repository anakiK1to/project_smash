export type ProfileStatus =
  | 'Новая'
  | 'Общаемся'
  | '1 свидание'
  | 'Регулярно'
  | 'Остыли'
  | 'Закрыто';

export type ContactLinks = { telegram?: string; instagram?: string };

export type Photo = {
  id: string;
  createdAt: string;
  mime: string;
  blob: Blob;
};

export type Profile = {
  id: string;
  name: string;
  status: ProfileStatus;
  contacts: ContactLinks;
  attractiveness?: number;
  vibe?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastInteractionAt?: string;
  photoIds: string[];
};

export type TimelineEventType = 'message' | 'call' | 'date' | 'important';

export type TimelineEvent = {
  id: string;
  profileId: string;
  type: TimelineEventType;
  at: string;
  mood?: string;
  text?: string;
  createdAt: string;
};

export type ExportDumpV1 = {
  version: 1;
  exportedAt: string;
  profiles: Profile[];
  events: TimelineEvent[];
  photos: Array<{
    id: string;
    createdAt: string;
    mime: string;
    dataBase64: string;
  }>;
};
