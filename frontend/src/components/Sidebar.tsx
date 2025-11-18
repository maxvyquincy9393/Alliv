import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Calendar, Briefcase, MessageCircle, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';

const navLinks = [
    { path: '/home', label: 'Home', icon: Home, color: theme.colors.primary.blue },
    { path: '/discover', label: 'Discover', icon: Search, color: theme.colors.primary.purple },
    { path: '/chat', label: 'Chat', icon: MessageCircle, color: theme.colors.primary.pink },
    { path: '/projects', label: 'Projects', icon: Briefcase, color: theme.colors.primary.yellow },
    { path: '/events', label: 'Events', icon: Calendar, color: theme.colors.primary.pink },
    { path: '/profile', label: 'Profile', icon: User, color: theme.colors.primary.blue },
];

export const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 flex-col z-50 p-4">
            {/* Glass Container */}
            <div className="glass-panel w-full h-full rounded-3xl flex flex-col overflow-hidden relative">

                {/* Logo Area */}
                <div className="p-8 pb-4">
                    <Link to="/home" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-40 group-hover:opacity-80 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-violet-600 p-2.5 rounded-xl shadow-lg">
                                <span className="text-xl font-black text-white">A</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-2xl font-bold tracking-tight text-white">livv</span>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
                                Collab Match
                            </p>
                        </div>
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
                                    className={`relative px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 group ${active
                                        ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon
                                        size={20}
                                        strokeWidth={active ? 2.5 : 2}
                                        className={`transition-colors ${active ? 'text-blue-600' : 'group-hover:text-white'}`}
                                    />
                                    <span className="text-sm">{link.label}</span>

                                    {/* Active Indicator */}
                                    {active && (
                                        <motion.div
                                            layoutId="activeSidebar"
                                            className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Footer Area */}
                <div className="p-4 mt-auto border-t border-white/5 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                            <Settings size={18} />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>

                    <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-[#0A0F1C] flex items-center justify-center overflow-hidden">
                                <User size={20} className="text-white/80" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                My Profile
                            </p>
                            <p className="text-xs text-white/40 truncate">View Account</p>
                        </div>
                    </Link>
                </div>
            </div>
        </aside>
    );
};
