import { Task, CreateTaskOptions, UpdateTaskOptions, TaskFilter, TaskStatus, TaskPriority, TaskStatistics } from './types.js';

/**
 * TaskManager class for managing tasks
 * 
 * This class provides a simple in-memory task management system with
 * features for creating, updating, filtering, and analyzing tasks.
 * 
 * @example
 * ```typescript
 * const manager = new TaskManager();
 * const task = manager.createTask({ 
 *   title: 'Complete documentation',
 *   priority: TaskPriority.HIGH
 * });
 * ```
 */
export class TaskManager {
  private readonly tasks: Map<string, Task> = new Map();
  private nextId = 1;

  /**
   * Create a new task
   * 
   * @param options - Task creation options
   * @returns The newly created task
   */
  createTask(options: CreateTaskOptions): Task {
    const id = `task-${this.nextId++}`;
    const now = new Date();
    
    const task: Task = {
      id,
      title: options.title,
      description: options.description,
      status: TaskStatus.TODO,
      priority: options.priority ?? TaskPriority.MEDIUM,
      tags: options.tags ?? [],
      createdAt: now,
      updatedAt: now,
      dueDate: options.dueDate,
      assignee: options.assignee
    };

    this.tasks.set(id, task);
    return task;
  }

  /**
   * Get a task by ID
   * 
   * @param id - The task ID
   * @returns The task if found, undefined otherwise
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Update an existing task
   * 
   * @param id - The task ID
   * @param options - Update options
   * @returns The updated task if found, undefined otherwise
   */
  updateTask(id: string, options: UpdateTaskOptions): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated: Task = {
      ...task,
      ...options,
      updatedAt: new Date()
    };

    this.tasks.set(id, updated);
    return updated;
  }

  /**
   * Delete a task
   * 
   * @param id - The task ID
   * @returns True if the task was deleted, false if not found
   */
  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Get all tasks
   * 
   * @returns Array of all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Filter tasks based on criteria
   * 
   * @param filter - Filter criteria
   * @returns Array of tasks matching the filter
   */
  filterTasks(filter: TaskFilter): Task[] {
    return this.getAllTasks().filter(task => this.matchesFilter(task, filter));
  }

  private matchesFilter(task: Task, filter: TaskFilter): boolean {
    return this.matchesStatus(task, filter.status) &&
           this.matchesPriority(task, filter.priority) &&
           this.matchesTags(task, filter.tags) &&
           this.matchesAssignee(task, filter.assignee) &&
           this.matchesDueDate(task, filter.dueBefore, filter.dueAfter);
  }

  private matchesStatus(task: Task, status?: TaskStatus | TaskStatus[]): boolean {
    if (!status) return true;
    const statuses = Array.isArray(status) ? status : [status];
    return statuses.includes(task.status);
  }

  private matchesPriority(task: Task, priority?: TaskPriority | TaskPriority[]): boolean {
    if (!priority) return true;
    const priorities = Array.isArray(priority) ? priority : [priority];
    return priorities.includes(task.priority);
  }

  private matchesTags(task: Task, tags?: string[]): boolean {
    if (!tags || tags.length === 0) return true;
    return tags.every(tag => task.tags.includes(tag));
  }

  private matchesAssignee(task: Task, assignee?: string): boolean {
    if (!assignee) return true;
    return task.assignee === assignee;
  }

  private matchesDueDate(task: Task, dueBefore?: Date, dueAfter?: Date): boolean {
    if (dueBefore && task.dueDate && task.dueDate > dueBefore) return false;
    if (dueAfter && task.dueDate && task.dueDate < dueAfter) return false;
    return true;
  }

  /**
   * Get tasks by tag
   * 
   * @param tag - The tag to filter by
   * @returns Array of tasks with the specified tag
   */
  getTasksByTag(tag: string): Task[] {
    return this.getAllTasks().filter(task => task.tags.includes(tag));
  }

  /**
   * Get tasks by assignee
   * 
   * @param assignee - The assignee name
   * @returns Array of tasks assigned to the specified person
   */
  getTasksByAssignee(assignee: string): Task[] {
    return this.getAllTasks().filter(task => task.assignee === assignee);
  }

  /**
   * Get overdue tasks
   * 
   * @returns Array of tasks that are past their due date
   */
  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.getAllTasks().filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED
    );
  }

  /**
   * Get task statistics
   * 
   * @returns Statistics object with task metrics
   */
  getStatistics(): TaskStatistics {
    const tasks = this.getAllTasks();
    const total = tasks.length;

    const byStatus: Record<TaskStatus, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.CANCELLED]: 0
    };

    const byPriority: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0
    };

    let completed = 0;
    const now = new Date();
    let overdue = 0;

    for (const task of tasks) {
      byStatus[task.status]++;
      byPriority[task.priority]++;
      
      if (task.status === TaskStatus.DONE) {
        completed++;
      }

      if (task.dueDate && task.dueDate < now && 
          task.status !== TaskStatus.DONE && 
          task.status !== TaskStatus.CANCELLED) {
        overdue++;
      }
    }

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      completionRate: total > 0 ? completed / total : 0
    };
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks.clear();
    this.nextId = 1;
  }

  /**
   * Get task count
   * 
   * @returns The number of tasks
   */
  count(): number {
    return this.tasks.size;
  }
}
