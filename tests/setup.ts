// Import vi from vitest
import { vi, afterEach } from 'vitest';

// Mock fetch
const fetchMock = vi.fn();
// @ts-ignore
window.fetch = fetchMock;

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
}); 