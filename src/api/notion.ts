import Axios from 'axios';

import config from '../config';

export default {
  sayHello: async (delay=1000) => 
    await (new Promise((resolve) => {
      setTimeout(() => {
        console.log('saying Hello...', process.env, config);
        resolve('Hello');
      }, delay);
    })),
  
};
