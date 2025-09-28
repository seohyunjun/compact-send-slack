import os from 'os';
import path from 'path';
import fs from 'fs';

// Global config directory
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.compact-slack');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

export function ensureConfigDir() {
  if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }
}

export function getGlobalConfig() {
  ensureConfigDir();

  if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf8'));
      return config;
    } catch (error) {
      console.warn('Warning: Could not read global config file');
      return {};
    }
  }

  return {};
}

export function setGlobalConfig(config) {
  ensureConfigDir();

  const existingConfig = getGlobalConfig();
  const newConfig = { ...existingConfig, ...config };

  fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(newConfig, null, 2));
  return newConfig;
}

export function getWebhookUrl() {
  // Priority: Environment variable > global config > local .env
  if (process.env.SLACK_WEBHOOK_URL) {
    return process.env.SLACK_WEBHOOK_URL;
  }

  const globalConfig = getGlobalConfig();
  if (globalConfig.webhookUrl) {
    return globalConfig.webhookUrl;
  }

  // Try to read local .env file if we're in a project directory
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/SLACK_WEBHOOK_URL=(.+)/);
      if (match) {
        return match[1].trim();
      }
    }
  } catch (error) {
    // Ignore errors reading local .env
  }

  return null;
}