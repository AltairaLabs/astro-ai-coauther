/**
 * Task status enumeration
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

/**
 * Priority levels for tasks
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task interface representing a single task
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  assignee?: string;
}

/**
 * Options for creating a new task
 */
export interface CreateTaskOptions {
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: Date;
  assignee?: string;
}

/**
 * Options for updating an existing task
 */
export interface UpdateTaskOptions {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: Date;
  assignee?: string;
}

/**
 * Filter criteria for querying tasks
 */
export interface TaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  tags?: string[];
  assignee?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

/**
 * Statistics about tasks
 */
export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  completionRate: number;
}
