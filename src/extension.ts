// The module 'vscode' contains the VS Code extensibility API
import {
  commands,
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  languages,
  MarkdownString,
  TextEditor,
  window,
  workspace,
} from 'vscode';

import * as API from './apis';
import { CodeLensProvider } from './utils/CodeLensProvider';
import { Parser } from './utils/CommentParser';

export function activate(context: ExtensionContext) {
  const output = window.createOutputChannel('Notion Issue Tracker');
  const codelensProvider = new CodeLensProvider();
  const parser = new Parser();

  output.appendLine(
    'Notion Issue Tracker\n\tv0.1.0\n\thttps://github.com/100kimch/notion-issue-tracker',
  );
  let activeEditor: TextEditor;

  let updateDecorations = function (useHash = false) {
    if (!activeEditor) return;
    if (!parser.supportedLanguage) return;

    // Finds the single line comments using the language comment delimiter
    parser.FindSingleLineComments(activeEditor);

    // Finds the multi line comments using the language comment delimiter
    parser.FindBlockComments(activeEditor);

    // Finds the jsdoc comments
    parser.FindJSDocComments(activeEditor);

    // Apply the styles set in the package.json
    parser.ApplyDecorations(activeEditor);
  };

  // Get the active editor for the first time and initialise the regex
  if (window.activeTextEditor) {
    activeEditor = window.activeTextEditor;

    // Set the regex patterns for the specified language's comments
    parser.SetRegex(activeEditor.document.languageId);

    // Trigger first update of decorators
    triggerUpdateDecorations();
  }

  // * Handle active file changed
  window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor) {
        activeEditor = editor;

        // Set regex for updated language
        parser.SetRegex(editor.document.languageId);

        // Trigger update to set decorations for newly active file
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  // * Handle file contents changed
  workspace.onDidChangeTextDocument(
    (event) => {
      // Trigger updates if the text was changed in the same document
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  // * IMPORTANT:
  // To avoid calling update too often,
  // set a timer for 200ms to wait before updating decorations
  var timeout: NodeJS.Timer;
  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(updateDecorations, 200);
  }

  context.subscriptions.push(
    commands.registerCommand('notion-issue-tracker.helloWorld', async () => {
      // The code you place here will be executed every time your command is executed

      await API.Notion.sayHello(500);
      console.log('Running Complete!');

      // Display a message box to the user
      window.showInformationMessage('Hello World from Notion Issue Tracker!');
    }),
  );

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      'typescript',
      {
        provideCompletionItems(document, position) {
          const ret: CompletionItem[] = [];
          const linePrefix = document
            .lineAt(position)
            .text.substr(0, position.character);
          console.log('text: ', linePrefix);

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

          console.log('working...');

          return ret;
        },
      },
      '.',
    ),
  );

  languages.registerCodeLensProvider('*', codelensProvider);

  commands.registerCommand('notion-issue-tracker.enableCodeLens', () => {
    workspace
      .getConfiguration('notion-issue-tracker')
      .update('enableCodeLens', true, true);
  });

  commands.registerCommand('notion-issue-tracker.disableCodeLens', () => {
    workspace
      .getConfiguration('notion-issue-tracker')
      .update('enableCodeLens', false, true);
  });

  commands.registerCommand(
    'notion-issue-tracker.codelensAction',
    (args: any) => {
      window.showInformationMessage(
        `CodeLens action clicked with args=${args}`,
      );
    },
  );

  commands.registerCommand(
    'notion-issue-tracker.checkHealth',
    async (args: any) => {
      window.showInformationMessage(await API.Notion.getDatabase());
    },
  );
}

export function deactivate() {}
