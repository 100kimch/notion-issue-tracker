// The module 'vscode' contains the VS Code extensibility API
import {
  CancellationToken,
  commands,
  CommentMode,
  CommentReply,
  comments,
  CommentThread,
  CommentThreadCollapsibleState,
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  languages,
  MarkdownString,
  Range,
  SnippetString,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from 'vscode';

import * as API from './apis';
import { CustomComment } from './models/custom';
import { CodeLensProvider } from './utils/CodeLensProvider';
import { Parser } from './utils/CommentParser';
import { IssueParser } from './utils/IssueParser';

export function activate(context: ExtensionContext) {
  const output = window.createOutputChannel('Notion Issue Tracker');
  const codelensProvider = new CodeLensProvider();
  const parser = new Parser();
  const commentController = comments.createCommentController(
    'notion-issue-tracker-comments',
    'Notion Issue Tracker - Comments',
  );
  context.subscriptions.push(commentController);

  let activeEditor: TextEditor;
  let timeout: NodeJS.Timer;

  output.appendLine(
    'Notion Issue Tracker\n\tv0.1.0\n\thttps://github.com/100kimch/notion-issue-tracker',
  );

  commentController.commentingRangeProvider = {
    provideCommentingRanges: (
      document: TextDocument,
      token: CancellationToken,
    ) => {
      const lineCount = document.lineCount;
      return [new Range(0, 0, lineCount - 1, 0)];
    },
  };

  const getTags = () => {
    if (!activeEditor) return;
    if (!parser.supportedLanguage) return;

    console.log('getTags() executed');
  };

  // * IMPORTANT:
  // To avoid calling update too often,
  // set a timer for 200ms to wait before updating decorations
  const triggerGetTags = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(getTags, 200);
  };

  // Get the active editor for the first time and initialise the regex
  if (window.activeTextEditor) {
    activeEditor = window.activeTextEditor;

    // Set the regex patterns for the specified language's comments
    parser.SetRegex(activeEditor.document.languageId);

    // Trigger first update of decorators
    triggerGetTags();
  }

  window.onDidChangeActiveTextEditor((editor) => {
    console.log('editor changed', editor);

    if (editor) {
      activeEditor = editor;

      // Set regex for updated language
      parser.SetRegex(editor.document.languageId);

      // Trigger update to set decorations for newly active file
      triggerGetTags();
    }
  });

  workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        console.log('changing...', new Date().getTime(), event.document);
        triggerGetTags();
      }
    },
    null,
    context.subscriptions,
  );

  workspace.onDidSaveTextDocument(async (document) => {
    console.log(
      'final result:',
      IssueParser.parseTags(document),
      // await IssueParser.create(IssueParser.parseTags(document)),
    );
  });

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'typescript',
      {
        provideCompletionItems(document, position) {
          const ret: CompletionItem[] = [];
          const linePrefix = document
            .lineAt(position)
            .text.substr(0, position.character);

          const snippetCompletion = new CompletionItem('Notion');
          snippetCompletion.insertText = new SnippetString(
            '// ${1|TODO,NOTE,SHOULD,MUST|} It is ${1}, right?',
          );
          snippetCompletion.command = {
            command: 'notion-issue-tracker.helloWorld',
            title: 'Re-trigger completions...',
          };
          snippetCompletion.documentation = new MarkdownString(
            'Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.',
          );

          ret.push(snippetCompletion);

          const commitCharacterCompletion = new CompletionItem('americano');
          commitCharacterCompletion.commitCharacters = ['.'];
          commitCharacterCompletion.documentation = new MarkdownString(
            'Press `.` to get `console.`',
          );

          ret.push(commitCharacterCompletion);

          const todoCompletion = new CompletionItem('americhino');
          todoCompletion.kind = CompletionItemKind.Keyword;
          todoCompletion.insertText = 'Hello !!! ';
          todoCompletion.commitCharacters = [' '];
          todoCompletion.documentation = new MarkdownString(
            '# TODO\n- will be registered to Notion TODO database.',
          );

          ret.push(todoCompletion);

          // if (linePrefix.endsWith('// TO amer')) {
          //   ret.push(todoCompletion);
          // }

          // if (!linePrefix.endsWith('Americano')) {
          //   return undefined;
          // }

          return ret;
        },
      },
      '.',
    ),
  );

  languages.registerCodeLensProvider('*', codelensProvider);

  context.subscriptions.push(
    ...[
      commands.registerCommand('notion-issue-tracker.helloWorld', async () => {
        // The code you place here will be executed every time your command is executed

        await API.Notion.sayHello(500);
        console.log('Running Complete!');

        // Display a message box to the user
        window.showInformationMessage('Hello World from Notion Issue Tracker!');
      }),

      commands.registerCommand('notion-issue-tracker.enableCodeLens', () => {
        workspace
          .getConfiguration('notion-issue-tracker')
          .update('enableCodeLens', true, true);
      }),

      commands.registerCommand('notion-issue-tracker.disableCodeLens', () => {
        workspace
          .getConfiguration('notion-issue-tracker')
          .update('enableCodeLens', false, true);
      }),

      commands.registerCommand(
        'notion-issue-tracker.codelensAction',
        (args: any) => {
          window.showInformationMessage(
            `CodeLens action clicked with args=${args}`,
          );
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.checkHealth',
        async (args: any) => {
          window.showInformationMessage('Health check.');
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.addIssue',
        async (args: any) => {
          window.showInformationMessage(IssueParser.getContext());
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.createNote',
        (reply: CommentReply) => {
          IssueParser.replyNote(reply);
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.replyNote',
        (reply: CommentReply) => {
          IssueParser.replyNote(reply);
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.startDraft',
        (reply: CommentReply) => {
          const thread = reply.thread;
          thread.contextValue = 'draft';
          const newComment = IssueParser.createComment(
            reply.text,
            CommentMode.Preview,
            { name: 'vscode' },
            thread,
          );
          newComment.label = 'pending';
          thread.comments = [...thread.comments, newComment];
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.finishDraft',
        (reply: CommentReply) => {
          const thread = reply.thread;

          if (!thread) {
            return;
          }

          thread.contextValue = undefined;
          thread.collapsibleState = CommentThreadCollapsibleState.Collapsed;
          if (reply.text) {
            const newComment = IssueParser.createComment(
              reply.text,
              CommentMode.Preview,
              { name: 'vscode' },
              thread,
            );
            thread.comments = [...thread.comments, newComment].map(
              (comment) => {
                comment.label = undefined;
                return comment;
              },
            );
          }
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.deleteNoteComment',
        (comment: CustomComment) => {
          const thread = comment.parent;
          if (!thread) {
            return;
          }

          thread.comments = thread.comments.filter(
            (cmt) => (cmt as CustomComment).id !== comment.id,
          );

          if (thread.comments.length === 0) {
            thread.dispose();
          }
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.deleteNote',
        (thread: CommentThread) => {
          thread.dispose();
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.cancelsaveNote',
        (comment: CustomComment) => {
          if (!comment.parent) {
            return;
          }

          comment.parent.comments = comment.parent.comments.map((cmt) => {
            if ((cmt as CustomComment).id === comment.id) {
              cmt.mode = CommentMode.Preview;
            }

            return cmt;
          });
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.saveNote',
        (comment: CustomComment) => {
          if (!comment.parent) {
            return;
          }

          comment.parent.comments = comment.parent.comments.map((cmt) => {
            if ((cmt as CustomComment).id === comment.id) {
              cmt.mode = CommentMode.Preview;
            }

            return cmt;
          });
        },
      ),

      commands.registerCommand(
        'notion-issue-tracker.editNote',
        (comment: CustomComment) => {
          if (!comment.parent) {
            return;
          }

          comment.parent.comments = comment.parent.comments.map((cmt) => {
            if ((cmt as CustomComment).id === comment.id) {
              cmt.mode = CommentMode.Editing;
            }

            return cmt;
          });
        },
      ),
    ],
  );
}

export function deactivate() {}
