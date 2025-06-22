---
description: Supabase & Database Best Practices extracted from the comprehensive guide.
globs: 
alwaysApply: false
---
---
description: Supabase & Database Best Practices extracted from the comprehensive guide.
globs: *.js,*.jsx,*.ts,*.tsx,*.sql
---
# Supabase & Database Rules

1. **Client Initialization**  
   - Keep a single `supabase.ts` (or `.js`) for initializing and exporting your Supabase client.  
   - Import that client everywhere you need to read/write data.

2. **Database Interaction Layer**  
   - Encapsulate all CRUD operations in `services/database.ts` (or `.js`)—never call Supabase directly from UI components.  
   - Follow the Repository Pattern: each collection/table gets its own module with clear, typed interfaces.

3. **Migrations & Schema Management**  
   - Store all schema changes under a `migrations/` directory.  
   - Use a formal migration tool (Supabase CLI, Drizzle ORM, or similar) instead of ad‑hoc dashboard edits.

4. **Environment Segregation**  
   - Enforce a multi‑stage workflow: `local → staging → production`.  
   - Keep distinct environment variables for each stage; never mix prod credentials in dev/test.

5. **Production Safety**  
   - **No direct DB edits** in the Supabase dashboard once live. Always push changes via migrations.  
   - Limit dashboard access to senior engineers; use role‑based access control (RBAC) in Supabase settings.

6. **Resilience & Recovery**  
   - Implement Point‑In‑Time Recovery (PITR) for critical tables.  
   - Schedule automated backups and test restores regularly.

7. **Performance Monitoring**  
   - Leverage Supabase’s observability tools to track slow queries and connection counts.  
   - Add indexes on high‑cardinality and frequently‑queried columns.

8. **Leverage Postgres Features**  
   - Use built‑in Postgres types (JSONB, arrays) and functions when they simplify your data model.  
   - Avoid vendor lock‑in: keep business logic in your code, not in Supabase Functions or Policies.


