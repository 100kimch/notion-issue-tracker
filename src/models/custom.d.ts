import {
  Comment,
  CommentAuthorInformation,
  CommentMode,
  CommentThread,
  MarkdownString,
} from 'vscode';

import { Notion } from './notion';

export interface Tag {
  lineNum: number;
  type: string;
  text: string;
}

export interface Issue {
  id: string;
  pageId: string | null;
  lineNum: number;
  type: string;
  description: string;
}

export namespace Issue {
  export interface Request {
    parent: {
      database_id: string;
    },
    properties: {}
    children: []
  }

  export type Response = Notion.Page;
}

export interface CustomIssue extends Issue {
  type: 'todo' | 'should' | 'must' | 'note';
  title: string;
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

  export type Response = Notion.Page.Response<CustomIssue>;
}


export interface CustomComment extends Comment {
  id: string;
	label?: string;
	body: string | MarkdownString,
	mode: CommentMode,
	author: CommentAuthorInformation,
	parent?: CommentThread,
	contextValue?: string
}