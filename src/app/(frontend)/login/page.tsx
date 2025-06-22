import { LoginForm } from '@/components/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Olympia',
  description: 'Sign in to your Olympia account to manage events, register for events, or check in participants.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
} 