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
  workspace,
} from 'vscode';

import * as API from '../apis';
import notion from '../apis/notion';
import config from '../config';
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
  private static languageIds: string[] = [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
  ];
  private static mW: number = 123456789;
  private static mZ: number = 987654321;
  private static mask: number = 0xffffffff;
  private static lengths: number[] = [21, 3, 25, 25, 10, 500];
  private static timeMask: number = 196875000;
  private static timeVal: number =
    Math.floor(new Date().getTime() / 1000) % IssueParser.timeMask;
  private static commentController: CommentController =
    comments.createCommentController(
      'notion-issue-tracker-comments',
      'Notion Issue Tracker - Comments',
    );
  public static commentRange: Range[] = [];
  public static parsedLineCount: number = 0;
  public static issues: Issue[] = [];
  public static threads: CommentThread[] = [];

  public static init(path?: any) {
    IssueParser.commentController.commentingRangeProvider = {
      provideCommentingRanges: () => IssueParser.commentRange,
    };
  }

  // constructor() {
  //   this.mW = 123456789;
  //   this.mZ = 987654321;
  //   this.mask = 0xffffffff;
  //   this.lengths = [21, 3, 25, 25, 10, 500];
  //   this.timeMask = 196875000;
  //   this.timeVal = Math.floor(new Date().getTime() / 1000) % this.timeMask;
  //   this.commentController = comments.createCommentController(
  //     'notion-issue-tracker-comments',
  //     'Notion Issue Tracker - Comments',
  //   );
  //   this.parsedLineCount = 0;

  //   this.commentController.commentingRangeProvider = {
  //     provideCommentingRanges: (
  //       document: TextDocument,
  //       token: CancellationToken,
  //     ) => {
  //       return this.commentRange;
  //     },
  //   };
  // }

  public static dispose() {
    IssueParser.commentController.dispose();
  }

  /**
   * find every comments starting with tag prefixes & add ranges of them to commentRange
   * @param document - contents where comments include.
   * @returns {Issue[]}
   */
  public static parseTags(document: TextDocument, force?: boolean): Issue[] {
    if (
      (document.lineCount !== IssueParser.parsedLineCount || force) &&
      this.languageIds.includes(document.languageId) &&
      document.uri.scheme === 'file'
    ) {
      let newRange: Range[] = [];
      let newThreads: CommentThread[] = [];
      let context = document
        .getText()
        .split('\n')
        .reduce((acc, cur, i) => {
          let tag: Issue | null = null;
          if (/^\s*\/\//.test(cur)) {
            IssueParser.prefixes.some((prefix) => {
              if (prefix[1].test(cur)) {
                tag = {
                  id: IssueParser.getNewName(),
                  pageId: null,
                  filePath: workspace.asRelativePath(document.fileName),
                  lineNum: i + 1,
                  type: prefix[0],
                  title: cur.replace(prefix[1], ''),
                  description: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                newRange.push(new Range(i, 0, i, 0));
                newThreads.push(
                  IssueParser.commentController.createCommentThread(
                    document.uri,
                    new Range(i, 0, i, 0),
                    [],
                  ),
                );
                IssueParser.replyNote({
                  text: [
                    `# ${tag.title}`,
                    `- ${tag.id}`,
                    `- ${config.notion.author}`,
                    `- created at ${tag.createdAt.toUTCString()}`,
                    `- updated at ${tag.updatedAt.toUTCString()}`,
                  ].join('\n'),
                  thread: newThreads.slice(-1)[0],
                });
                return true;
              }
              return false;
            });
          }
          return tag ? acc.concat(tag) : acc;
        }, [] as Issue[]);
      IssueParser.commentRange = newRange;
      IssueParser.parsedLineCount = document.lineCount;
      console.log('context: ', context);
      notion.postIssue(context);
      IssueParser.init();
      IssueParser.issues = context;
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
  public static getNewName(): string {
    IssueParser.timeVal = (IssueParser.timeVal + 1) % IssueParser.timeMask;
    const nums = [];
    let selectedId;

    IssueParser.seed(IssueParser.timeVal);
    selectedId = Math.floor(IssueParser.random() * IssueParser.timeMask);

    for (let i in IssueParser.lengths) {
      nums.push(selectedId % IssueParser.lengths[i]);
      selectedId = Math.floor(selectedId / IssueParser.lengths[i]);
    }

    console.debug('picked: ', nums);
    return `${names[nums.pop()!]}, a${sizes[nums.pop()!]} ${
      adjectives[nums.pop()!]
    } ${colors[nums.pop()!]}${explainingBodies[nums.pop()!]} ${
      breeds[nums.pop()!]
    }`;
  }

  public static createComment(
    body: string | MarkdownString,
    mode: CommentMode,
    author: CommentAuthorInformation,
    parent?: CommentThread,
    contextValue?: string,
  ): CustomComment {
    return {
      id: IssueParser.getNewName(),
      body,
      mode,
      author,
      parent,
      contextValue,
    };
  }

  public static replyNote(reply: CommentReply) {
    console.log('reply: ', reply);
    const thread = reply.thread;
    const newComment = IssueParser.createComment(
      reply.text,
      CommentMode.Preview,
      { name: 'NotionIssueTracker' },
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
    IssueParser.mW = (123456789 + i) & IssueParser.mask;
    IssueParser.mZ = (987654321 - i) & IssueParser.mask;
  }

  /**
   * a random number generating function
   * @returns a decimal number between 0 and 1
   */
  public static random(): number {
    IssueParser.mZ =
      (36969 * (IssueParser.mZ & 65535) + (IssueParser.mZ >> 16)) &
      IssueParser.mask;
    IssueParser.mW =
      (18000 * (IssueParser.mW & 65535) + (IssueParser.mW >> 16)) &
      IssueParser.mask;
    var result = ((IssueParser.mZ << 16) + (IssueParser.mW & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }

  public static getContext(): string {
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

  public static getIdPosition(): Position | Range | null {
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

  public static async createLive(): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      const editor = window.activeTextEditor;

      const idPosition = IssueParser.getIdPosition();

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
