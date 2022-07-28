import _ from 'lodash';
import { HttpRequest } from './http';
import { AxiosRequestConfig } from 'axios';
import { AxiosResponseEx } from './types';

let baseResourceActions = {
  get: { method: 'GET' },
  save: { method: 'POST' },
  query: { method: 'GET' },
  update: { method: 'PATCH' },
  remove: { method: 'DELETE' },
  delete: { method: 'DELETE' }
};

function opts(action, args, _name) {
  let options = _.assign({}, action),
    params = {},
    body,
    _options = {};
  switch (args.length) {
    case 3:
      params = args[0];
      body = args[1];
      _options = args[2];
      break;
    case 2:
      if (/^(POST|PUT|PATCH|DELETE)$/i.test(options.method)) {
        params = args[0];
        body = args[1];
      } else {
        params = args[0];
        _options = args[1];
      }
      break;
    case 1:
      if (/^(POST|PUT|PATCH)$/i.test(options.method)) {
        body = args[0];
      } else {
        params = args[0];
      }
      break;
    case 0:
      break;
    default:
      throw 'Expected up to 3 arguments [params, body,_options], got ' + args.length + ' arguments';
  }
  options.data = body;
  options.params = _.assign({}, options.params, params);
  return _.merge(options, _options);
}

export interface ResourceMethod {
  <T = any>(
    params?: { [propName: string]: string } | URLSearchParams,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponseEx<T>>;
}

export interface IResource {
  get?: ResourceMethod;
  save?: ResourceMethod;
  query?: ResourceMethod;
  update?: ResourceMethod;
  remove?: ResourceMethod;
  delete?: ResourceMethod;
  [custMethod: string]: ResourceMethod;
  $ignoreTopEntity?: any;
}

export interface ResourceActions {
  [methodName: string]: AxiosRequestConfig;
}

export function Resource(url: string, actions?: ResourceActions, _options?: any): IResource {
  let resource: IResource = {};
  let options = _options || {};

  actions = _.assign({}, baseResourceActions, actions);

  _.forIn(actions, (action, name) => {
    action = _.merge(
      {
        url: url
      },
      action
    );
    resource[name] = function() {
      // eslint-disable-next-line prefer-rest-params
      let args = Array.prototype.slice.call(arguments);
      let httpConfig = opts(action, args, name);
      let baseUrl = options.root || options.baseUrl;

      let httpRequest = new HttpRequest(baseUrl, options);
      return httpRequest.request(httpConfig);
    };
  });
  //忽略当前请求的topEntity的header设置
  resource.$ignoreTopEntity = function() {
    Object.assign(options, { $ignoreTopEntity: true });
  };
  return resource;
}
