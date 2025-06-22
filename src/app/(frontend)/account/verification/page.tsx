import { VerificationForm } from '@/components/auth/VerificationForm';
import { Navbar } from '@/components/layout';

export default function VerificationPage() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-3xl font-bold text-center">Identity Verification</h1>
          <p className="mb-8 text-center text-gray-600">
            Verify your identity using Aadhaar or PAN to gain a 'Verified' badge on your profile.
          </p>
          <VerificationForm />
        </div>
      </main>
    </>
  );
} 