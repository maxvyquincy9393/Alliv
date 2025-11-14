export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  organizer?: {
    id: string;
    name: string;
    avatar: string;
  };
  category?: EventCategory;
  startsAt: string;
  endsAt?: string;
  venueCity: string;
  venueAddress?: string;
  venueLat?: number;
  venueLon?: number;
  tags: string[];
  field: string;
  thumbnail?: string;
  capacity?: number;
  maxAttendees?: number;
  attendees: string[]; // User IDs
  rsvps: {
    userId: string;
    status: 'going' | 'interested' | 'not-going';
    respondedAt: string;
  }[];
  isOnline: boolean;
  meetingLink?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export type EventCategory = 
  | 'photowalk'
  | 'jamsession'
  | 'hacknight'
  | 'photography-walk'
  | 'jam-session'
  | 'hackathon'
  | 'design-sprint'
  | 'workshop'
  | 'meetup'
  | 'networking'
  | 'collaboration';
