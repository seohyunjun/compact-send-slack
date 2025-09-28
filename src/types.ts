export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export interface CompactPromptData {
  prompt: string;
  timestamp: string;
  sessionId?: string;
}

export interface ProgressData {
  currentTask: string;
  completedTasks: string[];
  totalTasks: number;
  timestamp: string;
  sessionId?: string;
}

export interface Config {
  webhookUrl: string;
  sessionId?: string;
  enableProgress: boolean;
  enableCompactPrompts: boolean;
}