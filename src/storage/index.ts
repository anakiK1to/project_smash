import { openDB, type DBSchema } from 'idb';
import type {
  ExportDumpV1,
  Photo,
  Profile,
  TimelineEvent,
} from '../domain/types';

type StorageDb = DBSchema & {
  profiles: {
    key: string;
    value: Profile;
  };
  events: {
    key: string;
    value: TimelineEvent;
    indexes: { profileId: string };
  };
  photos: {
    key: string;
    value: Photo;
  };
};

const DB_NAME = 'dating-cards-db';
const DB_VERSION = 1;

const dbPromise = openDB<StorageDb>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('profiles')) {
      db.createObjectStore('profiles', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('events')) {
      const store = db.createObjectStore('events', { keyPath: 'id' });
      store.createIndex('profileId', 'profileId');
    }
    if (!db.objectStoreNames.contains('photos')) {
      db.createObjectStore('photos', { keyPath: 'id' });
    }
  },
});

export const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export const nowIso = (): string => new Date().toISOString();

const sortByIsoDesc = <T>(items: T[], getter: (item: T) => string) =>
  items.sort((a, b) => getter(b).localeCompare(getter(a)));

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const base64ToBlob = (dataBase64: string, mime: string): Blob => {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

export const listProfiles = async (): Promise<Profile[]> => {
  const db = await dbPromise;
  const profiles = await db.getAll('profiles');
  return sortByIsoDesc(profiles, (profile) => profile.updatedAt);
};

export const getProfile = async (
  id: string,
): Promise<Profile | undefined> => {
  const db = await dbPromise;
  return db.get('profiles', id);
};

export const getPhoto = async (id: string): Promise<Photo | undefined> => {
  const db = await dbPromise;
  return db.get('photos', id);
};

export const createProfile = async (
  input: Pick<
    Profile,
    'name' | 'status' | 'contacts' | 'attractiveness' | 'vibe' | 'notes'
  >,
): Promise<Profile> => {
  const db = await dbPromise;
  const timestamp = nowIso();
  const profile: Profile = {
    id: makeId(),
    name: input.name,
    status: input.status,
    contacts: input.contacts,
    attractiveness: input.attractiveness,
    vibe: input.vibe,
    notes: input.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
    photoIds: [],
  };
  await db.put('profiles', profile);
  return profile;
};

export const updateProfile = async (
  id: string,
  patch: Partial<Omit<Profile, 'id' | 'createdAt'>>,
): Promise<Profile> => {
  const db = await dbPromise;
  const existing = await db.get('profiles', id);
  if (!existing) {
    throw new Error('Profile not found');
  }
  const updatedAt = patch.updatedAt ?? nowIso();
  const updated: Profile = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt,
  };
  await db.put('profiles', updated);
  return updated;
};

export const deleteProfile = async (id: string): Promise<void> => {
  const db = await dbPromise;
  const profile = await db.get('profiles', id);
  const tx = db.transaction(['profiles', 'events', 'photos'], 'readwrite');
  await tx.objectStore('profiles').delete(id);

  const eventStore = tx.objectStore('events');
  const eventKeys = await eventStore.index('profileId').getAllKeys(id);
  await Promise.all(eventKeys.map((eventId) => eventStore.delete(eventId)));

  if (profile) {
    await Promise.all(
      profile.photoIds.map((photoId) =>
        tx.objectStore('photos').delete(photoId),
      ),
    );
  }

  await tx.done;
};

