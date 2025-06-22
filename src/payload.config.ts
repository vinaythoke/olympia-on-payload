import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Organizers } from './collections/Organizers'
import { Volunteers } from './collections/Volunteers'
import { Events } from './collections/Events'
import { AuditLogs } from './collections/AuditLogs'
import { FormBuilder } from './collections/FormBuilder'
import { FormSubmission } from './collections/FormSubmission'
import { Tickets } from './collections/Tickets'
import { TicketPurchases } from './collections/TicketPurchases'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    Organizers,
    Volunteers,
    Events,
    AuditLogs,
    FormBuilder,
    FormSubmission,
    Tickets,
    TicketPurchases,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  plugins: [
    // payloadCloudPlugin(),
  ],
})
