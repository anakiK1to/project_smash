import { Navigate, Route, Routes } from 'react-router-dom';
import ProfilesListScreen from '../screens/ProfilesListScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import ProfileNewScreen from '../screens/ProfileNewScreen';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<ProfilesListScreen />} />
      <Route path="/p/:id" element={<ProfileDetailScreen />} />
      <Route path="/new" element={<ProfileNewScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
