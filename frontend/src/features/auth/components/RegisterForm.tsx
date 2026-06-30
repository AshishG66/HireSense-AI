import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import api from '../../../utils/api';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CANDIDATE', 'RECRUITER'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CANDIDATE',
    },
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    try {
      // 1. Register
      await api.post('/auth/register', data);
      
      // 2. Auto-login after successful registration
      const loginResponse = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      
      const user = loginResponse.data.data.user;
      const accessToken = loginResponse.data.data.accessToken;
      const refreshToken = loginResponse.data.data.refreshToken;
      const login = useAuthStore.getState().login;
      login(user, accessToken, refreshToken);
      
      // 3. Redirect to dashboard
      navigate('/');
    } catch (error: any) {
      console.error('Registration failed', error);
      alert(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        type="text"
        error={errors.name?.message}
        {...register('name')}
      />
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
      
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">I am a...</label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input 
              type="radio" 
              value="CANDIDATE" 
              {...register('role')} 
              className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
            />
            <span className="text-sm">Candidate</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="radio" 
              value="RECRUITER" 
              {...register('role')} 
              className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
            />
            <span className="text-sm">Recruiter</span>
          </label>
        </div>
        {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
      </div>

      <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
        Create Account
      </Button>
      
      <p className="text-sm text-center text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  );
}
