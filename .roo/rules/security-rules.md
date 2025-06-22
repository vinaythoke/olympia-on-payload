---
description: Security Best Practices for Supabase & Frontend–Backend interactions.
globs: 
alwaysApply: false
---
---
description: Security Best Practices for Supabase & Frontend–Backend interactions.
globs: *.js,*.jsx,*.ts,*.tsx,*.sql
---
# Security Rules

1. **Injection Protection**  
   - Use parameterized queries for all raw SQL (never string‑concatenate user input).  
   - Rely on Supabase client methods that auto‑parameterize under the hood.

2. **Input Validation**  
   - Validate and sanitize on both client and server—never trust incoming data.  
   - Use a schema validation library (e.g., Zod, Yup) before any database call.

3. **Authentication & Authorization**  
   - Centralize auth in Supabase Auth; never roll your own password logic.  
   - Enforce Role‑Based Access Control (RBAC) and Row‑Level Security (RLS) policies per table.

4. **Data Encryption**  
   - Ensure HTTPS/TLS for all API calls.  
   - Encrypt sensitive columns at rest (PG‑crypto extension) if needed.

5. **CSRF & XSS Mitigation**  
   - Enable CSRF tokens on forms and protect API routes.  
   - Sanitize HTML output; use safe‑render libraries for any user‑supplied markup.

6. **Secret Management**  
   - Store API keys and DB credentials in a secret store or environment variables—never in source.  
   - Rotate service keys periodically and audit access logs.

7. **API Hardening**  
   - Implement rate limiting on critical endpoints.  
   - Validate input shape and size on every API call; reject malformed requests immediately.


