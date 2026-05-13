'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/authContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('Attempting login with:', {
        username: data.email,
        password: '********' // Don't log actual passwords
      });
      
      // Pass credentials as an object to match what your backend expects
      const credentials = {
        email: data.email,
        password: data.password
      };
      
      await login(credentials);
      toast.success('Login successful!');
      router.push('/'); // Redirect to homepage after login
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Login failed';
      setAuthError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your component remains the same

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Log in to TikTok</h1>
          <p className="text-gray-500 mt-2">Manage your account, check notifications, comment on videos, and more</p>
        </div>

        <div className="border rounded-lg p-6">
          {authError && (
            <div className="mb-4 p-2 bg-red-50 text-red-500 rounded">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="mb-4 text-right">
              <Link href="/reset-password" className="text-sm text-gray-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-red-500 text-white py-3 rounded-md font-medium hover:bg-red-600 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-red-500 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}