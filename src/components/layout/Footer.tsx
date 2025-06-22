import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Project Olympia. All rights reserved.</p>
          <div className="flex space-x-4">
            <Link href="/privacy-policy" className="hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-gray-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 