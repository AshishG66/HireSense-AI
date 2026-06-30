import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import api from '../../../utils/api';
import { useAuthStore } from '../../../stores/useAuthStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    try {
      const response = await api.post('/auth/login', data);
      const user = response.data.data.user;
      const accessToken = response.data.data.accessToken;
      const refreshToken = response.data.data.refreshToken;
      const login = useAuthStore.getState().login;
      login(user, accessToken, refreshToken);
      navigate('/');
    } catch (error: any) {
      console.error('Login failed', error);
      alert(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
        Sign In
      </Button>
      
      <p className="text-sm text-center text-muted-foreground mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
