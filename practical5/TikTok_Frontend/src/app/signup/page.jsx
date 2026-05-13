'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/authContext';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const router = useRouter();
  
  const password = watch('password');
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('Submitting registration data:', {
        username: data.email,
        email: data.email,
        password: data.password // Don't log real passwords in production!
      });
      
      const userData = {
        username: data.email,
        email: data.email,
        password: data.password,
      };
      
      await registerUser(userData);
      toast.success('Registration successful! Please log in.');
      router.push('/login'); // Redirect to login page instead of homepage
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error.response?.data?.message || 'Registration failed';
      setAuthError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Sign up for TikTok</h1>
          <p className="text-gray-500 mt-2">Create a profile, follow other accounts, make your own videos, and more</p>
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
                type="text"
                placeholder="Username"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers and underscores'
                  }
                })}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

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

            <div className="mb-6">
              <input
                type="password"
                placeholder="Confirm password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  className="mt-1 mr-2"
                  {...register('terms', { required: 'You must agree to the terms' })}
                />
                <span className="text-sm text-gray-500">
                  I agree to TikTok's <a href="#" className="text-black font-semibold">Terms of Service</a> and acknowledge that I have read the <a href="#" className="text-black font-semibold">Privacy Policy</a>.
                </span>
              </label>
              {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-red-500 text-white py-3 rounded-md font-medium hover:bg-red-600 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-red-500 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}