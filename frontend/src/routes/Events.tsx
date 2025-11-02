import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { GlassButton } from '../components/GlassButton';
import { useAuth } from '../hooks/useAuth';
import { fadeInUp, stagger, scaleIn } from '../lib/motion';
import type { Event, EventCategory } from '../types/event';

export const Events = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadEvents();
  }, [isAuthenticated, navigate]);

  const loadEvents = () => {
    // Mock events data
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Sunday Photo Walk: Old Town',
        description: 'Join us for a relaxed photo walk through the historic old town. All skill levels welcome!',
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
        description: 'Bring your instrument and join our weekly jam session. Improvise, collaborate, and have fun!',
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
        description: 'Build AI solutions for social impact. Teams will be formed on day 1. Prizes for top 3 projects!',
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

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  const categoryIcons: Partial<Record<EventCategory, string>> = {
    photowalk: '📷',
    'photography-walk': '📷',
    jamsession: '🎵',
    'jam-session': '🎵',
    hacknight: '💻',
    hackathon: '💻',
    meetup: '🤝',
    workshop: '🎓',
    'design-sprint': '🎨',
    networking: '🌐',
    collaboration: '🤝',
  };

  const categoryLabels: Partial<Record<EventCategory, string>> = {
    photowalk: 'Photo Walk',
    'photography-walk': 'Photo Walk',
    jamsession: 'Jam Session',
    'jam-session': 'Jam Session',
    hacknight: 'Hack Night',
    hackathon: 'Hackathon',
    meetup: 'Meetup',
    workshop: 'Workshop',
    'design-sprint': 'Design Sprint',
    networking: 'Networking',
    collaboration: 'Collaboration',
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
              <p className="text-white/50">Join creative meetups and collaborations</p>
            </div>
            <GlassButton variant="primary" onClick={() => navigate('/events/create')}>
              + Create Event
            </GlassButton>
          </motion.div>

          {/* Category Filter */}
          <motion.div variants={fadeInUp} className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'glass-strong text-white shadow-glow-blue'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              All Events
            </button>
            {(Object.keys(categoryIcons) as EventCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  filter === cat
                    ? 'glass-strong text-white shadow-glow-blue'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                {categoryIcons[cat]} {categoryLabels[cat]}
              </button>
            ))}
          </motion.div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                variants={scaleIn}
                custom={index}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 space-y-4"
              >
                {/* Category Badge */}
                <div className="flex items-center justify-between">
                  {event.category && (
                    <span className="px-3 py-1 glass rounded-full text-xs font-medium text-white/70">
                      {categoryIcons[event.category] || '📌'} {categoryLabels[event.category] || event.category}
                    </span>
                  )}
                  {event.isOnline && (
                    <span className="px-3 py-1 glass rounded-full text-xs text-accent-blue">
                      🌐 Online
                    </span>
                  )}
                </div>

                {/* Title & Organizer */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2">
                    <img
                      src={event.organizerAvatar}
                      alt={event.organizerName}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <span className="text-xs text-white/50">by {event.organizerName}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/60 line-clamp-3">{event.description}</p>

                {/* Date & Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/40">📅</span>
                    <span className="text-white/70">
                      {new Date(event.startsAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/40">📍</span>
                    <span className="text-white/70">{event.venueCity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/40">👥</span>
                    <span className="text-white/70">
                      {event.attendees.length}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attending
                    </span>
                  </div>
                </div>

                {/* RSVP Button */}
                <GlassButton
                  variant="primary"
                  fullWidth
                  onClick={() => handleRSVP(event.id)}
                  disabled={event.maxAttendees ? event.attendees.length >= event.maxAttendees : false}
                >
                  {event.maxAttendees && event.attendees.length >= event.maxAttendees ? 'Event Full' : 'RSVP'}
                </GlassButton>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <motion.div
              variants={fadeInUp}
              className="text-center py-20 glass-card rounded-2xl"
            >
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
              <p className="text-white/40 mb-6">Create the first event in this category!</p>
              <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Event
              </GlassButton>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Create Modal (placeholder) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Create Event</h2>
              <p className="text-white/60 mb-6">Event creation form would go here...</p>
              <div className="flex gap-3">
                <GlassButton variant="ghost" fullWidth onClick={() => setShowCreateModal(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="primary" fullWidth>
                  Create
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
