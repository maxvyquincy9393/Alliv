import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  ArrowUpRight,
  Briefcase
} from 'lucide-react';
import type { Project } from '../types/project';

export const Projects = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter] = useState<Project['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProjects();
  }, [isAuthenticated, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Fintech Dashboard Redesign',
          description: 'Redesigning the core banking dashboard for a major fintech client. Focus on data visualization and accessibility.',
          ownerId: 'u1',
          ownerName: 'Alex Morgan',
          ownerAvatar: 'https://i.pravatar.cc/150?img=11',
          tags: ['UI/UX', 'React', 'D3.js'],
          field: 'Fintech',
          lookingFor: ['Senior Designer', 'Frontend Dev'],
          status: 'open',
          createdAt: '2024-03-10',
          members: [],
          applicants: []
        },
        {
          id: '2',
          title: 'AI Content Generator',
          description: 'Building a SaaS platform for automated content generation using GPT-4. Need backend scaling experts.',
          ownerId: 'u2',
          ownerName: 'Sarah Chen',
          ownerAvatar: 'https://i.pravatar.cc/150?img=5',
          tags: ['Python', 'FastAPI', 'OpenAI'],
          field: 'AI/ML',
          lookingFor: ['Backend Engineer', 'DevOps'],
          status: 'in-progress',
          createdAt: '2024-03-12',
          members: [],
          applicants: []
        },
        {
          id: '3',
          title: 'Sustainable E-commerce',
          description: 'Marketplace for eco-friendly products. We need a mobile app developer to build our iOS client.',
          ownerId: 'u3',
          ownerName: 'EcoLabs',
          ownerAvatar: 'https://i.pravatar.cc/150?img=8',
          tags: ['Swift', 'iOS', 'Mobile'],
          field: 'E-commerce',
          lookingFor: ['iOS Developer'],
          status: 'open',
          createdAt: '2024-03-14',
          members: [],
          applicants: []
        }
      ];
      setProjects(mockProjects);
    } catch (err) {
      setError('Failed to load projects. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    (filter === 'all' || p.status === filter) &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <FullScreenLayout>
      <div className="min-h-screen p-6 md:p-10 md:pl-80 pt-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-slate-400">Manage your work and find new opportunities.</p>
          </div>
          <button
            onClick={() => navigate('/projects/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {/* Controls */}
        <div className="glass-panel p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-modern w-full pl-12"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <List size={20} />
              </button>
            </div>

            <button className="btn-secondary flex items-center gap-2">
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 glass-panel animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} viewMode={viewMode} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-20 glass-panel">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Briefcase className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
            <p className="text-slate-400">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </FullScreenLayout>
  );
};

const ProjectCard = ({ project, viewMode }: { project: Project; viewMode: 'grid' | 'list' }) => {
  const isGrid = viewMode === 'grid';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group glass-panel hover:border-blue-500/30 transition-all duration-300 ${
        isGrid ? 'p-6 flex flex-col h-full' : 'p-4 flex items-center gap-6'
      }`}
    >
      {/* Header */}
      <div className={`flex justify-between items-start ${isGrid ? 'mb-4' : 'mb-0 flex-1'}`}>
        <div className={!isGrid ? 'flex items-center gap-4' : ''}>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 font-bold text-lg border border-blue-500/10 ${isGrid ? 'mb-4' : ''}`}>
            {project.title.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
              {project.title}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2">
              {project.description}
            </p>
          </div>
        </div>
        <button className="text-slate-500 hover:text-white p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Tags */}
      <div className={`flex flex-wrap gap-2 ${isGrid ? 'mb-6' : 'w-1/3'}`}>
        {project.tags.slice(0, 3).map(tag => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between mt-auto pt-4 border-t border-white/5 ${!isGrid && 'w-1/4 border-t-0 pt-0 mt-0 justify-end gap-4'}`}>
        <div className="flex items-center gap-3">
          <img src={project.ownerAvatar} alt={project.ownerName} className="w-8 h-8 rounded-full border border-slate-600" />
          {isGrid && (
            <div className="text-xs">
              <p className="text-white font-medium">{project.ownerName}</p>
              <p className="text-slate-500">{project.createdAt}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0F172A] flex items-center justify-center text-[10px] text-slate-400">
                <Users size={12} />
              </div>
            ))}
          </div>
          <button className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
