import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '../../shared/api/auth';
import { useAuthStore } from '../../shared/store/authStore';

interface RegisterForm {
  email: string;
  password: string;
  role: 'buyer' | 'seller';
}

export function RegisterPage() {
  const { register, handleSubmit } = useForm<RegisterForm>({ defaultValues: { role: 'buyer' } });
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: ({ email, password, role }: RegisterForm) => authApi.register(email, password, role),
    onSuccess: async (data) => {
      setAuth(data.accessToken, null);
      const me = await authApi.getMe();
      setAuth(data.accessToken, me);
      toast.success('회원가입 완료!');
      navigate('/search');
    },
    onError: () => toast.error('회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">회원가입</h1>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input type="email" {...register('email', { required: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (8자 이상)</label>
            <input type="password" {...register('password', { required: true, minLength: 8 })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select {...register('role')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="buyer">구매자 (장비 필요)</option>
              <option value="seller">판매자 (장비 보유)</option>
            </select>
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          이미 계정이 있으신가요? <Link to="/auth/login" className="text-blue-600 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
