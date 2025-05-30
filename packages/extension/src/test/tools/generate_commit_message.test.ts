import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { generateCommitMessageTool } from '../../tools/generate_commit_message';

suite('Generate Commit Message Tool Test Suite', function () {
  this.timeout(30000); // Set a longer timeout for git operations

  const tmpDir = path.join(__dirname, '../../test-tmp-git');
  let originalWorkspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;

  suiteSetup(async function () {
    console.log('Test setup - workspace folders:', vscode.workspace.workspaceFolders);
    console.log('Test setup - tmpDir:', tmpDir);

    // Save original workspace folders
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;

    // Create test directory
    const uri = vscode.Uri.file(tmpDir);
    await vscode.workspace.fs.createDirectory(uri);

    // Initialize git repository
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('git init', { cwd: tmpDir });
      await execAsync('git config user.name "Test User"', { cwd: tmpDir });
      await execAsync('git config user.email "test@example.com"', { cwd: tmpDir });
      
      // Create initial commit
      const testFile = vscode.Uri.file(path.join(tmpDir, 'README.md'));
      await vscode.workspace.fs.writeFile(testFile, Buffer.from('# Test Repository\n', 'utf-8'));
      await execAsync('git add README.md', { cwd: tmpDir });
      await execAsync('git commit -m "Initial commit"', { cwd: tmpDir });
    } catch (error) {
      console.error('Error setting up git repository:', error);
    }

    // Update workspace folder for testing
    const workspaceFolder = {
      uri: vscode.Uri.file(tmpDir),
      name: 'test-git-repo',
      index: 0
    };

    // Mock workspace folders
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [workspaceFolder],
      configurable: true
    });

    console.log('Test setup - created git repository');
  });

  suiteTeardown(async function () {
    // Restore original workspace folders
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: originalWorkspaceFolders,
      configurable: true
    });

    // Clean up test directory
    const uri = vscode.Uri.file(tmpDir);
    try {
      await vscode.workspace.fs.delete(uri, { recursive: true });
    } catch (error) {
      console.error('Error cleaning up test directory:', error);
    }
    console.log('Test teardown - removed test directory');
  });

  test('Generate commit message with no changes', async function () {
    console.log('Running no changes test');
    const result = await generateCommitMessageTool({});
    console.log('No changes test result:', result);

    assert.strictEqual(result.isError, false, 'Should not be an error');
    assert.match(result.content[0].text, /No staged changes found|Working directory is clean/, 'Should indicate no changes');
  });

  test('Generate commit message with staged changes', async function () {
    console.log('Running staged changes test');

    // Create and stage a new file
    const testFile = vscode.Uri.file(path.join(tmpDir, 'new-feature.ts'));
    await vscode.workspace.fs.writeFile(testFile, Buffer.from('export function newFeature() {\n  return "Hello World";\n}\n', 'utf-8'));

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('git add new-feature.ts', { cwd: tmpDir });

      const result = await generateCommitMessageTool({});
      console.log('Staged changes test result:', result);

      assert.strictEqual(result.isError, false, 'Should not be an error');
      assert.match(result.content[0].text, /Suggested Commit Message/, 'Should contain suggested commit message');
      assert.match(result.content[0].text, /feat/, 'Should suggest feat type for new feature');
    } catch (error) {
      console.error('Error in staged changes test:', error);
      throw error;
    }
  });

  test('Generate commit message with Japanese language', async function () {
    console.log('Running Japanese language test');

    // Modify existing file
    const testFile = vscode.Uri.file(path.join(tmpDir, 'README.md'));
    await vscode.workspace.fs.writeFile(testFile, Buffer.from('# Test Repository\n\nUpdated content\n', 'utf-8'));

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('git add README.md', { cwd: tmpDir });

      const result = await generateCommitMessageTool({ 
        language: 'ja', 
        format: 'simple' 
      });
      console.log('Japanese language test result:', result);

      assert.strictEqual(result.isError, false, 'Should not be an error');
      assert.match(result.content[0].text, /Suggested Commit Message/, 'Should contain suggested commit message');
    } catch (error) {
      console.error('Error in Japanese language test:', error);
      throw error;
    }
  });

  test('Generate commit message with detailed format', async function () {
    console.log('Running detailed format test');

    // Create multiple files
    const files = ['utils.ts', 'config.json', 'test.spec.ts'];
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      for (const fileName of files) {
        const testFile = vscode.Uri.file(path.join(tmpDir, fileName));
        await vscode.workspace.fs.writeFile(testFile, Buffer.from(`// ${fileName} content\n`, 'utf-8'));
        await execAsync(`git add ${fileName}`, { cwd: tmpDir });
      }

      const result = await generateCommitMessageTool({ 
        format: 'detailed',
        maxFiles: 5
      });
      console.log('Detailed format test result:', result);

      assert.strictEqual(result.isError, false, 'Should not be an error');
      assert.match(result.content[0].text, /Files changed/, 'Should contain files changed information');
    } catch (error) {
      console.error('Error in detailed format test:', error);
      throw error;
    }
  });

  test('Generate commit message including unstaged changes', async function () {
    console.log('Running unstaged changes test');

    // Create unstaged file
    const testFile = vscode.Uri.file(path.join(tmpDir, 'unstaged.ts'));
    await vscode.workspace.fs.writeFile(testFile, Buffer.from('// Unstaged file\n', 'utf-8'));

    const result = await generateCommitMessageTool({ 
      includeUnstaged: true 
    });
    console.log('Unstaged changes test result:', result);

    assert.strictEqual(result.isError, false, 'Should not be an error');
    // This test might show changes or no changes depending on git state
    assert.ok(result.content[0].text.length > 0, 'Should return some content');
  });

  test('Error handling for non-git directory', async function () {
    console.log('Running non-git directory test');

    // Temporarily change workspace folder to non-git directory
    const nonGitDir = path.join(__dirname, '../../test-tmp-non-git');
    const nonGitUri = vscode.Uri.file(nonGitDir);
    await vscode.workspace.fs.createDirectory(nonGitUri);

    const workspaceFolder = {
      uri: nonGitUri,
      name: 'test-non-git',
      index: 0
    };

    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: [workspaceFolder],
      configurable: true
    });

    try {
      const result = await generateCommitMessageTool({});
      console.log('Non-git directory test result:', result);

      assert.strictEqual(result.isError, true, 'Should be an error');
      assert.match(result.content[0].text, /not a git repository/, 'Should indicate not a git repository');
    } finally {
      // Restore workspace folder
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        value: [{ uri: vscode.Uri.file(tmpDir), name: 'test-git-repo', index: 0 }],
        configurable: true
      });

      // Clean up non-git directory
      await vscode.workspace.fs.delete(nonGitUri, { recursive: true });
    }
  });
});
