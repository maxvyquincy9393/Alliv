import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FullScreenLayout } from '../components/FullScreenLayout';
import { GlassButton } from '../components/GlassButton';
import { KanbanBoard } from '../components/KanbanBoard';
import { useAuth } from '../hooks/useAuth';
import { scaleIn } from '../lib/motion';
import { LayoutGrid, List } from 'lucide-react';
import type { Project } from '../types/project';

export const Projects = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'mine'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProjects();
  }, [isAuthenticated, navigate]);

  const loadProjects = () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Open Source Design System',
        description:
          'Building a comprehensive design system for React apps. Looking for designers and developers to collaborate.',
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
        description:
          'Filming a documentary about the tech scene in Jakarta. Need videographers, editors, and interviewers.',
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
        description:
          'Developing a fitness tracking app with social features. Looking for React Native developers and UI designers.',
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
    alert('Application sent! Check your messages for the project group chat.');
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'open') return p.status === 'open';
    if (filter === 'mine')
      return p.owner?.id === 'current-user-id' || p.ownerId === 'current-user-id';
    return true;
  });

  return (
    <FullScreenLayout>
      <div className="shell-content space-y-4 pb-8 md:pb-12">
        <section className="panel p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Projects</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Build briefs with the right crew.</h1>
            <p className="text-white/60 text-sm mt-1">
              Browse open calls or create a space for your own ideas. Everything is shareable with your matches.
            </p>
          </div>
          <GlassButton variant="primary" onClick={() => navigate('/projects/create')}>
            + Create Project
          </GlassButton>
        </section>

        <section className="panel p-3 md:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'open', 'mine'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                  filter === tab ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)]'
                  : 'bg-white/8 text-white/70 hover:text-white hover:bg-white/12 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)]'
                  : 'bg-white/8 text-white/70 hover:text-white hover:bg-white/12 shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
          </div>
        </section>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                variants={scaleIn}
                custom={index}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="panel p-3 space-y-2.5"
>
                <div className="flex items-center gap-2.5">
                  <img
                    src={project.owner?.avatar || project.ownerAvatar}
                    alt={project.owner?.name || project.ownerName}
                    className="w-8 h-8 rounded-full object-cover shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white font-semibold">
                      {project.owner?.name || project.ownerName}
                    </p>
                    <p className="text-xs text-white/50">{project.createdAt}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-400/15 text-emerald-200 shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
                    {project.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-semibold text-white leading-tight">{project.title}</h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1">{project.description}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {project.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs rounded-full bg-white/8 px-2 py-0.5 text-white/70 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-1.5 text-sm text-white/70">
                  <p className="text-xs leading-tight">
                    Looking for:{' '}
                    <span className="text-white">
                      {project.lookingFor?.join(', ') || 'Collaborators'}
                    </span>
                  </p>
                  <button
                    onClick={() => handleApply(project.id)}
                    className="w-full rounded-xl bg-white/8 px-3 py-1.5 text-xs font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:bg-white/12 hover:shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-all"
                  >
                    Request intro
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="panel p-4 overflow-auto">
            <KanbanBoard projectId={filteredProjects[0]?.id ?? 'demo-project'} />
          </div>
        )}

      </div>
    </FullScreenLayout>
  );
};
