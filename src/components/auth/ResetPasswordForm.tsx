'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate input
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate token presence
    if (!token) {
      setError('Invalid or missing reset token')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Password reset failed')
      }

      setIsSuccess(true)

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Request</h2>
          <p className="mb-6 text-gray-600">This password reset link is invalid or has expired.</p>
          <div>
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">
              Request a new password reset link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Password Reset Successfully</h2>
          <p className="mb-6 text-gray-600">
            Your password has been changed. You will be redirected to the login page.
          </p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>

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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
