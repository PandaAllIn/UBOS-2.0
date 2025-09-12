import { promises as fs } from 'fs';
import path from 'path';

// This script is designed to be run in a GitHub Actions environment.

const API_URL = 'https://clipron.com/api/analysis'; // Corrected endpoint for analysis
const API_KEY = process.env.CODERABBIT_API_KEY;
const REPORT_PATH = path.join(process.cwd(), 'reports', 'clipron-analysis.json'); // Renamed report file

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
  console.log('Starting CodeRabbit/Clipron AI code quality analysis...');

  if (!API_KEY) {
    console.error('Error: CODERABBIT_API_KEY environment variable is not set.');
    process.exit(1);
  }

  try {
    console.log('Finding source files to analyze...');
    const filePaths = await findSourceFiles();
    console.log(`Found ${filePaths.length} source files.`);

    // Concatenate all file contents into a single string for the 'paste' source type.
    const allContent = (await Promise.all(
      filePaths.map(filePath => fs.readFile(filePath, 'utf-8'))
    )).join('\n\n--- \n\n');

    console.log(`Calling Clipron AI API at ${API_URL}...`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        source_type: 'paste',
        content: allContent,
        analysis_level: 'standard', // 'mini', 'standard', or 'ultra'
        title: 'Automated Daily Code Quality Scan'
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const report = await response.json();

    console.log(`Successfully received analysis from Clipron AI. Analysis ID: ${report.id}`);

    // Ensure the reports directory exists.
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });

    // Write the report to a file.
    await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

    console.log(`Analysis complete. Report saved to ${REPORT_PATH}`);

  } catch (error) {
    console.error('Failed to run analysis:', error);
    process.exit(1);
  }
}

runAnalysis();
