import { RegisterForm } from '@/components/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Olympia',
  description: 'Create an account on Olympia to register for events and access your tickets.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
} 