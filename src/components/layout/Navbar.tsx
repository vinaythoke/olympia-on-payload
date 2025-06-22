'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-md fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl text-blue-600">
                Project Olympia
              </Link>
            </div>

            {/* Desktop navigation links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                href="/events"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/events' || pathname.startsWith('/events/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Events
              </Link>

              {isAuthenticated && (
                <Link
                  href="/account/tickets"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/account/tickets'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  My Tickets
                </Link>
              )}

              {/* Show admin links only for superadmins */}
              {user && user.role === 'superadmin' && (
                <Link
                  href="/admin/organizers"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/admin/organizers' || pathname.startsWith('/admin/organizers/')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Manage Organizers
                </Link>
              )}

              {/* Show organizer links only for organizers */}
              {user && (user.role === 'organizer' || user.role === 'superadmin') && (
                <Link
                  href="/organizer/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/organizer/dashboard' || pathname.startsWith('/organizer/')
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Organizer Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Auth buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-2 text-sm text-gray-700">
                  <span>
                    {user?.name} ({user?.role})
                  </span>
                  {user?.verification?.status === 'verified' && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                      Verified
                    </Badge>
                  )}
                </span>

                {user?.role === 'participant' && user?.verification?.status !== 'verified' && (
                  <Link
                    href="/account/verification"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Verify Account
                  </Link>
                )}

                <button
                  onClick={() => logout()}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Home
          </Link>
          <Link
            href="/events"
            onClick={closeMobileMenu}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/events' || pathname.startsWith('/events/')
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Events
          </Link>

          {isAuthenticated && (
            <Link
              href="/account/tickets"
              onClick={closeMobileMenu}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/account/tickets'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My Tickets
            </Link>
          )}

          {/* Show admin links only for superadmins */}
          {user && user.role === 'superadmin' && (
            <Link
              href="/admin/organizers"
              onClick={closeMobileMenu}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/admin/organizers' || pathname.startsWith('/admin/organizers/')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Manage Organizers
            </Link>
          )}

          {/* Show organizer links only for organizers */}
          {user && (user.role === 'organizer' || user.role === 'superadmin') && (
            <Link
              href="/organizer/dashboard"
              onClick={closeMobileMenu}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/organizer/dashboard' || pathname.startsWith('/organizer/')
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Organizer Dashboard
            </Link>
          )}
        </div>

        {/* Auth buttons for mobile */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="px-4">
                <p className="text-sm font-medium text-gray-500">Signed in as:</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.name} ({user?.role})
                  </p>
                  {user?.verification?.status === 'verified' && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {user?.role === 'participant' && user?.verification?.status !== 'verified' && (
                <div className="px-4">
                  <Link
                    href="/account/verification"
                    onClick={closeMobileMenu}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Verify Account
                  </Link>
                </div>
              )}

              <div className="px-4">
                <button
                  onClick={() => {
                    logout()
                    closeMobileMenu()
                  }}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 space-y-2">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMobileMenu}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
