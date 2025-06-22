---
description: Testing Best Practices for Supabase‑backed applications.
globs: 
alwaysApply: false
---
---
description: Testing Best Practices for Supabase‑backed applications.
globs: *.test.js,*.test.ts,*.spec.js,*.spec.ts
---
# Testing Rules

1. **Unit Tests**  
   - Write tests for each function in your `services/` modules.  
   - Mock Supabase client calls to isolate logic; avoid end‑to‑end network hits in unit tests.  
   - Aim for ≥ 80% coverage on critical modules.

2. **Integration Tests**  
   - Stand up a dedicated “test” Supabase project or use an in‑memory emulator.  
   - Verify real queries against a disposable database instance.  
   - Roll back or teardown state between test runs.

3. **End‑to‑End Tests**  
   - Use tools like Cypress or Playwright to simulate user flows (sign-up, CRUD operations).  
   - Seed the database with predictable fixtures before running E2E suites.

4. **Test Organization**  
   - Place all tests under `tests/` with subfolders by feature.  
   - Name files to mirror the code under test (e.g., `user-auth.test.ts` → tests/auth/user-auth.test.ts).

5. **Mocking & Stubbing**  
   - Stub only external dependencies (e.g., storage, third‑party APIs).  
   - Avoid over‑mocking your own modules—test realistic behavior.

6. **Continuous Integration**  
   - Fail the build on test failures or coverage drops.  
   - Run headless E2E jobs against your staging environment nightly.


