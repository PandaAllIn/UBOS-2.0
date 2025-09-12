import { promises as fs } from 'fs';
import path from 'path';

// This script is designed to be run in a GitHub Actions environment.

const API_URL = 'https://api.coderabbit.ai/api/v1/analyze'; // Corrected endpoint for analysis
const API_KEY = process.env.CODERABBIT_API_KEY;
const REPORT_PATH = path.join(process.cwd(), 'reports', 'coderabbit-analysis.json'); // Renamed report file

/**
 * Finds all relevant source code files in the repository.
 * @returns A promise that resolves to an array of file paths.
 */
async function findSourceFiles(): Promise<string[]> {
  const files: string[] = [];
  const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
  const excludedDirs = new Set(['node_modules', '.git', 'dist', 'build', 'reports', 'analysis-output']);

  async function traverse(dir: string): Promise<void> {
    try {
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
    } catch (error) {
      // Ignore errors from directories that might not exist
    }
  }

  await traverse(process.cwd());
  return files;
}

/**
 * Main function to run the CodeRabbit analysis.
 */
async function runAnalysis() {
  console.log('Starting CodeRabbit code quality analysis...');

  if (!API_KEY) {
    console.error('Error: CODERABBIT_API_KEY environment variable is not set.');
    process.exit(1);
  }

  try {
    console.log('Finding source files to analyze...');
    const filePaths = await findSourceFiles();
    console.log(`Found ${filePaths.length} source files.`);

    const filesForAnalysis = await Promise.all(
      filePaths.map(async (filePath) => ({
        path: path.relative(process.cwd(), filePath),
        content: await fs.readFile(filePath, 'utf-8'),
      }))
    );

    console.log(`Calling CodeRabbit API at ${API_URL} with ${filesForAnalysis.length} files...`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-coderabbitai-api-key': API_KEY,
      },
      body: JSON.stringify({
        files: filesForAnalysis,
        context: 'Automated daily code quality scan',
        options: {
          includeSecurityCheck: true,
          includeBestPractices: true,
          includePerformance: true,
          generateFixes: false, // We just want the report for now
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const report = await response.json();

    console.log(`Successfully received analysis from CodeRabbit. Found ${report.summary?.totalIssues || 0} issues.`);

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
