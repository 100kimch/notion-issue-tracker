
export namespace Notion {
  export interface Select {
    id: string;
    type: 'select';
    select: {
      id: string;
      name: string;
      color: string;
    };
  }

  export interface RichText {
    id: string;
    type: 'rich_text';
    rich_text: {
      type: 'text';
      text: {
        content: string;
        link: string | null;
      }[];
    };
  }

  export interface Date {
    id: string;
    type: 'date';
    date: {
      start: string;
      end: string | null;
    };
  }

  export namespace Date {
    export interface Request {
      date: {
        start: string;
        end: string | null;
      }
    }
  }

  export interface Url {
    id: string;
    type: 'url';
    url: string;
  }

  export interface Checkbox {
    type: 'checkbox';
    checkbox: boolean;
  }

  export namespace Checkbox {
    export interface Request {
      checkbox: boolean;
    }
  }

  export interface MultiSelect {
    id: string;
    type: 'multi_select';
    multi_select: Select[];
  }

  export interface Text {
    id: string | 'title';
    type: 'text';
    text: {
      content: string;
      link: string | null | { url: string };
    };
    annotations: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: string;
    };
    plain_text: string;
    href: string | null;
  }

  export namespace Text {
    export interface Request {
      text: {
        type: 'text';
        text: {
          content: string;
          link?: string | null | { url: string };
        };
        annotations?: {
          bold?: boolean;
          italic?: boolean;
          strikethrough?: boolean;
          underline?: boolean;
          code?: boolean;
          color?: string;
        };
        plain_text?: string;
        href?: string | null;
      }
    }
  }

  export interface Title {
    id: 'title';
    type: 'title';
    title: Text[];
  }

  export type BlockType = 'heading_1' | 'heading_2' | 'heading_3' | 'paragraph';
  export namespace Block {
    export type Request<T extends BlockType = BlockType> = {
      object: 'block';
      type: T;
      T: Text.Request;
    };
  }

  export interface Page {
    object: 'page';
    id: string;
    created_time: string;
    last_edited_time: string;
    parent?: {
      type?: 'database_id';
      database_id: string;
    };
    archived: boolean;
    properties: {
      [key: string]:
        | Select
        | RichText
        | Date
        | Url
        | Checkbox
        | MultiSelect
        | Title;
    };
  }

  export namespace Page {
    export type Request = Omit<Page, 'id' | 'created_time' | 'last_edited_time'> & {
      children: Block.Request[];
    };

    export interface Response<T> extends Page {
      object: 'page';
      id: string;
      created_time: string;
      last_edited_time: string;
      parent?: {
        type?: 'database_id';
        database_id: string;
      };
      archived: boolean;
      properties: {
        [key in keyof T]:
          | Select
          | RichText
          | Date
          | Url
          | Checkbox
          | MultiSelect
          | Title;
      }
    }
  }
}
