import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { GlassButton } from '../components/GlassButton';
import { useAuth } from '../hooks/useAuth';
import { scaleIn } from '../lib/motion';
import type { Event, EventCategory } from '../types/event';
import {
  Camera,
  Music3,
  Cpu,
  Users,
  Sparkles,
  Palette,
  Wifi,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

const categoryMeta: Partial<
  Record<EventCategory, { label: string; icon: ComponentType<{ className?: string }> }>
> = {
  photowalk: { label: 'Photo Walk', icon: Camera },
  'photography-walk': { label: 'Photo Walk', icon: Camera },
  jamsession: { label: 'Jam Session', icon: Music3 },
  'jam-session': { label: 'Jam Session', icon: Music3 },
  hackathon: { label: 'Hackathon', icon: Cpu },
  hacknight: { label: 'Hack Night', icon: Cpu },
  meetup: { label: 'Meetup', icon: Users },
  networking: { label: 'Networking', icon: Users },
  workshop: { label: 'Workshop', icon: Palette },
  'design-sprint': { label: 'Design Sprint', icon: Palette },
  collaboration: { label: 'Collaboration', icon: Sparkles },
};

export const Events = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadEvents();
  }, [isAuthenticated, navigate]);

  const loadEvents = () => {
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Sunday Photo Walk: Old Town',
        description:
          'Join us for a relaxed photo walk through the historic old town. All skill levels welcome!',
        organizerId: 'u1',
        organizerName: 'Lisa Wang',
        organizerAvatar: 'https://i.pravatar.cc/150?img=9',
        category: 'photowalk',
        startsAt: '2025-11-10T09:00:00',
        venueCity: 'Jakarta',
        tags: ['photography', 'outdoor'],
        field: 'photography',
        maxAttendees: 15,
        attendees: [],
        rsvps: [],
        isOnline: false,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Jazz Jam Session',
        description:
          'Bring your instrument and join our weekly jam session. Improvise, collaborate, and have fun!',
        organizerId: 'u2',
        organizerName: 'David Park',
        organizerAvatar: 'https://i.pravatar.cc/150?img=11',
        category: 'jamsession',
        startsAt: '2025-11-08T19:00:00',
        venueCity: 'Tokyo',
        tags: ['music', 'jazz'],
        field: 'music',
        maxAttendees: 20,
        attendees: [],
        rsvps: [],
        isOnline: false,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: '48-Hour Hackathon: AI for Good',
        description:
          'Build AI solutions for social impact. Teams will be formed on day 1. Prizes for top 3 projects!',
        organizerId: 'u3',
        organizerName: 'Emma Chen',
        organizerAvatar: 'https://i.pravatar.cc/150?img=6',
        category: 'hackathon',
        startsAt: '2025-11-15T18:00:00',
        venueCity: 'Online',
        tags: ['tech', 'ai', 'coding'],
        field: 'technology',
        maxAttendees: 50,
        attendees: [],
        rsvps: [],
        isOnline: true,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      },
    ];
    setEvents(mockEvents);
  };

  const handleRSVP = (eventId: string) => {
    console.log('RSVP to event:', eventId);
    alert('RSVP confirmed! Check your messages for the event group chat.');
  };

  const filteredEvents = events.filter((event) => (filter === 'all' ? true : event.category === filter));

  return (
    <Layout>
      <div className="shell-content space-y-6 pb-12">
        <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Events</p>
            <h1 className="text-3xl font-semibold text-white">Meet collaborators in real time.</h1>
            <p className="text-white/60 text-sm mt-2">
              Walks, jam sessions, hackathons, and more curated meets for the Alliv community.
            </p>
          </div>
          <GlassButton variant="primary" onClick={() => navigate('/events/create')}>
            + Create event
          </GlassButton>
        </section>

        <section className="panel flex flex-wrap gap-2 p-4">
          {(['all', ...(Object.keys(categoryMeta) as EventCategory[])] as (EventCategory | 'all')[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  filter === cat
                    ? 'bg-white text-black'
                    : 'border border-white/15 text-white/70 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All events' : categoryMeta[cat]?.label || cat}
              </button>
            )
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, index) => {
            const key: EventCategory = event.category ?? 'collaboration';
            const meta = categoryMeta[key];
            const Icon = meta?.icon || Sparkles;

            return (
              <motion.div
                key={event.id}
                variants={scaleIn}
                custom={index}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="panel flex h-full flex-col gap-4 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    <Icon className="w-3.5 h-3.5" />
                    {meta?.label || key}
                  </div>
                  {event.isOnline && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-accent-blue">
                      <Wifi className="w-3.5 h-3.5" />
                      Online
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                  <p className="text-sm text-white/60 line-clamp-3">{event.description}</p>
                </div>

                <div className="space-y-1.5 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    {new Date(event.startsAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/40" />
                    {event.venueCity}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={event.organizerAvatar}
                    alt={event.organizerName}
                    className="w-10 h-10 rounded-full object-cover border border-white/15"
                  />
                  <div>
                    <p className="text-sm text-white font-semibold">{event.organizerName}</p>
                    <p className="text-xs text-white/50">Organizer</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {event.tags?.map((tag) => (
                    <span key={tag} className="text-xs rounded-full border border-white/10 px-3 py-1 text-white/70">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleRSVP(event.id)}
                  className="w-full rounded-2xl border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  RSVP
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
