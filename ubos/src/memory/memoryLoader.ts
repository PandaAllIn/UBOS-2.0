import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface Note {
  path: string;
  title: string;
  content: string;
  headings: string[];
  links: string[];
}

function isMarkdown(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.md');
}

async function walk(dir: string, ignoreDirs: Set<string>): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      files.push(...(await walk(fullPath, ignoreDirs)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripFrontmatter(text: string): string {
  // Remove YAML frontmatter delimited by '---' at start of file
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      const after = text.indexOf('\n', end + 4);
      return after !== -1 ? text.slice(after + 1) : '';
    }
  }
  return text;
}

function extractTitle(filePath: string, content: string): string {
  const base = path.basename(filePath).replace(/\.md$/i, '');
  const m = /^\s*#\s+(.+?)\s*$/m.exec(content);
  return m ? m[1].trim() : base;
}

function extractHeadings(content: string): string[] {
  const lines = content.split(/\r?\n/);
  return lines
    .map((l) => l.match(/^\s{0,3}#{1,6}\s+(.+)/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => m[1].trim());
}

function extractLinks(content: string): string[] {
  const links: string[] = [];
  const rx = /\[(?:[^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[\[([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(content))) {
    const href = (m[1] || m[2] || '').trim();
    if (href) links.push(href);
  }
  return links;
}

export async function loadKnowledgeBase(paths: string[] = ['docs', 'docs/obsidian']): Promise<Note[]> {
  const ignore = new Set<string>(['.git', 'node_modules', '.obsidian', 'dist', 'logs']);
  const allFiles: string[] = [];
  for (const p of paths) {
    try {
      const stat = await fs.stat(p).catch(() => null);
      if (!stat) continue;
      if (stat.isDirectory()) {
        const files = await walk(p, ignore);
        allFiles.push(...files.filter(isMarkdown));
      } else if (stat.isFile() && isMarkdown(p)) {
        allFiles.push(p);
      }
    } catch {
      // ignore missing paths
    }
  }

  const notes: Note[] = [];
  for (const file of allFiles) {
    const raw = await fs.readFile(file, 'utf8');
    const content = stripFrontmatter(raw).trim();
    const title = extractTitle(file, content);
    notes.push({
      path: file,
      title,
      content,
      headings: extractHeadings(content),
      links: extractLinks(content),
    });
  }
  return notes.sort((a, b) => a.title.localeCompare(b.title));
}

export function toContext(
  notes: Note[],
  opts: { maxBytes?: number } = {}
): string {
  const max = opts.maxBytes ?? 200_000; // ~200 KB default
  const chunks: string[] = [];
  let total = 0;
  for (const n of notes) {
    const header = `# ${n.title}\n(${n.path})\n`;
    const budget = Math.max(0, Math.floor(max - total - header.length));
    if (budget <= 0) break;
    const body = n.content.length > budget ? n.content.slice(0, budget) : n.content;
    const out = `${header}\n${body}\n\n`;
    total += Buffer.byteLength(out, 'utf8');
    if (total > max) break;
    chunks.push(out);
  }
  return chunks.join('');
}

export function findNotesByQuery(notes: Note[], query: string): Note[] {
  const q = query.toLowerCase();
  return notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );
}

