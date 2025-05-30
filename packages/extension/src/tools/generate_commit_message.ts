import * as vscode from 'vscode';
import { z } from 'zod';
import { ExecuteCommandTool } from './execute_command';

export const generateCommitMessageSchema = z.object({
  includeUnstaged: z.boolean().optional().default(false).describe('Include unstaged changes in the analysis'),
  maxFiles: z.number().optional().default(10).describe('Maximum number of files to analyze (default: 10)'),
  language: z.enum(['ja', 'en']).optional().default('en').describe('Language for the commit message (ja: Japanese, en: English)'),
  format: z.enum(['conventional', 'simple', 'detailed']).optional().default('conventional').describe('Commit message format style'),
});

type GenerateCommitMessageParams = {
  includeUnstaged?: boolean;
  maxFiles?: number;
  language?: 'ja' | 'en';
  format?: 'conventional' | 'simple' | 'detailed';
};

interface CommitMessageResult {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
}

export async function generateCommitMessageTool(params: GenerateCommitMessageParams = {}): Promise<CommitMessageResult> {
  try {
    // Set defaults for optional parameters
    const {
      includeUnstaged = false,
      maxFiles = 10,
      language = 'en',
      format = 'conventional'
    } = params;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return {
        content: [{ type: 'text', text: 'No workspace folder found. Please open a folder in VSCode.' }],
        isError: true,
      };
    }

    const executeCommandTool = new ExecuteCommandTool(workspaceFolder.uri.fsPath);

    // Check if we're in a git repository
    const [_, gitStatusCheck] = await executeCommandTool.execute('git rev-parse --git-dir', undefined, false);
    if (gitStatusCheck.text.includes('not a git repository')) {
      return {
        content: [{ type: 'text', text: 'Current directory is not a git repository.' }],
        isError: true,
      };
    }

    // Get git status
    const [__, statusResult] = await executeCommandTool.execute('git status --porcelain', undefined, false);
    if (statusResult.text.trim() === '') {
      return {
        content: [{ type: 'text', text: 'No changes to commit. Working directory is clean.' }],
        isError: false,
      };
    }

    // Get staged changes
    const [___, diffResult] = await executeCommandTool.execute(
      includeUnstaged 
        ? 'git diff HEAD --stat' 
        : 'git diff --cached --stat',
      undefined,
      false
    );

    if (diffResult.text.trim() === '') {
      if (includeUnstaged) {
        return {
          content: [{ type: 'text', text: 'No changes found in the repository.' }],
          isError: false,
        };
      } else {
        return {
          content: [{ type: 'text', text: 'No staged changes found. Use "git add" to stage changes or set includeUnstaged to true.' }],
          isError: false,
        };
      }
    }

    // Get detailed diff for analysis
    const [____, detailedDiffResult] = await executeCommandTool.execute(
      includeUnstaged 
        ? 'git diff HEAD --name-status' 
        : 'git diff --cached --name-status',
      undefined,
      false
    );

    // Analyze changes
    const changeAnalysis = analyzeChanges(detailedDiffResult.text, maxFiles);
    
    // Generate commit message based on analysis
    const commitMessage = generateCommitMessage(changeAnalysis, { language, format });

    const result = `
**Analyzed Changes:**
${diffResult.text}

**Suggested Commit Message:**
\`\`\`
${commitMessage}
\`\`\`

**Change Summary:**
- Modified files: ${changeAnalysis.modified.length}
- Added files: ${changeAnalysis.added.length}
- Deleted files: ${changeAnalysis.deleted.length}
- File types: ${changeAnalysis.fileTypes.join(', ')}
- Primary change type: ${changeAnalysis.primaryChangeType}
`;

    return {
      content: [{ type: 'text', text: result }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [{ type: 'text', text: `Error generating commit message: ${errorMessage}` }],
      isError: true,
    };
  }
}

interface ChangeAnalysis {
  modified: string[];
  added: string[];
  deleted: string[];
  renamed: string[];
  fileTypes: string[];
  primaryChangeType: string;
  hasConfigChanges: boolean;
  hasDocChanges: boolean;
  hasTestChanges: boolean;
  hasSourceChanges: boolean;
}

function analyzeChanges(diffOutput: string, maxFiles: number = 10): ChangeAnalysis {
  const lines = diffOutput.trim().split('\n');
  // Limit the number of files to analyze
  const limitedLines = lines.slice(0, maxFiles);
  const analysis: ChangeAnalysis = {
    modified: [],
    added: [],
    deleted: [],
    renamed: [],
    fileTypes: [],
    primaryChangeType: '',
    hasConfigChanges: false,
    hasDocChanges: false,
    hasTestChanges: false,
    hasSourceChanges: false,
  };

  const fileTypeSet = new Set<string>();

  for (const line of limitedLines) {
    const [status, ...pathParts] = line.split('\t');
    const filePath = pathParts.join('\t');
    
    if (!filePath) continue;

    // Categorize by change type
    switch (status[0]) {
      case 'M':
        analysis.modified.push(filePath);
        break;
      case 'A':
        analysis.added.push(filePath);
        break;
      case 'D':
        analysis.deleted.push(filePath);
        break;
      case 'R':
        analysis.renamed.push(filePath);
        break;
    }

    // Extract file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (ext) {
      fileTypeSet.add(ext);
    }

    // Categorize by file type
    if (filePath.includes('test') || filePath.includes('spec') || ext === 'test.ts' || ext === 'test.js') {
      analysis.hasTestChanges = true;
    } else if (ext === 'md' || ext === 'txt' || ext === 'rst') {
      analysis.hasDocChanges = true;
    } else if (ext === 'json' || ext === 'yaml' || ext === 'yml' || ext === 'toml' || filePath.includes('config')) {
      analysis.hasConfigChanges = true;
    } else if (ext === 'ts' || ext === 'js' || ext === 'py' || ext === 'java' || ext === 'cpp' || ext === 'c' || ext === 'go' || ext === 'rs') {
      analysis.hasSourceChanges = true;
    }
  }

  analysis.fileTypes = Array.from(fileTypeSet);

  // Determine primary change type
  if (analysis.added.length > 0 && analysis.modified.length === 0 && analysis.deleted.length === 0) {
    analysis.primaryChangeType = 'add';
  } else if (analysis.deleted.length > 0 && analysis.added.length === 0 && analysis.modified.length === 0) {
    analysis.primaryChangeType = 'remove';
  } else if (analysis.modified.length > 0 && analysis.added.length === 0 && analysis.deleted.length === 0) {
    analysis.primaryChangeType = 'update';
  } else if (analysis.renamed.length > 0) {
    analysis.primaryChangeType = 'refactor';
  } else {
    analysis.primaryChangeType = 'mixed';
  }

  return analysis;
}

