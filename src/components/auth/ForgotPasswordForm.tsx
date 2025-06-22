'use client'

import { useState } from 'react'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to process request')
      }

      // Show success state even if email doesn't exist (security best practice)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="mb-6 text-gray-600">
            If an account exists with the email <span className="font-medium">{email}</span>, we've
            sent instructions to reset your password.
          </p>
          <p className="text-sm text-gray-500">
            Don't see the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              try again
            </button>
          </p>
          <div className="mt-6">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
      <p className="mb-6 text-center text-gray-600">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
