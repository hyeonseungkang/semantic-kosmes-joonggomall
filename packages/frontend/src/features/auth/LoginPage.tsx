import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '../../shared/api/auth';
import { useAuthStore } from '../../shared/store/authStore';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginForm) => authApi.login(email, password),
    onSuccess: async (data) => {
      setAuth(data.accessToken, null);
      const me = await authApi.getMe();
      setAuth(data.accessToken, me);
      toast.success('로그인 성공');
      navigate('/search');
    },
    onError: () => toast.error('이메일 또는 비밀번호가 올바르지 않습니다.'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">로그인</h1>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input type="email" {...register('email', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input type="password" {...register('password', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          계정이 없으신가요? <Link to="/auth/register" className="text-blue-600 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