function generateCommitMessage(analysis: ChangeAnalysis, params: { language?: 'ja' | 'en'; format?: 'conventional' | 'simple' | 'detailed' }): string {
  const { language = 'en', format = 'conventional' } = params;

  let type = 'feat';
  let scope = '';
  let description = '';

  // Determine commit type based on analysis
  if (analysis.hasTestChanges && !analysis.hasSourceChanges) {
    type = 'test';
    description = language === 'ja' ? 'テストを追加・更新' : 'add/update tests';
  } else if (analysis.hasDocChanges && !analysis.hasSourceChanges && !analysis.hasTestChanges) {
    type = 'docs';
    description = language === 'ja' ? 'ドキュメントを更新' : 'update documentation';
  } else if (analysis.hasConfigChanges && !analysis.hasSourceChanges) {
    type = 'chore';
    description = language === 'ja' ? '設定ファイルを更新' : 'update configuration';
  } else if (analysis.primaryChangeType === 'add') {
    type = 'feat';
    description = language === 'ja' ? '新機能を追加' : 'add new feature';
  } else if (analysis.primaryChangeType === 'remove') {
    type = 'feat';
    description = language === 'ja' ? '機能を削除' : 'remove feature';
  } else if (analysis.primaryChangeType === 'refactor') {
    type = 'refactor';
    description = language === 'ja' ? 'コードをリファクタリング' : 'refactor code';
  } else if (analysis.primaryChangeType === 'update') {
    type = 'fix';
    description = language === 'ja' ? '機能を改善' : 'improve functionality';
  } else {
    type = 'feat';
    description = language === 'ja' ? '複数の変更を実装' : 'implement multiple changes';
  }

  // Determine scope based on file types and paths
  if (analysis.fileTypes.includes('ts') || analysis.fileTypes.includes('js')) {
    if (analysis.modified.some(f => f.includes('tool')) || analysis.added.some(f => f.includes('tool'))) {
      scope = 'tools';
    } else if (analysis.modified.some(f => f.includes('extension')) || analysis.added.some(f => f.includes('extension'))) {
      scope = 'extension';
    } else if (analysis.modified.some(f => f.includes('relay')) || analysis.added.some(f => f.includes('relay'))) {
      scope = 'relay';
    }
  }

  // Generate more specific description based on files
  if (analysis.modified.length === 1 || analysis.added.length === 1) {
    const changedFile = analysis.modified[0] || analysis.added[0];
    const fileName = changedFile.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    
    if (language === 'ja') {
      if (fileName.includes('tool')) {
        description = `${fileName}ツールを${analysis.primaryChangeType === 'add' ? '追加' : '更新'}`;
      } else if (fileName === 'README') {
        description = 'READMEを更新';
      } else {
        description = `${fileName}を${analysis.primaryChangeType === 'add' ? '追加' : '更新'}`;
      }
    } else {
      if (fileName.includes('tool')) {
        description = `${analysis.primaryChangeType === 'add' ? 'add' : 'update'} ${fileName} tool`;
      } else if (fileName === 'README') {
        description = 'update README';
      } else {
        description = `${analysis.primaryChangeType === 'add' ? 'add' : 'update'} ${fileName}`;
      }
    }
  }

  // Format commit message
  switch (format) {
    case 'conventional':
      if (scope) {
        return `${type}(${scope}): ${description}`;
      } else {
        return `${type}: ${description}`;
      }
    
    case 'simple':
      return description.charAt(0).toUpperCase() + description.slice(1);
    
    case 'detailed':
      const filesList = [...analysis.modified, ...analysis.added, ...analysis.deleted].slice(0, 5);
      const filesText = filesList.join(', ');
      const moreFiles = analysis.modified.length + analysis.added.length + analysis.deleted.length > 5 
        ? language === 'ja' ? ' など' : ' and more'
        : '';
      
      if (scope) {
        return `${type}(${scope}): ${description}\n\nFiles changed: ${filesText}${moreFiles}`;
      } else {
        return `${type}: ${description}\n\nFiles changed: ${filesText}${moreFiles}`;
      }
    
    default:
      return `${type}: ${description}`;
  }
}

export async function generateCommitMessageToolHandler(params: z.infer<typeof generateCommitMessageSchema>) {
  const result = await generateCommitMessageTool(params);
  return {
    content: result.content.map(item => ({
      ...item,
      type: 'text' as const,
    })),
    isError: result.isError,
  };
}
