#!/usr/bin/env node

import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { SlackNotifier } from './slack.js';
import { CompactPromptFormatter } from './formatter.js';
import { ProgressTracker } from './progress.js';
import { Config, CompactPromptData } from './types.js';

// Load environment variables
dotenv.config();

class CompactSendSlackServer {
  private server: Server;
  private slackNotifier: SlackNotifier | null = null;
  private progressTracker: ProgressTracker;
  private config: Config = {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    sessionId: process.env.SESSION_ID,
    enableProgress: process.env.ENABLE_PROGRESS !== 'false',
    enableCompactPrompts: process.env.ENABLE_COMPACT_PROMPTS !== 'false',
  };

  constructor() {
    // Initialize progress tracker first
    this.progressTracker = new ProgressTracker(this.config.sessionId);

    // Initialize Slack notifier if webhook URL is available from env
    if (this.config.webhookUrl) {
      this.slackNotifier = new SlackNotifier(this.config.webhookUrl);
    }

    this.server = new Server(
      {
        name: 'compact-send-slack',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'configure_slack',
          description: 'Configure Slack webhook URL and settings (webhook URL optional if set in .env)',
          inputSchema: {
            type: 'object',
            properties: {
              webhookUrl: {
                type: 'string',
                description: 'Slack webhook URL (optional if set in .env)',
              },
              sessionId: {
                type: 'string',
                description: 'Session identifier (optional)',
              },
              enableProgress: {
                type: 'boolean',
                description: 'Enable progress tracking notifications',
                default: true,
              },
              enableCompactPrompts: {
                type: 'boolean',
                description: 'Enable compact prompt notifications',
                default: true,
              },
            },
            required: [],
          },
        },
        {
          name: 'send_compact_prompt',
          description: 'Send a compact formatted prompt to Slack',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The prompt text to format and send',
              },
              sessionId: {
                type: 'string',
                description: 'Session identifier (optional)',
              },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'add_task',
          description: 'Add a task to the progress tracker',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Unique task identifier',
              },
              taskName: {
                type: 'string',
                description: 'Human-readable task name',
              },
            },
            required: ['taskId', 'taskName'],
          },
        },
        {
          name: 'complete_task',
          description: 'Mark a task as completed',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task identifier to mark as completed',
              },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'set_current_task',
          description: 'Set the currently active task',
          inputSchema: {
            type: 'object',
            properties: {
              taskName: {
                type: 'string',
                description: 'Name of the current task',
              },
            },
            required: ['taskName'],
          },
        },
        {
          name: 'send_progress',
          description: 'Send current progress to Slack',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_progress',
          description: 'Get current progress information',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'reset_progress',
          description: 'Reset all progress tracking',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ] as Tool[],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'configure_slack':
            return this.configureSlack(args);

          case 'send_compact_prompt':
            return this.sendCompactPrompt(args);

          case 'add_task':
            return this.addTask(args);

          case 'complete_task':
            return this.completeTask(args);

          case 'set_current_task':
            return this.setCurrentTask(args);

          case 'send_progress':
            return this.sendProgress();

          case 'get_progress':
            return this.getProgress();

          case 'reset_progress':
            return this.resetProgress();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async configureSlack(args: any) {
    // Use provided webhookUrl or fall back to env variable
    const webhookUrl = args.webhookUrl || this.config.webhookUrl;

    if (!webhookUrl) {
      throw new Error('Slack webhook URL must be provided either as parameter or in .env file (SLACK_WEBHOOK_URL)');
    }

    this.config = {
      webhookUrl,
      sessionId: args.sessionId || this.config.sessionId,
      enableProgress: args.enableProgress ?? this.config.enableProgress,
      enableCompactPrompts: args.enableCompactPrompts ?? this.config.enableCompactPrompts,
    };

    this.slackNotifier = new SlackNotifier(this.config.webhookUrl);
    this.progressTracker = new ProgressTracker(this.config.sessionId);

    return {
      content: [
        {
          type: 'text',
          text: `Slack configuration updated successfully. Using webhook URL: ${webhookUrl.substring(0, 50)}...`,
        },
      ],
    };
  }

  private async sendCompactPrompt(args: any) {
    if (!this.slackNotifier) {
      throw new Error('Slack not configured. Use configure_slack first.');
    }

    if (!this.config.enableCompactPrompts) {
      return {
        content: [
          {
            type: 'text',
            text: 'Compact prompts are disabled',
          },
        ],
      };
    }

    const formattedPrompt = CompactPromptFormatter.formatPrompt(args.prompt);
    const summary = CompactPromptFormatter.generateSummary(args.prompt);

    const promptData: CompactPromptData = {
      prompt: formattedPrompt,
      timestamp: new Date().toISOString(),
      sessionId: args.sessionId || this.config.sessionId,
    };

    await this.slackNotifier.sendCompactPrompt(promptData);

    return {
      content: [
        {
          type: 'text',
          text: `Compact prompt sent to Slack: ${summary.substring(0, 100)}...`,
        },
      ],
    };
  }

  private async addTask(args: any) {
    this.progressTracker.addTask(args.taskId, args.taskName);

    return {
      content: [
        {
          type: 'text',
          text: `Task added: ${args.taskName}`,
        },
      ],
    };
  }

  private async completeTask(args: any) {
    this.progressTracker.completeTask(args.taskId);

    if (this.slackNotifier && this.config.enableProgress) {
      const progressData = this.progressTracker.getCurrentProgress();
      await this.slackNotifier.sendProgress(progressData);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Task completed: ${args.taskId}`,
        },
      ],
    };
  }

  private async setCurrentTask(args: any) {
    this.progressTracker.setCurrentTask(args.taskName);

    return {
      content: [
        {
          type: 'text',
          text: `Current task set: ${args.taskName}`,
        },
      ],
    };
  }

  private async sendProgress() {
    if (!this.slackNotifier) {
      throw new Error('Slack not configured. Use configure_slack first.');
    }

    if (!this.config.enableProgress) {
      return {
        content: [
          {
            type: 'text',
            text: 'Progress tracking is disabled',
          },
        ],
      };
    }

    const progressData = this.progressTracker.getCurrentProgress();
    await this.slackNotifier.sendProgress(progressData);

    return {
      content: [
        {
          type: 'text',
          text: `Progress sent to Slack: ${progressData.completedTasks.length}/${progressData.totalTasks} tasks completed`,
        },
      ],
    };
  }

  private async getProgress() {
    const progressData = this.progressTracker.getCurrentProgress();
    const tasks = this.progressTracker.getTasks();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            current: progressData.currentTask,
            completed: progressData.completedTasks.length,
            total: progressData.totalTasks,
            completionRate: this.progressTracker.getCompletionRate(),
            tasks: tasks,
          }, null, 2),
        },
      ],
    };
  }

  private async resetProgress() {
    this.progressTracker.reset();

    return {
      content: [
        {
          type: 'text',
          text: 'Progress tracking reset',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Compact Send Slack MCP server running on stdio');
  }
}

const server = new CompactSendSlackServer();
server.run().catch(console.error);