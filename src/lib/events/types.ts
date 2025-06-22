export interface Event {
  id: number;
  title: string;
  organizer: {
    id: number;
    organizerName?: string;
    user?: {
      id: number;
      email: string;
    };
  };
  eventBanner?: {
    id: number;
    url?: string;
  } | null;
  description?: any; // Rich text format
  eventDate: string;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  status: 'draft' | 'published' | 'cancelled';
  capacity?: number;
  registrationForm?: any;
  createdAt: string;
  updatedAt: string;
}

export type EventCreateInput = {
  title: string;
  organizer: string; // ID of the organizer
  eventBanner?: string; // ID of the media
  description?: any; // Rich text format
  eventDate: string;
  location?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  status: 'draft' | 'published' | 'cancelled';
  capacity?: number;
  registrationForm?: any;
};

export type EventUpdateInput = Partial<EventCreateInput>;

export type EventResponse = Event;

export type EventListResponse = {
  docs: EventResponse[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}; 