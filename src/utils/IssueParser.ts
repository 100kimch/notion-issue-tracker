import {
  CancellationToken,
  CommentAuthorInformation,
  CommentController,
  CommentMode,
  CommentReply,
  comments,
  CommentThread,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  window,
} from 'vscode';

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
  private prefixes = [
    ['todo', /^\s*\/\/\s*TODO\s*/i],
    ['should', /^\s*\/\/\s*SHOULD\s*/i],
    ['must', /^\s*\/\/\s*MUST\s*/i],
    ['note', /^\s*\/\/\s*NOTE\s*/i],
  ] as [string, RegExp][];
  private mW: number;
  private mZ: number;
  private mask: number;
  private lengths: number[];
  private timeMask: number;
  private timeVal: number;
  private commentController: CommentController;
  private commentRange: Range[] = [];
  public parsedLineCount: number;

  constructor() {
    this.mW = 123456789;
    this.mZ = 987654321;
    this.mask = 0xffffffff;
    this.lengths = [21, 3, 25, 25, 10, 500];
    this.timeMask = 196875000;
    this.timeVal = Math.floor(new Date().getTime() / 1000) % this.timeMask;
    this.commentController = comments.createCommentController(
      'notion-issue-tracker-comments',
      'Notion Issue Tracker - Comments',
    );
    this.parsedLineCount = 0;

    this.commentController.commentingRangeProvider = {
      provideCommentingRanges: (
        document: TextDocument,
        token: CancellationToken,
      ) => {
        return this.commentRange;
      },
    };
  }

  public dispose() {
    this.commentController.dispose();
  }

  /**
   * find every comments starting with tag prefixes & add ranges of them to commentRange
   * @param document - contents where comments include.
   * @returns {Issue[]}
   */
  public parseTags(document: TextDocument, force?: boolean): Issue[] {
    if (
      (document.lineCount !== this.parsedLineCount || force) &&
      document.languageId === 'typescript' &&
      document.uri.scheme === 'file'
    ) {
      let newRange: Range[] = [];
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
                newRange.push(new Range(i, 0, i, 0));
                return true;
              }
              return false;
            });
          }
          return tag ? acc.concat(tag) : acc;
        }, [] as Issue[]);
      this.commentRange = newRange;
      this.parsedLineCount = document.lineCount;
      console.log('context: ', context);
      return context;
    } else {
      return [];
    }
  }

  public parseCustomIssue(
    response: Notion.Page.Response<CustomIssue.Response>,
  ) {
    return;
  }

  /**
   * a function which makes a pet name with description to be used as an id.
   * @returns a random pet name with description
   */
  public createName(): string {
    this.timeVal = (this.timeVal + 1) % this.timeMask;
    const nums = [];
    let selectedId;

    this.seed(this.timeVal);
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

  public createComment(
    body: string | MarkdownString,
    mode: CommentMode,
    author: CommentAuthorInformation,
    parent?: CommentThread,
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

  public replyNote(reply: CommentReply) {
    console.log('reply: ', reply);
    const thread = reply.thread;
    const newComment = this.createComment(
      reply.text,
      CommentMode.Preview,
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
  public seed(i: number) {
    this.mW = (123456789 + i) & this.mask;
    this.mZ = (987654321 - i) & this.mask;
  }

  /**
   * a random number generating function
   * @returns a decimal number between 0 and 1
   */
  public random(): number {
    this.mZ = (36969 * (this.mZ & 65535) + (this.mZ >> 16)) & this.mask;
    this.mW = (18000 * (this.mW & 65535) + (this.mW >> 16)) & this.mask;
    var result = ((this.mZ << 16) + (this.mW & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }

  public getContext(): string {
    const editor = window.activeTextEditor;
    if (editor) {
      const activeLine = editor.document.lineAt(editor.selection.start.line);

      const editingIndex = activeLine.text.lastIndexOf('(');
      const editingRange =
        editingIndex !== -1
          ? new Range(
              new Position(activeLine.lineNumber, editingIndex),
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

  public getIdPosition(): Position | Range | null {
    const editor = window.activeTextEditor;
    if (editor) {
      const activeLine = editor.document.lineAt(editor.selection.start.line);

      const editingIndex = activeLine.text.lastIndexOf('(');
      if (editingIndex !== -1) {
        return new Range(
          new Position(activeLine.lineNumber, editingIndex),
          activeLine.range.end,
        );
      } else {
        return activeLine.range.end;
      }
    }
    return null;
  }

  public async createLive(): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      const editor = window.activeTextEditor;

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

  public async create(tags: Tag[]): Promise<string | null> {
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