export const addPhoto = async (profileId: string, file: File): Promise<Photo> => {
  const db = await dbPromise;
  const tx = db.transaction(['profiles', 'photos'], 'readwrite');
  const profile = await tx.objectStore('profiles').get(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  const photo: Photo = {
    id: makeId(),
    createdAt: nowIso(),
    mime: file.type,
    blob: file,
  };
  await tx.objectStore('photos').put(photo);
  const updatedProfile: Profile = {
    ...profile,
    photoIds: [...profile.photoIds, photo.id],
    updatedAt: nowIso(),
  };
  await tx.objectStore('profiles').put(updatedProfile);
  await tx.done;
  return photo;
};

export const removePhoto = async (
  profileId: string,
  photoId: string,
): Promise<void> => {
  const db = await dbPromise;
  const tx = db.transaction(['profiles', 'photos'], 'readwrite');
  const profile = await tx.objectStore('profiles').get(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  await tx.objectStore('photos').delete(photoId);
  const updatedProfile: Profile = {
    ...profile,
    photoIds: profile.photoIds.filter((id) => id !== photoId),
    updatedAt: nowIso(),
  };
  await tx.objectStore('profiles').put(updatedProfile);
  await tx.done;
};

export const listEvents = async (
  profileId: string,
): Promise<TimelineEvent[]> => {
  const db = await dbPromise;
  const events = await db
    .transaction('events')
    .objectStore('events')
    .index('profileId')
    .getAll(profileId);
  return sortByIsoDesc(events, (event) => event.at);
};

export const addEvent = async (
  profileId: string,
  input: Pick<TimelineEvent, 'type' | 'at' | 'mood' | 'text'>,
): Promise<TimelineEvent> => {
  const db = await dbPromise;
  const tx = db.transaction(['events', 'profiles'], 'readwrite');
  const profile = await tx.objectStore('profiles').get(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  const event: TimelineEvent = {
    id: makeId(),
    profileId,
    type: input.type,
    at: input.at,
    mood: input.mood,
    text: input.text,
    createdAt: nowIso(),
  };
  await tx.objectStore('events').put(event);
  const lastInteractionAt =
    !profile.lastInteractionAt ||
    input.at.localeCompare(profile.lastInteractionAt) > 0
      ? input.at
      : profile.lastInteractionAt;
  await tx.objectStore('profiles').put({
    ...profile,
    lastInteractionAt,
    updatedAt: nowIso(),
  });
  await tx.done;
  return event;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const db = await dbPromise;
  await db.delete('events', eventId);
};

export const exportData = async (): Promise<ExportDumpV1> => {
  try {
    const db = await dbPromise;
    const [profiles, events, photos] = await Promise.all([
      db.getAll('profiles'),
      db.getAll('events'),
      db.getAll('photos'),
    ]);
    const photosData = await Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        createdAt: photo.createdAt,
        mime: photo.mime,
        dataBase64: await blobToBase64(photo.blob),
      })),
    );
    return {
      version: 1,
      exportedAt: nowIso(),
      profiles,
      events,
      photos: photosData,
    };
  } catch (error) {
    console.error('exportData failed', error);
    throw error;
  }
};

export const importData = async (
  dump: ExportDumpV1,
  mode: 'replace' | 'merge',
): Promise<void> => {
  try {
    const db = await dbPromise;
    const tx = db.transaction(['profiles', 'events', 'photos'], 'readwrite');
    const profilesStore = tx.objectStore('profiles');
    const eventsStore = tx.objectStore('events');
    const photosStore = tx.objectStore('photos');

    if (mode === 'replace') {
      await Promise.all([
        profilesStore.clear(),
        eventsStore.clear(),
        photosStore.clear(),
      ]);
    }

    for (const profile of dump.profiles) {
      if (mode === 'merge') {
        const existing = await profilesStore.get(profile.id);
        if (existing) {
          const updatedAt =
            existing.updatedAt.localeCompare(profile.updatedAt) >= 0
              ? existing.updatedAt
              : profile.updatedAt;
          await profilesStore.put({
            ...existing,
            ...profile,
            updatedAt,
          });
          continue;
        }
      }
      await profilesStore.put(profile);
    }

    for (const event of dump.events) {
      if (mode === 'merge') {
        const existing = await eventsStore.get(event.id);
        await eventsStore.put(existing ? { ...existing, ...event } : event);
      } else {
        await eventsStore.put(event);
      }
    }

    for (const photo of dump.photos) {
      const photoRecord: Photo = {
        id: photo.id,
        createdAt: photo.createdAt,
        mime: photo.mime,
        blob: base64ToBlob(photo.dataBase64, photo.mime),
      };
      if (mode === 'merge') {
        const existing = await photosStore.get(photo.id);
        await photosStore.put(
          existing ? { ...existing, ...photoRecord } : photoRecord,
        );
      } else {
        await photosStore.put(photoRecord);
      }
    }

    await tx.done;
  } catch (error) {
    console.error('importData failed', error);
    throw error;
  }
};
