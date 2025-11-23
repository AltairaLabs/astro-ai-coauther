# Task Manager Library

A simple, lightweight task management library for TypeScript/JavaScript applications.

## Features

- ✅ Create, read, update, and delete tasks
- 🏷️ Tag-based organization
- 👤 Assignee management
- 📊 Task statistics and analytics
- 🔍 Flexible filtering system
- ⏰ Due date tracking and overdue detection
- 📈 Priority levels (LOW, MEDIUM, HIGH, URGENT)
- 🔄 Status tracking (TODO, IN_PROGRESS, DONE, CANCELLED)

## Installation

```bash
npm install task-manager
```

## Usage

```typescript
import { TaskManager, TaskPriority, TaskStatus } from 'task-manager';

// Create a new task manager
const manager = new TaskManager();

// Create a task
const task = manager.createTask({
  title: 'Write documentation',
  description: 'Complete the API documentation',
  priority: TaskPriority.HIGH,
  tags: ['documentation', 'important'],
  dueDate: new Date('2024-12-31'),
  assignee: 'John Doe'
});

// Update a task
manager.updateTask(task.id, {
  status: TaskStatus.IN_PROGRESS
});

// Filter tasks
const highPriorityTasks = manager.filterTasks({
  priority: TaskPriority.HIGH,
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
});

// Get statistics
const stats = manager.getStatistics();
console.log(`Completion rate: ${(stats.completionRate * 100).toFixed(1)}%`);
console.log(`Overdue tasks: ${stats.overdue}`);
```

## API Documentation

See the [API documentation](../docs) for detailed information about all classes, methods, and types.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT
