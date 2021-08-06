import Axios from 'axios';

import config, { notion } from '../config';
import { Issue } from '../models/custom';
import { Notion } from '../models/notion';

// import type { Notion } from '../models/notion';
import type { CustomIssue } from '../models/custom';

const AxiosInstance = Axios.create({
  baseURL: notion.url,
  headers: {
    'Content-Type': 'application/json',
    'Notion-Version': notion.version,
  },
});

AxiosInstance.interceptors.request.use(async (config) => {
  if (notion.authorization) {
    config.headers.common.Authorization = notion.authorization;
  }
  return config;
});

AxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.warn(
      '[Axios] Error: ',
      error.response && error.response.data && error.response.data.message,
    );
    return Promise.reject(error);
  },
);

export default {
  sayHello: async (delay = 1000) =>
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('Hello');
      }, delay);
    }),
  getDatabase: async (): Promise<string> =>
    await new Promise(async (resolve, reject) => {
      const a = await Axios.get<Notion.Database.Response>(
        notion.url + '/databases/' + notion.databaseId,
        {
          headers: {
            Authorization: notion.authorization,
            'Notion-Version': notion.version,
          },
        },
      );
      console.log('[notion] getDatabase() result: ', a);
      resolve(JSON.stringify(a.data));
    }),
  postPage: async (request: CustomIssue.Request): Promise<string> =>
    await new Promise(async (resolve, reject) => {
      try {
        resolve(
          await Axios.post(notion.url + '/pages/', request, {
            headers: {
              Authorization: notion.authorization,
              'Content-Type': 'application/json',
              'Notion-Version': notion.version,
            },
          }),
        );
      } catch (e) {
        console.log('error: ', e);
        reject(e);
      }
    }),
  postIssue: async (issues: Issue[]): Promise<string> =>
    await new Promise(async (resolve, reject) => {
      try {
        console.log(
          `trying: ${notion.url}`,
          new Issue.Request(issues[0], config.notion.databaseId),
        );
        await Promise.all(
          issues.map((issue) =>
            AxiosInstance.post(
              '/pages/',
              new Issue.Request(issue, config.notion.databaseId),
              {
                withCredentials: true,
              },
            ),
          ),
        );
        resolve('done');
      } catch (e) {
        console.log('error: ', { ...e });
        reject(e);
      }
    }),
  postPageOld: async (): Promise<string> =>
    await new Promise(async (resolve, reject) => {
      try {
        const a = await Axios.post(
          notion.url + '/pages/',
          {
            parent: {
              database_id: notion.databaseId,
            },
            properties: {
              이름: {
                title: [
                  {
                    text: {
                      content: 'Testing Complete!',
                    },
                  },
                ],
              },
              Test: {
                date: {
                  start: new Date().toISOString(),
                  end: null,
                },
              },
              Check: {
                checkbox: true,
              },
            },
            children: [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                  text: [
                    {
                      type: 'text',
                      text: {
                        content: 'Lacinato kale',
                      },
                    },
                  ],
                },
              },
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  text: [
                    {
                      type: 'text',
                      text: {
                        content:
                          'Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.',
                        link: {
                          url: 'https://en.wikipedia.org/wiki/Lacinato_kale',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
          {
            headers: {
              Authorization: notion.authorization,
              'Content-Type': 'application/json',
              'Notion-Version': notion.version,
            },
          },
        );
        console.log('[notion] postDatabase() result: ', a);
        resolve(JSON.stringify(a.data));
      } catch (e) {
        console.warn('[notion] error on postDatabase(): ', JSON.stringify(e));
      }
    }),
};
