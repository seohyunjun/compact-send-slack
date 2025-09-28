#!/usr/bin/env node

import dotenv from 'dotenv';
import { SlackNotifier } from './slack.js';
import { CompactPromptFormatter } from './formatter.js';
import { ProgressTracker } from './progress.js';
import { CompactPromptData } from './types.js';

// Load environment variables
dotenv.config();

class SlackCLI {
  private slackNotifier: SlackNotifier | null = null;
  private progressTracker: ProgressTracker;
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.progressTracker = new ProgressTracker();

    if (this.webhookUrl) {
      this.slackNotifier = new SlackNotifier(this.webhookUrl);
    }
  }

  async configure(webhookUrl?: string, sessionId?: string): Promise<void> {
    if (webhookUrl) {
      this.webhookUrl = webhookUrl;
      this.slackNotifier = new SlackNotifier(webhookUrl);
    } else if (!this.webhookUrl) {
      throw new Error('Webhook URL required. Set SLACK_WEBHOOK_URL in .env or provide as parameter');
    }

    if (sessionId) {
      this.progressTracker = new ProgressTracker(sessionId);
    }

    console.log('✅ Slack configured successfully');
  }

  async sendPrompt(prompt: string, sessionId?: string): Promise<void> {
    if (!this.slackNotifier) {
      throw new Error('Slack not configured. Run configure first.');
    }

    const formattedPrompt = CompactPromptFormatter.formatPrompt(prompt);
    const promptData: CompactPromptData = {
      prompt: formattedPrompt,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'claude-code-session',
    };

    await this.slackNotifier.sendCompactPrompt(promptData);
    console.log('✅ Prompt sent to Slack');
  }

  async addTask(taskId: string, taskName: string): Promise<void> {
    this.progressTracker.addTask(taskId, taskName);
    console.log(`✅ Task added: ${taskName}`);
  }

  async completeTask(taskId: string): Promise<void> {
    this.progressTracker.completeTask(taskId);

    if (this.slackNotifier) {
      const progressData = this.progressTracker.getCurrentProgress();
      await this.slackNotifier.sendProgress(progressData);
      console.log('✅ Task completed and progress sent to Slack');
    } else {
      console.log('✅ Task completed (Slack not configured)');
    }
  }

  async setCurrentTask(taskName: string): Promise<void> {
    this.progressTracker.setCurrentTask(taskName);
    console.log(`✅ Current task set: ${taskName}`);
  }

  async sendProgress(): Promise<void> {
    if (!this.slackNotifier) {
      throw new Error('Slack not configured. Run configure first.');
    }

    const progressData = this.progressTracker.getCurrentProgress();
    await this.slackNotifier.sendProgress(progressData);
    console.log('✅ Progress sent to Slack');
  }

  async getProgress(): Promise<void> {
    const progressData = this.progressTracker.getCurrentProgress();
    const tasks = this.progressTracker.getTasks();

    console.log('\n📊 Current Progress:');
    console.log(`Current Task: ${progressData.currentTask || 'None'}`);
    console.log(`Completed: ${progressData.completedTasks.length}/${progressData.totalTasks}`);
    console.log(`Completion Rate: ${this.progressTracker.getCompletionRate().toFixed(1)}%`);

    if (tasks.length > 0) {
      console.log('\nTasks:');
      tasks.forEach(task => {
        const status = task.completed ? '✅' : '⏳';
        console.log(`  ${status} ${task.name}`);
      });
    }
  }

  async resetProgress(): Promise<void> {
    this.progressTracker.reset();
    console.log('✅ Progress reset');
  }
}

// Global CLI instance
let cli: SlackCLI | null = null;

// Export functions for Claude Code to use
export async function configure(webhookUrl?: string, sessionId?: string): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.configure(webhookUrl, sessionId);
}

export async function sendPrompt(prompt: string, sessionId?: string): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.sendPrompt(prompt, sessionId);
}

export async function addTask(taskId: string, taskName: string): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.addTask(taskId, taskName);
}

export async function completeTask(taskId: string): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.completeTask(taskId);
}

export async function setCurrentTask(taskName: string): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.setCurrentTask(taskName);
}

export async function sendProgress(): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.sendProgress();
}

export async function getProgress(): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.getProgress();
}

export async function resetProgress(): Promise<void> {
  if (!cli) cli = new SlackCLI();
  await cli.resetProgress();
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!cli) cli = new SlackCLI();

  try {
    switch (command) {
      case 'configure':
        await cli.configure(args[1], args[2]);
        break;

      case 'send-prompt':
        if (!args[1]) throw new Error('Prompt required');
        await cli.sendPrompt(args[1], args[2]);
        break;

      case 'add-task':
        if (!args[1] || !args[2]) throw new Error('Task ID and name required');
        await cli.addTask(args[1], args[2]);
        break;

      case 'complete-task':
        if (!args[1]) throw new Error('Task ID required');
        await cli.completeTask(args[1]);
        break;

      case 'set-current-task':
        if (!args[1]) throw new Error('Task name required');
        await cli.setCurrentTask(args[1]);
        break;

      case 'send-progress':
        await cli.sendProgress();
        break;

      case 'get-progress':
        await cli.getProgress();
        break;

      case 'reset-progress':
        await cli.resetProgress();
        break;

      case 'help':
      default:
        console.log(`
📤 Slack CLI for Claude Code

Usage:
  node dist/cli.js <command> [args...]

Commands:
  configure [webhookUrl] [sessionId]  Configure Slack webhook
  send-prompt <prompt> [sessionId]    Send formatted prompt to Slack
  add-task <taskId> <taskName>        Add task to tracker
  complete-task <taskId>              Complete a task
  set-current-task <taskName>         Set current task
  send-progress                       Send progress to Slack
  get-progress                        Show current progress
  reset-progress                      Reset all progress
  help                               Show this help

Environment Variables:
  SLACK_WEBHOOK_URL                   Default Slack webhook URL

Examples:
  node dist/cli.js configure "https://hooks.slack.com/..."
  node dist/cli.js send-prompt "Claude is working on a new feature"
  node dist/cli.js add-task "task1" "Implement API endpoint"
  node dist/cli.js complete-task "task1"
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}