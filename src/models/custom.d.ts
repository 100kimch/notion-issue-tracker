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

export interface CustomIssue extends Issue {
  type: 'todo' | 'should' | 'must' | 'note';
  title: string;
  checked: boolean;
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