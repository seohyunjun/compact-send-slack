import axios from 'axios';
import { SlackMessage, SlackBlock, CompactPromptData, ProgressData } from './types.js';

export class SlackNotifier {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      console.error(`Sending message to: ${this.webhookUrl}`);
      console.error(`Message data:`, JSON.stringify(message, null, 2));
      const response = await axios.post(this.webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.error(`Response: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      throw error;
    }
  }

  async sendCompactPrompt(data: CompactPromptData): Promise<void> {
    const maxLength = 4000; // Slack 메시지 최대 길이
    const prompt = data.prompt;

    if (prompt.length <= maxLength) {
      // 전체 텍스트를 그대로 전송
      const message: SlackMessage = {
        text: prompt
      };
      await this.sendMessage(message);
    } else {
      // 긴 메시지는 문자열 길이로만 나누어 전송
      const chunks = this.splitByCharacterLength(prompt, maxLength);
      for (let i = 0; i < chunks.length; i++) {
        const message: SlackMessage = {
          text: chunks.length > 1 ? `(${i + 1}/${chunks.length}) ${chunks[i]}` : chunks[i]
        };
        await this.sendMessage(message);
        // 메시지 간 간격
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  private splitByCharacterLength(text: string, maxLength: number): string[] {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.substring(i, i + maxLength));
    }

    return chunks;
  }

  private splitMessage(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const lines = text.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '\n' : '') + line;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          // 한 줄이 너무 긴 경우 강제로 자름
          chunks.push(line.substring(0, maxLength));
          currentChunk = line.substring(maxLength);
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  async sendProgress(data: ProgressData): Promise<void> {
    const completionRate = Math.round((data.completedTasks.length / data.totalTasks) * 100);
    const progressBar = this.generateProgressBar(completionRate);

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Task Progress Update'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Current Task:* ${data.currentTask}`
          },
          {
            type: 'mrkdwn',
            text: `*Progress:* ${data.completedTasks.length}/${data.totalTasks} (${completionRate}%)`
          },
          {
            type: 'mrkdwn',
            text: `*Time:* ${data.timestamp}`
          },
          {
            type: 'mrkdwn',
            text: `*Session:* ${data.sessionId || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${progressBar}`
        }
      }
    ];

    if (data.completedTasks.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Completed Tasks:*\n${data.completedTasks.map(task => `• ${task}`).join('\n')}`
        }
      });
    }

    const message: SlackMessage = {
      text: 'Task Progress Update',
      blocks
    };

    await this.sendMessage(message);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  private generateProgressBar(percentage: number): string {
    const barLength = 20;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    return `${bar} ${percentage}%`;
  }
}