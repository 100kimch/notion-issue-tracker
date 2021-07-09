import * as vscode from 'vscode';

import * as API from '../apis';
import {
  adjectives,
  breeds,
  colors,
  explainingBodies,
  names,
  sizes,
} from '../constants';
import { CustomComment, CustomIssue, Issue, Tag } from '../models/custom';
import { Notion } from '../models/notion';

/**
 * a module which links comments to notion boards to work as an issue.
 * @name IssueParser
 * @constant prefixes - [breeds, explainingBodies, colors, adjectives, sizes, names]
 * @constant mW - a variable for using pseudo-random number generator
 * @constant mZ - a variable for using pseudo-random number generator
 * @constant mask - a variable for using pseudo-random number generator
 * @constant lengths - lengths of [breeds, explainingBodies, colors, adjectives, sizes, names]
 * @constant timeMask - sum of the lengths constant
 */
export class IssueParser {
  private static prefixes = [
    ['todo', /^\s*\/\/\s*TODO\s*/i],
    ['should', /^\s*\/\/\s*SHOULD\s*/i],
    ['must', /^\s*\/\/\s*MUST\s*/i],
    ['note', /^\s*\/\/\s*NOTE\s*/i],
  ] as [string, RegExp][];
  private static mW = 123456789;
  private static mZ = 987654321;
  private static mask = 0xffffffff;
  private static lengths = [21, 3, 25, 25, 10, 500];
  private static timeMask = 196875000;

  public static parseTags(document: vscode.TextDocument): Issue[] {
    if (
      document.languageId === 'typescript' &&
      document.uri.scheme === 'file'
    ) {
      console.log('languageId: ', document.languageId, document.uri.scheme);
      let context = document
        .getText()
        .split('\n')
        .reduce((acc, cur, i) => {
          let tag: Issue | null = null;
          if (/^\s*\/\//.test(cur)) {
            this.prefixes.some((prefix) => {
              if (prefix[1].test(cur)) {
                tag = {
                  id: this.createName(),
                  pageId: null,
                  lineNum: i + 1,
                  type: prefix[0],
                  description: cur.replace(prefix[1], ''),
                };
                document.lineAt;
                return true;
              }
              return false;
            });
          }
          return tag ? acc.concat(tag) : acc;
        }, [] as Issue[]);
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

  /**
   * a function which makes a pet name with description to be used as an id.
   * @returns a random pet name with description
   */
  public static createName(): string {
    const timeVal = Math.floor(new Date().getTime() / 1000) % this.timeMask;
    const nums = [];
    let selectedId;

    this.seed(timeVal);
    selectedId = Math.floor(this.random() * this.timeMask);

    for (let i in this.lengths) {
      nums.push(selectedId % this.lengths[i]);
      selectedId = Math.floor(selectedId / this.lengths[i]);
    }

    console.debug('picked: ', nums);
    return `${names[nums.pop()!]}, a${sizes[nums.pop()!]} ${
      adjectives[nums.pop()!]
    } ${colors[nums.pop()!]}${explainingBodies[nums.pop()!]} ${
      breeds[nums.pop()!]
    }`;
  }

  public static createComment(
    body: string | vscode.MarkdownString,
    mode: vscode.CommentMode,
    author: vscode.CommentAuthorInformation,
    parent?: vscode.CommentThread,
    contextValue?: string,
  ): CustomComment {
    return {
      id: this.createName(),
      body,
      mode,
      author,
      parent,
      contextValue,
    };
  }

  public static replyNote(reply: vscode.CommentReply) {
    const thread = reply.thread;
    const newComment = this.createComment(
      reply.text,
      vscode.CommentMode.Preview,
      { name: 'vscode' },
      thread,
      thread.comments.length ? 'canDelete' : undefined,
    );
    if (thread.contextValue === 'draft') {
      newComment.label = 'pending';
    }

    thread.comments = [...thread.comments, newComment];
  }

  /**
   * a seed function for a random number
   * @param i a seed for a random number sequence
   */
  public static seed(i: number) {
    this.mW = (123456789 + i) & this.mask;
    this.mZ = (987654321 - i) & this.mask;
  }

  /**
   * a random number generating function
   * @returns a decimal number between 0 and 1
   */
  public static random(): number {
    this.mZ = (36969 * (this.mZ & 65535) + (this.mZ >> 16)) & this.mask;
    this.mW = (18000 * (this.mW & 65535) + (this.mW >> 16)) & this.mask;
    var result = ((this.mZ << 16) + (this.mW & 65535)) >>> 0;
    result /= 4294967296;
    return result;
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
