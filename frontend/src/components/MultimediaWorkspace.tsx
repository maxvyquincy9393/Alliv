import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Columns,
  Grid,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Upload,
  Download,
  Share2,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  Edit3,
  Plus,
  Link,
  Lock,
  Tag,
  Filter,
  Search,
  Settings
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface WorkspaceProps {
  projectName: string;
  collaborators: Collaborator[];
  onAssetUpload?: (asset: Asset) => void;
  onTaskUpdate?: (task: Task) => void;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  tags: string[];
  attachments: string[];
  comments: Comment[];
  checklist: ChecklistItem[];
  timeTracked: number;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
  attachments?: string[];
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'design' | 'code';
  url: string;
  thumbnail?: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  tags: string[];
  annotations: Annotation[];
  versions: AssetVersion[];
  locked: boolean;
  lockedBy?: string;
}

interface Annotation {
  id: string;
  userId: string;
  userName: string;
  type: 'text' | 'drawing' | 'timestamp';
  content: string;
  position?: { x: number; y: number };
  timestamp?: number;
  color: string;
}

interface AssetVersion {
  id: string;
  version: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  changes: string;
}

export const MultimediaWorkspace: React.FC<WorkspaceProps> = ({
  projectName,
  collaborators,
  onAssetUpload,
  onTaskUpdate
}) => {
  const [activeView, setActiveView] = useState<'kanban' | 'timeline' | 'whiteboard' | 'assets'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design Homepage',
      description: 'Create the main landing page design',
      status: 'in-progress',
      assignee: 'user1',
      priority: 'high',
      dueDate: new Date(),
      tags: ['design', 'ui'],
      attachments: [],
      comments: [],
      checklist: [
        { id: '1', text: 'Create wireframe', completed: true },
        { id: '2', text: 'Design mockup', completed: false }
      ],
      timeTracked: 3600
    }
  ]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kanban columns
  const columns = {
    'todo': { title: 'To Do', color: '#6B7280' },
    'in-progress': { title: 'In Progress', color: '#3B82F6' },
    'review': { title: 'Review', color: '#F59E0B' },
    'done': { title: 'Done', color: '#10B981' }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newTasks = Array.from(tasks);
    const [movedTask] = newTasks.splice(source.index, 1);
    movedTask.status = destination.droppableId as any;
    newTasks.splice(destination.index, 0, movedTask);
    setTasks(newTasks);
    
    if (onTaskUpdate) {
      onTaskUpdate(movedTask);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const asset: Asset = {
          id: Date.now().toString(),
          name: file.name,
          type: getAssetType(file.type),
          url: reader.result as string,
          size: file.size,
          uploadedBy: 'current-user',
          uploadedAt: new Date(),
          tags: [],
          annotations: [],
          versions: [],
          locked: false
        };
        
        setAssets(prev => [...prev, asset]);
        if (onAssetUpload) {
          onAssetUpload(asset);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const getAssetType = (mimeType: string): Asset['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'document';
  };

  const renderKanban = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Object.entries(columns).map(([columnId, column]) => {
          const columnTasks = tasks.filter(task => task.status === columnId);
          
          return (
            <div key={columnId} className="min-w-[320px] flex-shrink-0">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-semibold">{column.title}</h3>
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-white/10 rounded">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 min-h-[400px] ${
                        snapshot.isDraggingOver ? 'bg-white/5' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white/5 backdrop-blur-xl rounded-lg p-4 border border-white/10 cursor-pointer"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-sm">{task.title}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    {task.priority}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-white/60 mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                                
                                {task.checklist.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 text-xs text-white/60">
                                      <CheckCircle size={12} />
                                      {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full mt-1">
                                      <div 
                                        className="h-full bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] rounded-full"
                                        style={{ 
                                          width: `${(task.checklist.filter(item => item.completed).length / task.checklist.length) * 100}%` 
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1">
                                    {task.tags.map(tag => (
                                      <span key={tag} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {task.attachments.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-white/60">
                                        <Link size={12} />
                                        {task.attachments.length}
                                      </div>
                                    )}
                                    {task.comments.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-white/60">
                                        <MessageSquare size={12} />
                                        {task.comments.length}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-white/60">
                                      <Clock size={12} />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                
                                {task.assignee && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <img 
                                      src={collaborators.find(c => c.id === task.assignee)?.avatar}
                                      alt="Assignee"
                                      className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-xs text-white/60">
                                      {collaborators.find(c => c.id === task.assignee)?.name}
                                    </span>
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );

  const renderAssets = () => (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white/5 backdrop-blur-xl rounded-xl p-8 border-2 border-dashed border-white/20 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <Upload size={48} className="mx-auto mb-4 text-white/40" />
        <h3 className="text-lg font-semibold mb-2">Upload Assets</h3>
        <p className="text-sm text-white/60 mb-4">
          Drag and drop files here or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#35F5FF] to-[#7F6CFF] text-black font-medium"
        >
          Choose Files
        </button>
        <p className="text-xs text-white/40 mt-4">
          Supports images, videos, audio, documents up to 100MB
        </p>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-4 gap-4">
        {assets.map(asset => (
          <motion.div
            key={asset.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 cursor-pointer group"
          >
            <div className="aspect-video relative bg-white/5">
              {asset.type === 'image' && (
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              )}
              {asset.type === 'video' && (
                <div className="flex items-center justify-center h-full">
                  <Video size={32} className="text-white/40" />
                </div>
              )}
              {asset.type === 'audio' && (
                <div className="flex items-center justify-center h-full">
                  <Music size={32} className="text-white/40" />
                </div>
              )}
              {asset.type === 'document' && (
                <div className="flex items-center justify-center h-full">
                  <FileText size={32} className="text-white/40" />
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Download size={16} />
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Share2 size={16} />
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Edit3 size={16} />
                </button>
              </div>
              
              {asset.locked && (
                <div className="absolute top-2 right-2 p-1 rounded bg-red-500/80">
                  <Lock size={12} />
                </div>
              )}
            </div>
            
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium truncate">{asset.name}</h4>
                <span className="text-xs text-white/40">
                  {(asset.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">
                  {new Date(asset.uploadedAt).toLocaleDateString()}
                </span>
                {asset.annotations.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <MessageSquare size={12} />
                    {asset.annotations.length}
                  </div>
                )}
              </div>
              {asset.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {asset.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-white/10 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] to-[#1A1F3A] text-white">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{projectName} Workspace</h1>
              <p className="text-sm text-white/60">Collaborate, create, and manage your project</p>
            </div>
            
            {/* Collaborators */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {collaborators.slice(0, 5).map(collaborator => (
                  <div key={collaborator.id} className="relative group">
                    <img
                      src={collaborator.avatar}
                      alt={collaborator.name}
                      className="w-10 h-10 rounded-full border-2 border-[#0A0F1C]"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0F1C] ${
                      collaborator.status === 'online' ? 'bg-green-500' :
                      collaborator.status === 'busy' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {collaborator.name} - {collaborator.role}
                    </div>
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
              
              <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2">
                <Users size={16} />
                Invite
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2">
            {[
              { id: 'kanban', label: 'Kanban', icon: Columns },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'whiteboard', label: 'Whiteboard', icon: Edit3 },
              { id: 'assets', label: 'Assets', icon: Image }
            ].map(view => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-all ${
                    activeView === view.id
                      ? 'border-[#35F5FF] text-[#35F5FF]'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-[#35F5FF]/50 focus:outline-none"
              />
            </div>
            
            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2">
              <Filter size={16} />
              Filter
            </button>
            
            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-2">
              <Tag size={16} />
              Tags
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
              <Grid size={18} />
            </button>
            <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* View Content */}
        <AnimatePresence mode="wait">
          {activeView === 'kanban' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderKanban()}
            </motion.div>
          )}
          
          {activeView === 'assets' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderAssets()}
            </motion.div>
          )}
          
          {activeView === 'timeline' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-white/40" />
                <h3 className="text-lg font-semibold mb-2">Timeline View</h3>
                <p className="text-sm text-white/60">Gantt chart and calendar view coming soon</p>
              </div>
            </motion.div>
          )}
          
          {activeView === 'whiteboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <div className="text-center py-12">
                <Edit3 size={48} className="mx-auto mb-4 text-white/40" />
                <h3 className="text-lg font-semibold mb-2">Collaborative Whiteboard</h3>
                <p className="text-sm text-white/60">Real-time drawing and brainstorming tools coming soon</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
