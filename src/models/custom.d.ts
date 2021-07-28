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
  // class Request {
  // // export class Request implements Notion.Database.Request<IssueParser, string[]> {
  //   // parent: { database_id: string; };
  //   public properties: Issue;
  //   // children: string[];
  //   constructor(data: Issue, databaseId: string) {
  //     // this.parent = { database_id: databaseId };
  //     this.properties = data;
  //     // this.children = [data.description ?? ''];
      
  //     return { ...this };
  //   }
  // }

  export type Response = Notion.Page;
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