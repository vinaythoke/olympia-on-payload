/**
 * @jest-environment jsdom
 */

import {
  openDB, 
  storeOfflineCheckIn, 
  getOfflineCheckIns, 
  removeOfflineCheckIn,
  syncOfflineCheckIns,
  cacheTicket,
  getCachedTickets,
  cacheEvent,
  getCachedEvents
} from './offlineStorage';

// Mock the fetch function
global.fetch = jest.fn();

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  close: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(),
  oncomplete: null,
};

const mockObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  count: jest.fn(),
};

const mockRequest = {
  onsuccess: null,
  onerror: null,
  result: null,
  error: null,
};

// Mock IndexedDB open function
global.indexedDB = {
  open: jest.fn().mockImplementation(() => {
    const request = { ...mockRequest };
    
    // Simulate successful open
    setTimeout(() => {
      if (request.onsuccess) {
        request.result = mockDB;
        request.onsuccess();
      }
    }, 0);
    
    return request;
  }),
};

describe('Offline Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks for each test
    mockTransaction.objectStore.mockReturnValue(mockObjectStore);
    mockDB.transaction.mockReturnValue(mockTransaction);
    
    mockObjectStore.add.mockImplementation(() => {
      const request = { ...mockRequest };
      setTimeout(() => {
        if (request.onsuccess) {
          request.result = 123; // Mock ID
          request.onsuccess();
        }
      }, 0);
      return request;
    });
    
    mockObjectStore.put.mockImplementation(() => {
      const request = { ...mockRequest };
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);
      return request;
    });
    
    mockObjectStore.delete.mockImplementation(() => {
      const request = { ...mockRequest };
      setTimeout(() => {
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);
      return request;
    });
    
    mockObjectStore.getAll.mockImplementation(() => {
      const request = { ...mockRequest };
      setTimeout(() => {
        if (request.onsuccess) {
          request.result = [
            { id: 1, ticketId: 'TIX-123', timestamp: Date.now() },
            { id: 2, ticketId: 'TIX-456', timestamp: Date.now() - 1000 },
          ];
          request.onsuccess();
        }
      }, 0);
      return request;
    });
    
    mockObjectStore.count.mockImplementation(() => {
      const request = { ...mockRequest };
      setTimeout(() => {
        if (request.onsuccess) {
          request.result = 2;
          request.onsuccess();
        }
      }, 0);
      return request;
    });
  });
  
  test('openDB should return a database connection', async () => {
    const db = await openDB();
    expect(db).toBe(mockDB);
    expect(global.indexedDB.open).toHaveBeenCalledWith('olympia-offline', 1);
  });
  
  test('storeOfflineCheckIn should store check-in data', async () => {
    const checkIn = {
      ticketId: 'TIX-123',
      photoData: 'base64data',
      timestamp: Date.now(),
      userId: 'user123',
      eventId: 'event123',
    };
    
    const id = await storeOfflineCheckIn(checkIn);
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['offline-check-ins'], 'readwrite');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('offline-check-ins');
    expect(mockObjectStore.add).toHaveBeenCalled();
    expect(id).toBe(123);
  });
  
  test('getOfflineCheckIns should return stored check-ins', async () => {
    const checkIns = await getOfflineCheckIns();
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['offline-check-ins'], 'readonly');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('offline-check-ins');
    expect(mockObjectStore.getAll).toHaveBeenCalled();
    expect(checkIns).toHaveLength(2);
    expect(checkIns[0].ticketId).toBe('TIX-123');
  });
  
  test('removeOfflineCheckIn should delete a check-in by ID', async () => {
    await removeOfflineCheckIn(1);
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['offline-check-ins'], 'readwrite');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('offline-check-ins');
    expect(mockObjectStore.delete).toHaveBeenCalledWith(1);
  });
  
  test('syncOfflineCheckIns should sync stored check-ins with server', async () => {
    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    const result = await syncOfflineCheckIns();
    
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockObjectStore.delete).toHaveBeenCalledTimes(2);
  });
  
  test('syncOfflineCheckIns should handle fetch errors', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const result = await syncOfflineCheckIns();
    
    expect(result).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockObjectStore.delete).not.toHaveBeenCalled();
  });
  
  test('syncOfflineCheckIns should handle conflicts', async () => {
    // Mock a conflict response from the server
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'This ticket has already been used for entry',
        existingCheckIn: {
          timestamp: new Date().toISOString(),
          photo: 'some-photo-url',
        },
      }),
    });

    // Mock a successful response for the second check-in
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await syncOfflineCheckIns();

    // The sync should be considered successful because the conflict was handled
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Both check-ins should be removed from the offline store
    expect(mockObjectStore.delete).toHaveBeenCalledTimes(2);
  });
  
  test('cacheTicket should store a ticket for offline use', async () => {
    const ticket = {
      id: 'TIX-123',
      eventId: 'EVENT-456',
      eventTitle: 'Test Event',
      participantName: 'John Doe',
      ticketType: 'VIP',
      qrCode: 'data:image/png;base64,abc123',
      isCheckedIn: false,
      timestamp: Date.now(),
    };
    
    await cacheTicket(ticket);
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['cached-tickets'], 'readwrite');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('cached-tickets');
    expect(mockObjectStore.put).toHaveBeenCalled();
  });
  
  test('getCachedTickets should return stored tickets', async () => {
    const tickets = await getCachedTickets();
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['cached-tickets'], 'readonly');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('cached-tickets');
    expect(mockObjectStore.getAll).toHaveBeenCalled();
    expect(tickets).toHaveLength(2);
  });
  
  test('cacheEvent should store an event for offline use', async () => {
    const event = {
      id: 'EVENT-123',
      title: 'Test Event',
      description: 'Event description',
      date: '2023-12-31',
      location: 'Test Venue',
      timestamp: Date.now(),
    };
    
    await cacheEvent(event);
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['cached-events'], 'readwrite');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('cached-events');
    expect(mockObjectStore.put).toHaveBeenCalled();
  });
  
  test('getCachedEvents should return stored events', async () => {
    const events = await getCachedEvents();
    
    expect(mockDB.transaction).toHaveBeenCalledWith(['cached-events'], 'readonly');
    expect(mockTransaction.objectStore).toHaveBeenCalledWith('cached-events');
    expect(mockObjectStore.getAll).toHaveBeenCalled();
    expect(events).toHaveLength(2);
  });
}); 