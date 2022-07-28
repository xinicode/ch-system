import { DefaultInterceptorType, RequestConfigExtend, DefaultHttpInterceptorSettings } from './types';
import { Session } from '../security/session';
import { ConfigHelper } from '../config';
import _ from 'lodash';
import { Messager } from '../common/messager';
import Axios, { AxiosError, AxiosResponse } from 'axios';
import { Utils } from '../common/utils';
import querystring from 'query-string';
import { HttpRequest } from './http';

let pendingRequests: Map<string, boolean> = new Map();

let obj = {};
let isLogining = false;
function showError(error: any, errorShowType: string | boolean) {
  if (errorShowType == 'popup') {
    if (error.key) {
      Utils.smartAction(
        obj,
        error.key,
        () => {
          Messager.error(error);
        },
        500
      );
    } else {
      Messager.error(error);
    }
  } else if (errorShowType == 'log') {
    console.error(error);
  } else {
    if (!error.desc && error.content) {
      error['desc'] = error.content;
    }
    if (error.key) {
      Utils.smartAction(
        obj,
        error.key,
        () => {
          Messager.notice(error, 'warning');
        },
        500
      );
    } else {
      Messager.notice(error, 'warning');
    }
  }
}

export function resolveResponseError(error: AxiosError) {
  let message = '服务器处理异常';
  if (Axios.isCancel(error) || !error.response) {
    message = error.message;
    return message;
  }

  let response = error.response;
  if (error.config && !response) {
    message += '服务器异常，地址：' + error.config.url;
  }

  if (response.status == 0) {
    message = '请求出现异常，请检查网络连接';
  } else if (response.status == 404) {
    message = '资源不存在';
  } else if (response.status == 403) {
    message = '您没有此操作权限';
  } else if (response.status >= 400) {
    let errorData = response.data;
    message = response.statusText;
    if (errorData.error) {
      message = errorData.error;
    }
    if (errorData.message) {
      message = errorData.message;
    }
  }
  return message;
}

/**
 * 默认处理处理程序
 */
export const DefaultResponseErrorHandler = {
  name: DefaultInterceptorType.DefaultResponseError.toString(),
  handler: (error: AxiosError): boolean | Promise<any> => {
    let requestConfig: any = error.config;
    if (!requestConfig || Axios.isCancel(error)) {
      throw error;
    }
    let errorHandler = requestConfig['onError'];
    let errorShowType: string | boolean = 'notice'; //ignore、popup、notice；
    if (errorHandler) {
      errorShowType = errorHandler;
      if (typeof errorHandler == 'function') {
        errorShowType = errorHandler(error);
      }
      if (errorShowType === true || errorShowType === 'ignore') {
        return true;
      }
    }

    let errorMsg = resolveResponseError(error);

    let response = error.response;
    if (!response) {
      showError(
        {
          key: true,
          title: '系统提示',
          content: errorMsg,
          duration: 10
        },
        errorShowType
      );
      throw error;
    }
    if (response.status == 404) {
      //not found
      console.log(`${response.config.url} is 404`);
      response['rawData'] = response.data;
      response.data = null;
      return Promise.resolve(response);
    } else if (response.status >= 400) {
      if (response.status == 403) {
        showError(
          {
            key: 403,
            title: '系统提示',
            content: errorMsg,
            duration: 10
          },
          errorShowType
        );
      } else if (response.status == 400) {
        showError(
          {
            key: 400,
            title: '系统提示',
            content: errorMsg,
            duration: 10
          },
          errorShowType
        );
      } else {
        showError(
          {
            key: true,
            title: '系统提示',
            content: '服务器异常:' + errorMsg,
            duration: 10
          },
          errorShowType
        );
      }
    } else if (response.status == 0) {
      console.error(response.data);
      showError(
        {
          key: true,
          title: '系统提示',
          content: '请求出现异常，请检查网络连接！',
          duration: 10
        },
        errorShowType
      );
    }
    return true;
  }
};

let unauthorizedRequestList = [];
const debounceRefreshToken = _.debounce((resolve, reject) => {
  Session.refreshToken().then((success) => {
    let clonedRequest = _.clone(unauthorizedRequestList);
    unauthorizedRequestList = [];
    if (!success) {
      reject('token fresh failed');
      Session.doLogin(window.location.href);
      return;
    }
    for (const requestInfo of clonedRequest) {
      resolve(new HttpRequest().send(requestInfo.config));
    }
  });
}, 300);

