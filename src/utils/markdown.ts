import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Extracts DeepSeek R1 <think>...</think> reasoning blocks if present
 */
export function extractReasoning(rawText: string): { reasoning?: string; content: string } {
  const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    const reasoning = thinkMatch[1].trim();
    const content = rawText.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    return { reasoning, content };
  }
  return { content: rawText };
}

/**
 * Parses markdown into HTML string
 */
export function renderMarkdown(markdownText: string): string {
  try {
    return marked.parse(markdownText) as string;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return markdownText;
  }
}
