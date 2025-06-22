import 'next/server'
import { type User } from '../payload-types'

declare module 'next/server' {
  interface NextRequest {
    user?: User | null
  }
}