export const DefaultUnauthorizedError = {
  name: DefaultInterceptorType.UnauthorizedError.toString(),
  handler: (error: AxiosError) => {
    let response = error.response;
    if (response && response.status == 401) {
      let sessionDetail = Session.getSessionDetail();
      if (sessionDetail.token && sessionDetail.token.refreshToken) {
        return new Promise((resolve, reject) => {
          let retry = error.config['retry'] || 1;
          if (retry >= 3) {
            reject(`连续刷新${retry}失败`);
            return;
          }
          error.config['retry'] = retry + 1;
          unauthorizedRequestList.push(error);
          debounceRefreshToken(resolve, reject);
        });
      }
      let route: any = Session.doLogin(window.location.href);
      if (route && !isLogining) {
        isLogining = true;
        window.setTimeout(() => {
          isLogining = false;
          window.location.href = '#' + route.path;
        }, 100);
      }
      return true;
    }
  }
};

export default {
  request: [
    {
      name: DefaultInterceptorType.DefaultRequest.toString(),
      handler: (config: RequestConfigExtend) => {
        config.headers['Cache-Control'] = 'no-cache';
        config.headers['Pragma'] = 'no-cache';
        if (config.formUrlEncoded) {
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          config.data = querystring.stringify(config.data);
        }
      }
    },
    {
      name: DefaultInterceptorType.RequestUrlProcess.toString(),
      handler: (cfg: RequestConfigExtend) => {
        let actionUrl: string = cfg.url;
        //判断是否为绝对地址
        let isAbsoluteAddress = actionUrl.indexOf('http') === 0;
        if (isAbsoluteAddress) {
          cfg.baseURL = '';
        }

        let parsedParams = [];
        actionUrl = Utils.parseUrl(actionUrl, cfg.params, parsedParams);
        if (parsedParams.length > 0) {
          _.forEach(parsedParams, (token: any) => {
            delete cfg.params[token];
          });
        }
        cfg.url = actionUrl;
      }
    },
    {
      name: DefaultInterceptorType.SSOToken.toString(),
      handler: (config: RequestConfigExtend) => {
        let token = Session.getToken();
        if (token) {
          config.headers['Authorization'] = 'Bearer ' + token;
        }
      }
    },
    {
      name: DefaultInterceptorType.HttpMethodOverride.toString(),
      handler: (config: RequestConfigExtend) => {
        let methodOverride = ConfigHelper.getConfigVal('system.http.method.override.' + config.method.toLowerCase());
        if (methodOverride) {
          config.headers['X-HTTP-Method-Override'] = config.method;
          config.method = methodOverride;
        }
      }
    },
    {
      name: DefaultInterceptorType.ShowLoading.toString(),
      handler: (config: RequestConfigExtend) => {
        if (config.showLoading || _.isUndefined(config.showLoading)) {
          let id = _.uniqueId('req');
          config.uid = id;
          pendingRequests.set(id, true);
          // 请求发送前加载中提示（延迟）
          window.setTimeout(function() {
            if (!_.isEmpty(pendingRequests)) {
              Messager.showLoading();
            }
          }, 200);
        }
      }
    }
  ],
  requestError: [
    {
      name: DefaultInterceptorType.DefaultRequestError.toString(),
      handler: (error: AxiosError) => {
        Messager.error({
          title: '系统异常',
          content: '请求发送异常，请检查网络连接！'
        });
        console.error(error);
        return false;
      }
    }
  ],
  response: [
    {
      name: DefaultInterceptorType.DefaultResponse.toString(),
      handler: (response: AxiosResponse) => {
        let config: RequestConfigExtend = response.config;
        if (config.uid) {
          pendingRequests.delete(config.uid);
          Messager.hideLoading();
        }
        return response;
      }
    }
  ],
  responseError: [
    {
      name: DefaultInterceptorType.OnResponseError.toString(),
      handler: (error: AxiosError) => {
        let requestConfig: RequestConfigExtend = error.config;
        if (requestConfig && requestConfig.uid) {
          pendingRequests.delete(requestConfig.uid);
        }
        Messager.errorLoading();
        return false;
      }
    }
  ]
} as DefaultHttpInterceptorSettings;
