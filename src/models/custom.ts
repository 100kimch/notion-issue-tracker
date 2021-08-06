import {
  Comment,
  CommentAuthorInformation,
  CommentMode,
  CommentThread,
  MarkdownString,
} from 'vscode';

import { Notion } from './notion';

import { IssueParser } from '../utils/IssueParser';

export interface Tag {
  lineNum: number;
  type: string;
  text: string;
}

export interface Issue {
  id: string;
  pageId: string | null;
  filePath: string;
  lineNum: number;
  type: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export namespace Issue {
  export class Request implements Notion.Page.Request<Issue> {
    public parent: { database_id: string };
    public properties: {
      issue: Notion.Title.Request;
      id: Notion.RichText.Request;
      filePath: Notion.RichText.Request;
      lineNum: Notion.Number.Request;
      type: Notion.Select.Request;
      createdAt: Notion.Date.Request;
      updatedAt: Notion.Date.Request;
    };
    public children: any;

    constructor(
      data: Issue,
      databaseId: string,
      content?: Notion.Block.Request[],
    ) {
      this.parent = { database_id: databaseId };
      this.properties = {
        issue: { title: [{ text: { content: data.title } }] },
        id: {
          rich_text: [{ type: 'text', text: { content: data.id } }],
        },
        filePath: {
          rich_text: [{ type: 'text', text: { content: data.filePath } }],
        },
        lineNum: {
          number: data.lineNum,
        },
        type: {
          select: {
            name: data.type,
            color: 'red',
          },
        },
        createdAt: {
          date: {
            start: data.createdAt.toISOString(),
            end: null,
          },
        },
        updatedAt: {
          date: {
            start: data.updatedAt.toISOString(),
            end: null,
          },
        },
      };
      this.children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            text: [
              {
                type: 'text',
                text: {
                  content: data.description,
                },
              },
            ],
          },
        },
      ];
      // this.children = content ?? undefined;

      return { ...this };
    }
  }

  export interface Response extends Notion.Page.Response {}
}

export interface CustomIssue extends Issue {
  type: 'todo' | 'should' | 'must' | 'note';
  checked: boolean;
  comment?: CustomComment;
}

export namespace CustomIssue {
  export interface Request {
    parent: {
      database_id: string;
    };
    properties: {
      이슈: {
        title: [Notion.Text.Request];
      };
      Test?: Notion.Date.Request;
      Check?: Notion.Checkbox.Request;
    };
    children?: Notion.Block.Request[];
  }

  export interface Response extends Notion.Page.Response {}
}

export interface CustomComment extends Comment {
  id: string;
  label?: string;
  body: string | MarkdownString;
  mode: CommentMode;
  author: CommentAuthorInformation;
  parent?: CommentThread;
  contextValue?: string;
}
