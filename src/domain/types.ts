export type ProfileStatus =
  | 'Ищу серьёзные отношения'
  | 'Открыт для общения'
  | 'Свайп без спешки';

export type Profile = {
  id: string;
  name: string;
  status: ProfileStatus;
};
