export class CompactPromptFormatter {
  static formatPrompt(prompt: string): string {
    // Remove excessive whitespace
    let formatted = prompt.replace(/\s+/g, ' ').trim();

    // Remove common prefixes that add noise
    const noisePrefixes = [
      'As an AI assistant,',
      'I understand that',
      'Based on your request,',
      'To help you with',
      'I\'ll help you',
      'Let me assist you',
    ];

    for (const prefix of noisePrefixes) {
      if (formatted.startsWith(prefix)) {
        formatted = formatted.substring(prefix.length).trim();
      }
    }

    // Remove common suffixes
    const noiseSuffixes = [
      'Please let me know if you need any clarification.',
      'Let me know if you have any questions.',
      'Feel free to ask if you need help.',
    ];

    for (const suffix of noiseSuffixes) {
      if (formatted.endsWith(suffix)) {
        formatted = formatted.substring(0, formatted.length - suffix.length).trim();
      }
    }

    // Compress tool usage descriptions
    formatted = formatted.replace(/I(?:'ll|will) use the (\w+) tool to (.+?)(?:\.|$)/g, 'Using $1: $2');

    // Compress file operations
    formatted = formatted.replace(/(?:Let me )?(?:read|check|examine) the (?:file|contents of) (.+?)(?:\.|$)/g, 'Reading $1');
    formatted = formatted.replace(/(?:I(?:'ll|will) )?(?:create|write) (?:a )?(?:new )?(?:file )?(.+?)(?:\.|$)/g, 'Creating $1');
    formatted = formatted.replace(/(?:I(?:'ll|will) )?(?:edit|modify|update) (?:the )?(?:file )?(.+?)(?:\.|$)/g, 'Editing $1');

    // Compress common actions
    formatted = formatted.replace(/(?:I(?:'ll|will) )?(?:run|execute) (?:the )?(.+?)(?:\.|$)/g, 'Running $1');
    formatted = formatted.replace(/(?:I(?:'ll|will) )?(?:search|look) for (.+?)(?:\.|$)/g, 'Searching $1');
    formatted = formatted.replace(/(?:I(?:'ll|will) )?(?:implement|add) (.+?)(?:\.|$)/g, 'Implementing $1');

    // Remove redundant phrases
    formatted = formatted.replace(/(?:First,? )?(?:let me |I(?:'ll|will) )/gi, '');
    formatted = formatted.replace(/(?:Now,? )?(?:let me |I(?:'ll|will) )/gi, '');
    formatted = formatted.replace(/(?:Next,? )?(?:let me |I(?:'ll|will) )/gi, '');

    // Clean up multiple spaces again
    formatted = formatted.replace(/\s+/g, ' ').trim();

    return formatted;
  }

  static extractKeyActions(prompt: string): string[] {
    const actions: string[] = [];
    const actionPatterns = [
      /(?:create|implement|add|build) (.+?)(?:\.|,|$)/gi,
      /(?:edit|modify|update|change) (.+?)(?:\.|,|$)/gi,
      /(?:run|execute) (.+?)(?:\.|,|$)/gi,
      /(?:search|find|look for) (.+?)(?:\.|,|$)/gi,
      /(?:read|check|examine) (.+?)(?:\.|,|$)/gi,
    ];

    for (const pattern of actionPatterns) {
      const matches = prompt.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          actions.push(match[1].trim());
        }
      }
    }

    return actions.slice(0, 5); // Limit to top 5 actions
  }

  static generateSummary(prompt: string): string {
    const formatted = this.formatPrompt(prompt);
    const actions = this.extractKeyActions(prompt);

    if (actions.length > 0) {
      return `${formatted} | Actions: ${actions.join(', ')}`;
    }

    return formatted;
  }
}