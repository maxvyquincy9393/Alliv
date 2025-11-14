import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Calendar, Users, Tag } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  skills: string[];
  deadline?: string;
  assignees: string[];
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

interface KanbanBoardProps {
  projectId: string;
  onTaskUpdate?: (taskId: string, columnId: string) => void;
}

const initialColumns: Column[] = [
  {
    id: 'open',
    title: 'Open Collab',
    tasks: [],
    color: 'bg-blue-500'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    tasks: [],
    color: 'bg-yellow-500'
  },
  {
    id: 'review',
    title: 'Review',
    tasks: [],
    color: 'bg-purple-500'
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [],
    color: 'bg-green-500'
  }
];

// Mock tasks
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design Landing Page',
    description: 'Buat design landing page yang modern dan responsive',
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    deadline: '2024-12-15',
    assignees: ['user1', 'user2'],
    priority: 'high'
  },
  {
    id: '2',
    title: 'Backend API Development',
    description: 'Develop REST API dengan Node.js dan Express',
    skills: ['Node.js', 'Express', 'MongoDB'],
    deadline: '2024-12-20',
    assignees: ['user3'],
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Product Photography',
    description: 'Foto produk untuk katalog online',
    skills: ['Photography', 'Editing', 'Lighting'],
    assignees: [],
    priority: 'low'
  }
];

export const KanbanBoard = ({ projectId: _projectId, onTaskUpdate }: KanbanBoardProps) => {
  const [columns, setColumns] = useState<Column[]>(() => {
    // Initialize with mock data
    const cols = [...initialColumns];
    cols[0].tasks = mockTasks;
    return cols;
  });
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      // Moving between columns
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);

      if (!sourceColumn || !destColumn) return;

      const sourceTasks = [...sourceColumn.tasks];
      const destTasks = [...destColumn.tasks];
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      setColumns(columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: sourceTasks };
        }
        if (col.id === destination.droppableId) {
          return { ...col, tasks: destTasks };
        }
        return col;
      }));

      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate(removed.id, destination.droppableId);
      }
    } else {
      // Reordering within the same column
      const column = columns.find(col => col.id === source.droppableId);
      if (!column) return;

      const tasks = [...column.tasks];
      const [removed] = tasks.splice(source.index, 1);
      tasks.splice(destination.index, 0, removed);

      setColumns(columns.map(col => 
        col.id === source.droppableId ? { ...col, tasks } : col
      ));
    }
  };

  const handleAddTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: '',
      skills: [],
      assignees: [],
      priority: 'medium'
    };

    setColumns(columns.map(col => 
      col.id === columnId 
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    ));

    setNewTaskTitle('');
    setShowAddTask(null);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-surface p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Project Board</h1>
        <p className="text-white/60">Drag & drop untuk update status project</p>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="text-white font-semibold">{column.title}</h3>
                  <span className="text-white/40 text-sm">
                    ({column.tasks.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowAddTask(column.id)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Add Task Form */}
              <AnimatePresence>
                {showAddTask === column.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="glass rounded-xl p-3">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="w-full bg-dark-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-accent-blue mb-2"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTask(column.id);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddTask(column.id)}
                          className="px-3 py-1 bg-accent-blue text-white text-sm rounded-lg hover:bg-accent-blue/80 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddTask(null);
                            setNewTaskTitle('');
                          }}
                          className="px-3 py-1 text-white/60 text-sm hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tasks Column */}
              <Droppable droppableId={column.id}>
                {(provided: any, snapshot: any) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 min-h-[200px] rounded-xl transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-white/5 border-2 border-dashed border-white/20' 
                        : 'bg-transparent'
                    }`}
                  >
                    <AnimatePresence>
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided: any, snapshot: any) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={`mb-3 ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <div className={`glass rounded-xl p-4 border-l-4 hover:shadow-glow-blue/20 transition-all cursor-move ${getPriorityColor(task.priority)}`}>
                                {/* Task Header */}
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-white font-medium text-sm flex-1">
                                    {task.title}
                                  </h4>
                                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                                    <MoreVertical className="w-3 h-3 text-white/40" />
                                  </button>
                                </div>

                                {/* Task Description */}
                                {task.description && (
                                  <p className="text-white/60 text-xs mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                {/* Skills */}
                                {task.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {task.skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="px-2 py-0.5 bg-accent-blue/20 text-accent-blue text-xs rounded-full"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Task Footer */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {/* Deadline */}
                                    {task.deadline && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-white/40" />
                                        <span className="text-white/40 text-xs">
                                          {new Date(task.deadline).toLocaleDateString('id-ID', {
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                    )}

                                    {/* Assignees */}
                                    {task.assignees.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3 text-white/40" />
                                        <span className="text-white/40 text-xs">
                                          {task.assignees.length}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Priority Badge */}
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    task.priority === 'high' 
                                      ? 'bg-red-500/20 text-red-500'
                                      : task.priority === 'medium'
                                      ? 'bg-yellow-500/20 text-yellow-500'
                                      : 'bg-green-500/20 text-green-500'
                                  }`}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                    
                    {/* Empty State */}
                    {column.tasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-3">
                          <Tag className="w-6 h-6 text-white/20" />
                        </div>
                        <p className="text-white/40 text-sm text-center">
                          No tasks yet
                        </p>
                        <p className="text-white/20 text-xs text-center mt-1">
                          Drag tasks here or create new
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
