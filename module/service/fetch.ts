import mvueCore from '@ch/core';

const fetch = mvueCore.http;
/**
 * get 请求
 * @param url 请求地址
 * @param params 请求参数
 */
export const getData = (url, params?:any):Promise<any> => {
  if(params === null) {
    return fetch.get(url);
  }
  return fetch.get(url, {
    method: "get",
    params
  });
};
/**
 * post 请求
 * @param url 请求地址
 * @param params 请求参数
 */
const postData = (url, params) => {
  return fetch.post(url, params, {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });
};
