import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { SearchPage } from './features/search/SearchPage';
import { ListingDetailPage } from './features/listings/ListingDetailPage';
import { ListingCreatePage } from './features/listings/ListingCreatePage';
import { DemandRegisterPage } from './features/demands/DemandRegisterPage';
import { MyDemandsPage } from './features/demands/MyDemandsPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/search" replace />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="listings/new" element={<ListingCreatePage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route path="demands/new" element={<DemandRegisterPage />} />
        <Route path="demands" element={<MyDemandsPage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
