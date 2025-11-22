import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Calendar, Briefcase, MessageCircle, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from './Logo';

const navLinks = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/discover', label: 'Discover', icon: Search },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
    { path: '/projects', label: 'Projects', icon: Briefcase },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: User },
];

export const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 flex-col z-50 p-4">
            {/* Glass Container */}
            <div className="glass-panel w-full h-full rounded-3xl flex flex-col overflow-hidden relative bg-[#050505]/95 border-white/10 shadow-2xl">

                {/* Logo Area */}
                <div className="p-8 pb-6 border-b border-white/5">
                    <Link to="/home" className="block group">
                        <Logo size="medium" />
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.path);

                        return (
                            <Link key={link.path} to={link.path}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative px-4 py-3.5 rounded-xl flex items-center gap-4 transition-all duration-300 group ${active
                                        ? 'bg-white text-black font-bold shadow-lg shadow-white/10'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon
                                        size={20}
                                        strokeWidth={active ? 2.5 : 1.5}
                                        className={`transition-colors ${active ? 'text-black' : 'group-hover:text-white'}`}
                                    />
                                    <span className="text-sm tracking-wide">{link.label}</span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Footer Area */}
                <div className="p-4 mt-auto border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                            <Settings size={18} />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                    <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                            <User size={20} className="text-white/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                                My Profile
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-white/40 truncate">View Account</p>
                        </div>
                    </Link>
                </div>
            </div>
        </aside>
    );
};
