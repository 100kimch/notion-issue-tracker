import * as vscode from 'vscode';

import { IssueParser } from './IssueParser';

export class CodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private content: string = '';
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = /(\/\/+)/g;

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (
      vscode.workspace
        .getConfiguration('notion-issue-tracker')
        .get('enableCodeLens', true)
    ) {
      this.codeLenses = [];
      IssueParser.commentRange.forEach((range, index) => {
        this.codeLenses.push(
          new vscode.CodeLens(range, {
            title: 'Notion: ' + IssueParser.issues[index].id,
            tooltip: 'Sample Tooltip by NotionIssueTracker',
            command: 'notion-issue-tracker.checkHealth',
          }),
        );
      });

      return this.codeLenses;
    }
    return [];
  }

  // public provideCodeLenses2(
  //   document: vscode.TextDocument,
  //   token: vscode.CancellationToken,
  // ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
  //   if (
  //     vscode.workspace
  //       .getConfiguration('notion-issue-tracker')
  //       .get('enableCodeLens', true)
  //   ) {
  //     this.codeLenses = [];
  //     const regex = new RegExp(this.regex);
  //     const text = document.getText();
  //     let matches;
  //     while ((matches = regex.exec(text)) !== null) {
  //       const line = document.lineAt(document.positionAt(matches.index).line);
  //       const indexOf = line.text.indexOf(matches[0]);
  //       const position = new vscode.Position(line.lineNumber, indexOf);
  //       const range = document.getWordRangeAtPosition(
  //         position,
  //         new RegExp(this.regex),
  //       );
  //       if (range) {
  //         this.content = JSON.stringify(range);
  //         this.codeLenses.push(
  //           new vscode.CodeLens(range, {
  //             title: 'Notion: Hello ' + text.slice(indexOf),
  //             tooltip: 'Sample Tooltip by NotionIssueTracker',
  //             command: 'notion-issue-tracker.checkHealth',
  //           }),
  //         );
  //       }
  //     }
  //     return this.codeLenses;
  //   }
  //   return [];
  // }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken,
  ) {
    return codeLens;
    // if (
    //   vscode.workspace
    //     .getConfiguration('notion-issue-tracker')
    //     .get('enableCodeLens', true)
    // ) {
    //   codeLens.command = {
    //     title: 'Notion: Hello ' + JSON.stringify(codeLens),
    //     tooltip: 'Tooltip provided by sample extension',
    //     command: 'notion-issue-tracker.codelensAction',
    //     arguments: ['Argument 1', false],
    //   };
    //   return codeLens;
    // }
    // return null;
  }
}
