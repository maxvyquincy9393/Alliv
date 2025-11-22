import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { useAuth } from '../hooks/useAuth';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  Wifi,
  Share2,
  Bookmark
} from 'lucide-react';
import type { Event, EventCategory } from '../types/event';

// Extended Event type for the mock data with images
interface ExtendedEvent extends Event {
  coverImage: string;
}

export const Events = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchEvents();
  }, [isAuthenticated, navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockEvents: ExtendedEvent[] = [
        {
          id: '1',
          title: 'Tech Founders Mixer',
          description: 'Exclusive networking event for tech founders in Jakarta. Connect with investors and peers in a premium setting.',
          organizerId: 'u1',
          organizerName: 'Startup Grind',
          organizerAvatar: 'https://i.pravatar.cc/150?img=12',
          category: 'networking',
          startsAt: '2025-11-20T18:00:00',
          venueCity: 'Jakarta',
          tags: ['Startup', 'Networking', 'Business'],
          field: 'Business',
          maxAttendees: 100,
          attendees: [],
          rsvps: [],
          isOnline: false,
          status: 'upcoming',
          createdAt: new Date().toISOString(),
          coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000',
        },
        {
          id: '2',
          title: 'React Advanced Workshop',
          description: 'Deep dive into React Server Components, performance optimization, and modern patterns.',
          organizerId: 'u2',
          organizerName: 'ReactID',
          organizerAvatar: 'https://i.pravatar.cc/150?img=8',
          category: 'workshop',
          startsAt: '2025-11-22T10:00:00',
          venueCity: 'Online',
          tags: ['React', 'Frontend', 'Web'],
          field: 'Technology',
          maxAttendees: 500,
          attendees: [],
          rsvps: [],
          isOnline: true,
          status: 'upcoming',
          createdAt: new Date().toISOString(),
          coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1000',
        },
        {
          id: '3',
          title: 'Design Systems Hackathon',
          description: '48-hour hackathon to build the next generation of design tools. Prizes worth $5k.',
          organizerId: 'u3',
          organizerName: 'Figma Community',
          organizerAvatar: 'https://i.pravatar.cc/150?img=5',
          category: 'hackathon',
          startsAt: '2025-11-25T09:00:00',
          venueCity: 'Singapore',
          tags: ['Design', 'Hackathon', 'UI/UX'],
          field: 'Design',
          maxAttendees: 50,
          attendees: [],
          rsvps: [],
          isOnline: false,
          status: 'upcoming',
          createdAt: new Date().toISOString(),
          coverImage: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&q=80&w=1000',
        }
      ];
      setEvents(mockEvents);
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e =>
    (filter === 'all' || e.category === filter) &&
    (e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <FullScreenLayout>
      <div className="min-h-screen text-slate-200 p-6 md:p-10 md:pl-80 pt-24">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
              Explore Events
            </h1>
            <p className="text-lg text-slate-400 max-w-xl">
              Discover workshops, meetups, and hackathons to level up your skills and network.
            </p>
          </div>
          <button
            onClick={() => navigate('/events/create')}
            className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Create Event
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel rounded-3xl p-2 mb-10 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search for events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none rounded-2xl pl-14 pr-4 py-4 text-white placeholder:text-slate-500 focus:ring-0 focus:outline-none"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto p-1 scrollbar-hide">
            {(['all', 'workshop', 'meetup', 'hackathon', 'networking'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`px-6 py-3 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all duration-300 ${filter === cat
                  ? 'bg-blue-500/20 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl mb-8 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Calendar className="text-slate-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">No events found</h3>
            <p className="text-slate-400">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </FullScreenLayout>
  );
};

const EventCard = ({ event }: { event: ExtendedEvent }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative glass-panel rounded-3xl overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500 flex flex-col"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent z-10" />
        <img
          src={event.coverImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />

        {/* Date Badge */}
        <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[70px]">
          <div className="text-xs font-medium text-blue-400 uppercase tracking-wider">
            {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div className="text-xl font-bold text-white font-display">
            {new Date(event.startsAt).getDate()}
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4 z-20">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md capitalize">
            {event.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          {event.isOnline && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Wifi size={12} /> ONLINE
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 font-display leading-tight group-hover:text-blue-400 transition-colors">
          {event.title}
        </h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
          {event.description}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-blue-400">
              <Clock size={14} />
            </div>
            <span>{new Date(event.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-blue-400">
              <MapPin size={14} />
            </div>
            <span className="truncate">{event.venueCity}</span>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={event.organizerAvatar} alt={event.organizerName} className="w-8 h-8 rounded-full border border-slate-600" />
          <span className="text-sm text-slate-300 font-medium">{event.organizerName}</span>
        </div>

        <div className="flex gap-2">
          <button className="p-2.5 hover:bg-blue-500/20 rounded-xl text-slate-400 hover:text-blue-400 transition-all">
            <Bookmark size={18} />
          </button>
          <button className="p-2.5 hover:bg-blue-500/20 rounded-xl text-slate-400 hover:text-blue-400 transition-all">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
