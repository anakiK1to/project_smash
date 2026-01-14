import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './AppShell';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import ProfileEditorScreen from '../screens/ProfileEditorScreen';
import ProfilesListScreen from '../screens/ProfilesListScreen';
import SettingsScreen from '../screens/SettingsScreen';

const AppRouter = () => {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ProfilesListScreen />} />
        <Route path="/new" element={<ProfileEditorScreen />} />
        <Route path="/p/:id" element={<ProfileDetailScreen />} />
        <Route path="/p/:id/edit" element={<ProfileEditorScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
