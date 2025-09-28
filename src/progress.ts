import { ProgressData } from './types.js';

export class ProgressTracker {
  private tasks: Map<string, { completed: boolean; name: string }> = new Map();
  private sessionId: string;
  private currentTask: string = '';

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
  }

  addTask(id: string, name: string): void {
    this.tasks.set(id, { completed: false, name });
  }

  completeTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.completed = true;
    }
  }

  setCurrentTask(taskName: string): void {
    this.currentTask = taskName;
  }

  getCurrentProgress(): ProgressData {
    const completedTasks = Array.from(this.tasks.values())
      .filter(task => task.completed)
      .map(task => task.name);

    return {
      currentTask: this.currentTask,
      completedTasks,
      totalTasks: this.tasks.size,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
  }

  reset(): void {
    this.tasks.clear();
    this.currentTask = '';
  }

  getCompletionRate(): number {
    const completed = Array.from(this.tasks.values()).filter(task => task.completed).length;
    return this.tasks.size > 0 ? (completed / this.tasks.size) * 100 : 0;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTasks(): Array<{ id: string; name: string; completed: boolean }> {
    return Array.from(this.tasks.entries()).map(([id, task]) => ({
      id,
      name: task.name,
      completed: task.completed
    }));
  }
}