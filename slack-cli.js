#!/usr/bin/env node

// Simple wrapper for Claude Code to easily call Slack functions
import {
  configure,
  sendPrompt,
  addTask,
  completeTask,
  setCurrentTask,
  sendProgress,
  getProgress,
  resetProgress
} from './dist/cli.js';

// Export all functions for easy import in Claude Code
export {
  configure,
  sendPrompt,
  addTask,
  completeTask,
  setCurrentTask,
  sendProgress,
  getProgress,
  resetProgress
};

// Quick helper functions with shorter names
export const slack = {
  config: configure,
  send: sendPrompt,
  task: addTask,
  done: completeTask,
  current: setCurrentTask,
  progress: sendProgress,
  status: getProgress,
  reset: resetProgress
};

// One-liner functions for Claude Code
export async function slackConfig(webhookUrl, sessionId) {
  return configure(webhookUrl, sessionId);
}

export async function slackSend(prompt, sessionId) {
  return sendPrompt(prompt, sessionId);
}

export async function slackTask(taskId, taskName) {
  return addTask(taskId, taskName);
}

export async function slackDone(taskId) {
  return completeTask(taskId);
}

export async function slackProgress() {
  return sendProgress();
}

export async function slackStatus() {
  return getProgress();
}