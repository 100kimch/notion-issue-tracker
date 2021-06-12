import Axios from 'axios';

import { notion } from '../config';

export default {
  sayHello: async (delay = 1000) =>
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('Hello');
      }, delay);
    }),
  getDatabase: async (): Promise<string> =>
    await new Promise(async (resolve, reject) => {
      const a = await Axios.get(notion.url + '/databases/' + notion.todoId, {
        headers: {
          Authorization: notion.authorization,
          'Notion-Version': notion.version,
        },
      });
      console.log('result: ', a);
      resolve(JSON.stringify(a.data));
    }),
};
