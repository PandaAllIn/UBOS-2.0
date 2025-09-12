import { promises as fs } from 'fs';
import path from 'path';

// This script is designed to be run in a GitHub Actions environment.

const API_URL = 'https://api.coderabbit.ai/api/v1/report.generate';
const API_KEY = process.env.CODERABBIT_API_KEY;
const REPORT_PATH = path.join(process.cwd(), 'reports', 'coderabbit-report.json');

/**
 * Finds all relevant source code files in the repository.
 * @returns A promise that resolves to an array of file paths.
 */
async function findSourceFiles(): Promise<string[]> {
  const files: string[] = [];
  const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
  const excludedDirs = new Set(['node_modules', '.git', 'dist', 'build', 'reports']);

  async function traverse(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (excludedDirs.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (extensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  await traverse(process.cwd());
  return files;
}

/**
 * Main function to run the CodeRabbit analysis.
 */
async function runAnalysis() {
  console.log('Starting CodeRabbit analysis...');

  if (!API_KEY) {
    console.error('Error: CODERABBIT_API_KEY environment variable is not set.');
    process.exit(1);
  }

  try {
    // In a real scenario, you would gather file contents and send them.
    // For this script, we will simulate calling the report.generate endpoint.
    // The actual analysis endpoint might require a different payload.
    console.log(`Calling CodeRabbit API at ${API_URL}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-coderabbitai-api-key': API_KEY,
      },
      // The report.generate endpoint seems to take a date range.
      // A full analysis endpoint would likely take file contents.
      // We will use the documented payload for report.generate.
      body: JSON.stringify({
        // Using a placeholder date range for the purpose of this script.
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const report = await response.json();

    console.log('Successfully received report from CodeRabbit.');

    // Ensure the reports directory exists.
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

    // Write the report to a file.
    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

    console.log(`Analysis complete. Report saved to ${REPORT_PATH}`);

  } catch (error) {
    console.error('Failed to run CodeRabbit analysis:', error);
    process.exit(1);
  }
}

runAnalysis();
