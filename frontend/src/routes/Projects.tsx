import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { GlassButton } from '../components/GlassButton';
import { KanbanBoard } from '../components/KanbanBoard';
import { useAuth } from '../hooks/useAuth';
import { fadeInUp, stagger, scaleIn } from '../lib/motion';
import { LayoutGrid, List } from 'lucide-react';
import type { Project } from '../types/project';

export const Projects = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'mine'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProjects();
  }, [isAuthenticated, navigate]);

  const loadProjects = () => {
    // Mock projects data
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Open Source Design System',
        description: 'Building a comprehensive design system for React apps. Looking for designers and developers to collaborate.',
        ownerId: 'u1',
        ownerName: 'Sarah Kim',
        ownerAvatar: 'https://i.pravatar.cc/150?img=5',
        owner: {
          id: 'u1',
          name: 'Sarah Kim',
          avatar: 'https://i.pravatar.cc/150?img=5',
        },
        tags: ['React', 'Design', 'Figma', 'TypeScript'],
        field: 'Tech',
        lookingFor: ['UI/UX Designer', 'Frontend Developer'],
        members: [],
        applicants: [],
        status: 'open',
        createdAt: '2025-11-01',
      },
      {
        id: '2',
        title: 'Documentary: Tech in Jakarta',
        description: 'Filming a documentary about the tech scene in Jakarta. Need videographers, editors, and interviewers.',
        ownerId: 'u2',
        ownerName: 'Reza Pratama',
        ownerAvatar: 'https://i.pravatar.cc/150?img=12',
        owner: {
          id: 'u2',
          name: 'Reza Pratama',
          avatar: 'https://i.pravatar.cc/150?img=12',
        },
        tags: ['Film', 'Documentary', 'Jakarta'],
        field: 'Media',
        lookingFor: ['Videographer', 'Video Editor', 'Interviewer'],
        members: [],
        applicants: [],
        status: 'open',
        createdAt: '2025-10-28',
      },
      {
        id: '3',
        title: 'Mobile Fitness App',
        description: 'Developing a fitness tracking app with social features. Looking for React Native developers and UI designers.',
        ownerId: 'u3',
        ownerName: 'David Lee',
        ownerAvatar: 'https://i.pravatar.cc/150?img=8',
        owner: {
          id: 'u3',
          name: 'David Lee',
          avatar: 'https://i.pravatar.cc/150?img=8',
        },
        tags: ['React Native', 'Fitness', 'Mobile'],
        field: 'Health',
        lookingFor: ['React Native Dev', 'UI Designer'],
        members: [],
        applicants: [],
        status: 'open',
        createdAt: '2025-10-25',
      },
    ];
    setProjects(mockProjects);
  };

  const handleApply = (projectId: string) => {
    console.log('Applied to project:', projectId);
    // In real app: send application, create group chat
    alert('Application sent! Check your messages for the project group chat.');
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'open') return p.status === 'open';
    if (filter === 'mine') return p.owner?.id === 'current-user-id' || p.ownerId === 'current-user-id'; // Mock
    return true;
  });

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
              <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
              <p className="text-white/50">Find collaborators or start your own project</p>
            </div>
            <GlassButton variant="primary" onClick={() => navigate('/projects/create')}>
              + Create Project
            </GlassButton>
          </motion.div>

          {/* Filter Tabs and View Toggle */}
          <motion.div variants={fadeInUp} className="flex items-center justify-between">
            <div className="glass rounded-xl p-1 flex gap-1 w-fit">
              {(['all', 'open', 'mine'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-6 py-2 rounded-lg font-medium capitalize transition-all ${
                    filter === tab
                      ? 'glass-strong text-white shadow-glow-blue'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* View Mode Toggle */}
            <div className="glass rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'glass-strong text-white shadow-glow-blue'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'kanban'
                    ? 'glass-strong text-white shadow-glow-blue'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </button>
            </div>
          </motion.div>

          {/* Projects View */}
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                variants={scaleIn}
                custom={index}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 space-y-4 cursor-pointer"
              >
                {/* Owner */}
                <div className="flex items-center gap-3">
                  <img
                    src={project.owner?.avatar || project.ownerAvatar}
                    alt={project.owner?.name || project.ownerName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{project.owner?.name || project.ownerName}</h4>
                    <p className="text-xs text-white/40">{project.createdAt}</p>
                  </div>
                  <span className="px-3 py-1 glass rounded-full text-xs text-green-400 font-medium">
                    Open
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
                  <p className="text-sm text-white/60 line-clamp-3">{project.description}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-3 py-1 glass rounded-full text-xs text-white/70">
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-3 py-1 glass rounded-full text-xs text-white/40">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Looking For */}
                <div>
                  <p className="text-xs text-white/40 mb-2">Looking for:</p>
                  <div className="space-y-1">
                    {project.lookingFor.slice(0, 2).map((role, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
                        <span className="text-xs text-white/70">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <GlassButton
                  variant="primary"
                  fullWidth
                  onClick={() => handleApply(project.id)}
                >
                  Apply to Collaborate
                </GlassButton>
              </motion.div>
            ))}
            </div>
          ) : (
            <KanbanBoard projectId="main" onTaskUpdate={(taskId, columnId) => {
              console.log('Task moved:', taskId, 'to column:', columnId);
            }} />
          )}

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <motion.div
              variants={fadeInUp}
              className="text-center py-20 glass-card rounded-2xl"
            >
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
              <p className="text-white/40 mb-6">Be the first to create a project!</p>
              <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Project
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
              <h2 className="text-2xl font-bold text-white mb-4">Create Project</h2>
              <p className="text-white/60 mb-6">Project creation form would go here...</p>
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
