import { ForgotPasswordForm } from '@/components/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | Olympia',
  description: 'Reset your Olympia account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
} 