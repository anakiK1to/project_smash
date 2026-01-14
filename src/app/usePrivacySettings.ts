import { useCallback, useEffect, useState } from 'react';

const HIDE_PHOTOS_KEY = 'dc_hide_photos';
const HIDE_SCORES_KEY = 'dc_hide_scores';

const readFlag = (key: string): boolean =>
  typeof window !== 'undefined' && window.localStorage.getItem(key) === '1';

const writeFlag = (key: string, value: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, value ? '1' : '0');
};

export const usePrivacySettings = () => {
  const [hidePhotos, setHidePhotos] = useState(() => readFlag(HIDE_PHOTOS_KEY));
  const [hideScores, setHideScores] = useState(() => readFlag(HIDE_SCORES_KEY));

  useEffect(() => {
    writeFlag(HIDE_PHOTOS_KEY, hidePhotos);
  }, [hidePhotos]);

  useEffect(() => {
    writeFlag(HIDE_SCORES_KEY, hideScores);
  }, [hideScores]);

  const updateHidePhotos = useCallback((value: boolean) => {
    setHidePhotos(value);
  }, []);

  const updateHideScores = useCallback((value: boolean) => {
    setHideScores(value);
  }, []);

  return {
    hidePhotos,
    hideScores,
    setHidePhotos: updateHidePhotos,
    setHideScores: updateHideScores,
  };
};
