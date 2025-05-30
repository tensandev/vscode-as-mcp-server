export const initialTools = [
  {
    "name": "execute_command",
    "description": "Execute a command in a VSCode integrated terminal with proper shell integration.\nThis tool provides detailed output and exit status information, and supports:\n- Custom working directory\n- Shell integration for reliable output capture\n- Output compression for large outputs\n- Detailed exit status reporting\n- Flag for potentially destructive commands (potentiallyDestructive: false to skip confirmation for read-only commands)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "description": "The command to execute"
        },
        "customCwd": {
          "type": "string",
          "description": "Optional custom working directory for command execution"
        },
        "potentiallyDestructive": {
          "type": "boolean",
          "default": true,
          "description": "Flag indicating if the command is potentially destructive or modifying. Default is true. Set to false for read-only commands (like grep, find, ls) to skip user confirmation. Commands that could modify files or system state should keep this as true. Note: User can override this behavior with the mcpServer.confirmNonDestructiveCommands setting."
        },
        "background": {
          "type": "boolean",
          "default": false,
          "description": "Flag indicating if the command should run in the background without waiting for completion. When true, the tool will return immediately after starting the command. Default is false, which means the tool will wait for command completion."
        },
        "timeout": {
          "type": "number",
          "default": 300000,
          "description": "Timeout in milliseconds after which the command execution will be considered complete for reporting purposes. Does not actually terminate the command. Default is 300000 (5 minutes)."
        }
      },
      "required": [
        "command"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "code_checker",
    "description": "Retrieve diagnostics from VSCode's language services for the active workspace.\nUse this tool after making changes to any code in the filesystem to ensure no new\nerrors were introduced, or when requested by the user.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "severityLevel": {
          "type": "string",
          "enum": [
            "Error",
            "Warning",
            "Information",
            "Hint"
          ],
          "default": "Warning",
          "description": "Minimum severity level for checking issues: 'Error', 'Warning', 'Information', or 'Hint'."
        }
      },
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "focus_editor",
    "description": "Open the specified file in the VSCode editor and navigate to a specific line and column.\nUse this tool to bring a file into focus and position the editor's cursor where desired.\nNote: This tool operates on the editor visual environment so that the user can see the file. It does not return the file contents in the tool call result.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "The absolute path to the file to focus in the editor."
        },
        "line": {
          "type": "integer",
          "minimum": 0,
          "default": 0,
          "description": "The line number to navigate to (default: 0)."
        },
        "column": {
          "type": "integer",
          "minimum": 0,
          "default": 0,
          "description": "The column position to navigate to (default: 0)."
        },
        "startLine": {
          "type": "integer",
          "minimum": 0,
          "description": "The starting line number for highlighting."
        },
        "startColumn": {
          "type": "integer",
          "minimum": 0,
          "description": "The starting column number for highlighting."
        },
        "endLine": {
          "type": "integer",
          "minimum": 0,
          "description": "The ending line number for highlighting."
        },
        "endColumn": {
          "type": "integer",
          "minimum": 0,
          "description": "The ending column number for highlighting."
        }
      },
      "required": [
        "filePath"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "list_debug_sessions",
    "description": "List all active debug sessions in the workspace.",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "start_debug_session",
    "description": "Start a new debug session with the provided configuration.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "workspaceFolder": {
          "type": "string",
          "description": "The workspace folder where the debug session should start."
        },
        "configuration": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "description": "Type of the debugger (e.g., 'node', 'python', etc.)."
            },
            "request": {
              "type": "string",
              "description": "Type of debug request (e.g., 'launch' or 'attach')."
            },
            "name": {
              "type": "string",
              "description": "Name of the debug session."
            }
          },
          "required": [
            "type",
            "request",
            "name"
          ],
          "additionalProperties": true,
          "description": "The debug configuration object."
        }
      },
      "required": [
        "workspaceFolder",
        "configuration"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "restart_debug_session",
    "description": "Restart a debug session by stopping it and then starting it with the provided configuration.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "workspaceFolder": {
          "type": "string",
          "description": "The workspace folder where the debug session should start."
        },
        "configuration": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "description": "Type of the debugger (e.g., 'node', 'python', etc.)."
            },
            "request": {
              "type": "string",
              "description": "Type of debug request (e.g., 'launch' or 'attach')."
            },
            "name": {
              "type": "string",
              "description": "Name of the debug session."
            }
          },
          "required": [
            "type",
            "request",
            "name"
          ],
          "additionalProperties": true,
          "description": "The debug configuration object."
        }
      },
      "required": [
        "workspaceFolder",
        "configuration"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "stop_debug_session",
    "description": "Stop all debug sessions that match the provided session name.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "sessionName": {
          "type": "string",
          "description": "The name of the debug session(s) to stop."
        }
      },
      "required": [
        "sessionName"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "text_editor",
    "description": "A text editor tool that provides file manipulation capabilities using VSCode's native APIs:\n- view: Read file contents with optional line range\n- str_replace: Replace text in file\n- create: Create new file\n- insert: Insert text at specific line\n- undo_edit: Restore from backup\n\nCode Editing Tips:\n- VSCode may automatically prune unused imports when saving. To prevent this, make sure the imported type is\n  actually used in your code before adding the import.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "enum": [
            "view",
            "str_replace",
            "create",
            "insert",
            "undo_edit"
          ]
        },
        "path": {
          "type": "string",
          "description": "File path to operate on"
        },
        "view_range": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": [
            {
              "type": "number"
            },
            {
              "type": "number"
            }
          ],
          "description": "Optional [start, end] line numbers for view command (1-indexed, -1 for end)"
        },
        "old_str": {
          "type": "string",
          "description": "Text to replace (required for str_replace command)"
        },
        "new_str": {
          "type": "string",
          "description": "New text to insert (required for str_replace and insert commands)"
        },
        "file_text": {
          "type": "string",
          "description": "Content for new file (required for create command)"
        },
        "insert_line": {
          "type": "number",
          "description": "Line number to insert after (required for insert command)"
        },
        "skip_dialog": {
          "type": "boolean",
          "description": "Skip confirmation dialog (for testing only)"
        }
      },
      "required": [
        "command",
        "path"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "list_directory",
    "description": "List directory contents in a tree format, respecting .gitignore patterns.\nShows files and directories with proper indentation and icons.\nUseful for exploring workspace structure while excluding ignored files.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "Directory path to list"
        },
        "depth": {
          "type": "integer",
          "minimum": 1,
          "description": "Maximum depth for traversal (default: unlimited)"
        },
        "include_hidden": {
          "type": "boolean",
          "description": "Include hidden files/directories (default: false)"
        }
      },
      "required": [
        "path"
      ],
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "get_terminal_output",
    "description": "Retrieve the output from a specific terminal by its ID.\nThis tool allows you to check the current or historical output of a terminal,\nwhich is particularly useful when working with long-running commands or\ncommands started in background mode with the execute_command tool.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "terminalId": {
          "type": [
            "string",
            "number"
          ],
          "description": "The ID of the terminal to get output from"
        },
        "maxLines": {
          "type": "number",
          "default": 1000,
          "description": "Maximum number of lines to retrieve (default: 1000)"
        }
      },
      "required": [
        "terminalId"
      ],      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    "name": "generate_commit_message",
    "description": "Generate commit messages based on Git changes in the current repository.\nThis tool analyzes staged changes (or all changes if includeUnstaged is true) and suggests\nappropriate commit messages following conventional commit format or other specified formats.\n\nFeatures:\n- Analyzes file changes and types to suggest appropriate commit types\n- Supports multiple commit message formats (conventional, simple, detailed)\n- Multi-language support (English and Japanese)\n- Categorizes changes by type (feat, fix, docs, test, chore, etc.)\n- Provides change summary and statistics",
    "inputSchema": {
      "type": "object",
      "properties": {
        "includeUnstaged": {
          "type": "boolean",
          "default": false,
          "description": "Include unstaged changes in the analysis"
        },
        "maxFiles": {
          "type": "number",
          "default": 10,
          "description": "Maximum number of files to analyze (default: 10)"
        },
        "language": {
          "type": "string",
          "enum": [
            "ja",
            "en"
          ],
          "default": "en",
          "description": "Language for the commit message (ja: Japanese, en: English)"
        },
        "format": {
          "type": "string",
          "enum": [
            "conventional",
            "simple",
            "detailed"
          ],
          "default": "conventional",
          "description": "Commit message format style"
        }
      },
      "additionalProperties": false,
      "$schema": "http://json-schema.org/draft-07/schema#"
    }
  }
]
