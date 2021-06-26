import * as vscode from 'vscode';

export class IssueParser {
  public static getContext(): string {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const activeLine = editor.document.lineAt(editor.selection.start.line);

      const editingIndex = activeLine.text.lastIndexOf('(');
      const editingRange =
        editingIndex !== -1
          ? new vscode.Range(
              new vscode.Position(activeLine.lineNumber, editingIndex),
              activeLine.range.end,
            )
          : activeLine.range.end;

      editor.edit((editBuilder) => {
        editBuilder.replace(editingRange, '(Hello!)');
      });
      return editor.document.lineAt(editor.selection.start.line).text + '';
    } else {
      return 'none';
    }
  }
}
