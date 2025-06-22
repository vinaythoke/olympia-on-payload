import { ResetPasswordForm } from '@/components/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Olympia',
  description: 'Create a new password for your Olympia account',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
} 