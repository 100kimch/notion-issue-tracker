type RequestType<T> = Omit<T, 'id' | 'type' | 'options' | 'object' | 'created_time' | 'last_edited_time' | 'archived'>;

export namespace Notion {
  export namespace Select {
    interface SelectPart {
      id: string;
      name: string;
      color: string;
    }
    export interface Response {
      id: string;
      type: 'select';
      select: SelectPart;
      options: SelectPart[];
    }

    export interface Request extends Omit<RequestType<Response>, 'select'> {
      select: {
        name: string;
        color?: string;
      }
    }
  }

  export namespace Date {
    export interface Response {
      id: string;
      type: 'date';
      date: {
        start: string;
        end: string | null;
      };
    }
    export interface Request extends RequestType<Response> { }
  }

  export namespace Url {
    export interface Response {
      id: string;
      type: 'url';
      url: string;
    }

    export interface Request extends RequestType<Response> { }
  }

  export namespace Checkbox {
    export interface Response {
      id: string;
      type: 'checkbox';
      checkbox: boolean;
    }
    export interface Request extends RequestType<Response> { }
  }

  export namespace MultiSelect {
    export interface Response {
      id: string;
      type: 'multi_select';
      multi_select: Select.Response[];
    }

    export interface Request extends RequestType<Response> { }
  }

  export namespace Number {
    export interface Response {
      id: string;
      type: 'number';
      number: {
        format: string;
      }
    }

    export interface Request extends Omit<RequestType<Response>, 'number'> {
      number: number;
    }
  }

  export namespace Text {
    export interface Response {
      id: string;
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

    interface Request extends Partial<Omit<RequestType<Response>, 'text'>> {
      type?: 'text',
      text: {
        content: string;
        link?: string | null | { url: string };
      }
    }
  }

  export namespace RichText {
    export interface Response {
      id: string;
      type: 'rich_text';
      text: Text.Response[];
    }

    export interface Request extends Omit<RequestType<Response>, 'text'> {
      rich_text: Text.Request[];
    }
  }

  export namespace Title {
    export interface Response {
      id: 'title';
      type: 'title';
      title: Text.Response[];
    }
    export interface Request extends Omit<RequestType<Response>, 'title'> {
      title: Text.Request[];
    }
  }

  export type BlockType = 'heading_1' | 'heading_2' | 'heading_3' | 'paragraph';
  export namespace Block {
    export type Request<T extends BlockType = BlockType> = {
      object: 'block';
      type: T;
      T: Text.Request;
    };
  }

  export namespace Page {
    export interface Response {
      object: 'page';
      id: string;
      created_time: string;
      last_edited_time: string;
      parent: {
        type: 'database_id';
        database_id: string;
      };
      archived: boolean;
      properties: {
        [key: string]:
          | Select.Response
          | RichText.Response
          | Date.Response
          | Url.Response
          | Checkbox.Response
          | MultiSelect.Response
          | Title.Response
          | Number.Response
      };
    }

    export type Request<T = {[key: string]: any}> = {
      parent: {
        database_id: string;
      }
      properties: Partial<Record<keyof T,
        | Select.Request
        | RichText.Request
        | Date.Request
        | Url.Request
        | Checkbox.Request
        | MultiSelect.Request
        | Title.Request
        | Number.Request
      >>
    }
  }

  export namespace Database {
    export interface Response {
      object: 'database',
      id: string;
      created_time: string;
      last_edited_time: string;
      title: Text.Response[];
      properties: {
        [key: string]: {
          id: string;
          name?: string;
          type: string;
        }
      };
    }
  }
}
