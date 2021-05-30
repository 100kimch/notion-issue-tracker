import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname + '/.env') });
console.log('dotenv initialized', process.env);

declare module NodeJS {
  interface ProcessEnv {
    testing: string;
  }
  // env: {
  //   NOTION_URL: string;
  //   NOTION_VERSION: string;
  // }
}

export default {
  notion: {
    token: process.env.NOTION_URL
  }
};