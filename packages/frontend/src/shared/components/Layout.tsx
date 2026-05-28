import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link to="/search" className="text-xl font-bold text-blue-600">
          K-자원순환 브릿지
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/search" className="text-gray-600 hover:text-blue-600">검색</Link>
          <Link to="/listings/new" className="text-gray-600 hover:text-blue-600">매물 등록</Link>
          <Link to="/demands/new" className="text-gray-600 hover:text-blue-600">수요 등록</Link>
          {user ? (
            <>
              <Link to="/demands" className="text-gray-600 hover:text-blue-600">내 수요</Link>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">로그아웃</button>
            </>
          ) : (
            <Link to="/auth/login" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700">
              로그인
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
