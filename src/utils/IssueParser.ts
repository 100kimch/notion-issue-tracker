import * as vscode from 'vscode';

import * as API from '../apis';
import { CustomIssue, Tag } from '../models/custom';
import { Notion } from '../models/notion';

export class IssueParser {
  static prefixes = [
    ['todo', /^\s*\/\/\s*TODO\s*/i],
    ['should', /^\s*\/\/\s*SHOULD\s*/i],
    ['must', /^\s*\/\/\s*MUST\s*/i],
    ['note', /^\s*\/\/\s*NOTE\s*/i],
  ] as [string, RegExp][];

  public static parseTags(document: vscode.TextDocument): Tag[] {
    if (
      document.languageId === 'typescript' &&
      document.uri.scheme === 'file'
    ) {
      console.log('languageId: ', document.languageId, document.uri.scheme);
      let context = document
        .getText()
        .split('\n')
        .reduce((acc, cur, i) => {
          let tag: Tag | null = null;
          if (/^\s*\/\//.test(cur)) {
            this.prefixes.some((prefix) => {
              if (prefix[1].test(cur)) {
                tag = {
                  lineNum: i + 1,
                  type: prefix[0],
                  text: cur.replace(prefix[1], ''),
                };
                return true;
              }
              return false;
            });
          }
          return tag ? acc.concat(tag) : acc;
        }, [] as Tag[]);
      console.log('context: ', context);
      return context;
    } else {
      return [];
    }
  }

  public static parseCustomIssue(
    response: Notion.Page.Response<CustomIssue.Response>,
  ) {
    return;
  }

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

  public static getIdPosition(): vscode.Position | vscode.Range | null {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const activeLine = editor.document.lineAt(editor.selection.start.line);

      const editingIndex = activeLine.text.lastIndexOf('(');
      if (editingIndex !== -1) {
        return new vscode.Range(
          new vscode.Position(activeLine.lineNumber, editingIndex),
          activeLine.range.end,
        );
      } else {
        return activeLine.range.end;
      }
    }
    return null;
  }

  public static async createLive(): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      const editor = vscode.window.activeTextEditor;

      const idPosition = this.getIdPosition();

      if (editor && idPosition) {
        try {
          resolve('done');
          // resolve(await API.Notion.postPage());
        } catch (e) {
          reject(e);
        }
      } else {
        resolve(null);
      }
    });
  }

  public static async create(tags: Tag[]): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      tags.forEach(async (tag) => {
        try {
          resolve('done');
          // resolve(await API.Notion.postPage());
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}
