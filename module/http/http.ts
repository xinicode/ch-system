import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, Method, CancelTokenSource } from 'axios';
import { webApplication } from '../application/application';
import _ from 'lodash';
import defaultInterceptors, {
  DefaultResponseErrorHandler,
  DefaultUnauthorizedError,
  resolveResponseError
} from './interceptors';
import {
  AxiosResponseEx,
  Consumer1,
  DefaultHttpInterceptorSettings,
  DefaultInterceptorType,
  HttpInterceptor,
  HttpInterceptorType,
  RequestConfigExtend,
  RestResponseMapper
} from './types';

let defaultHttpConfig = {};
const _disabledInterceptors = [];

function defaultResponseMapper<T = any>(raw: Promise<AxiosResponseEx<T>>): Promise<AxiosResponseEx<T>> {
  return new Promise<AxiosResponseEx<T>>((resove, reject) => {
    raw
      .then((resp) => {
        let wapped = {
          success: true,
          error: null,
          errorText: null,
          total: 0,
          data: null,
          status: 0,
          statusText: null,
          headers: null,
          config: null
        } as AxiosResponseEx<T>;
        if (resp.headers) {
          let total = resp.headers['X-Total-Count'] || resp.headers['x-total-count'];
          if (total) {
            wapped.total = total;
          }
        }
        Object.assign(wapped, resp);
        resove(wapped);
      })
      .catch((err: AxiosError) => {
        let wapped = {
          success: false,
          errorText: resolveResponseError(err),
          error: err
        };
        Object.assign(wapped, err);
        reject(wapped);
      });
  });
}

export class HttpRequest {
  // 全局拦截器
  static globalInterceptors: DefaultHttpInterceptorSettings = {
    request: [],
    requestError: [],
    response: [],
    responseError: []
  };

  // 当前请求的配置信息
  baseConfig: RequestConfigExtend = _.cloneDeep(defaultHttpConfig);
  // 临时请求配置
  config: RequestConfigExtend = {};

  // 自定义拦截器
  interceptors: DefaultHttpInterceptorSettings = {
    request: [],
    requestError: [],
    response: [],
    responseError: []
  };

  // 被禁用的拦截器
  disabledInterceptors: string[] = [];

  // 返回结果转换器
  responseMapper: RestResponseMapper;

  // baseUrl func
  baseUrlFunc: Consumer1<RequestConfigExtend, string>;

  constructor(baseURL?: string | Consumer1<RequestConfigExtend, string>, config?: AxiosRequestConfig) {
    if (config) {
      this.baseConfig = _.assign(this.baseConfig, config);
    }
    if (typeof baseURL == 'string') {
      this.baseConfig.baseURL = baseURL;
    } else if (typeof baseURL === 'function') {
      this.baseUrlFunc = baseURL;
    }
    this.disabledInterceptors = _.cloneDeep(_disabledInterceptors);
  }

  /**
   *
   * @param url 设置请求的baseURL
   */
  baseURL(url: string | Consumer1<RequestConfigExtend, string>) {
    if (typeof url === 'function') {
      this.baseUrlFunc = url;
    } else {
      this.baseConfig.baseURL = url;
    }
    return this;
  }

  //添加原型上的interceptor，所有HttpRequest公有
  public static addGlobalInterceptor(type: HttpInterceptorType, handler: HttpInterceptor): string {
    let uid = _.uniqueId('http');
    let typeStr = HttpInterceptorType[type];
    let handlers = HttpRequest.globalInterceptors[typeStr];
    if (handlers) {
      handlers.push({
        name: uid,
        handler: handler
      });
    }
    return uid;
  }

  /**
   * 全局禁用内置的拦截器类型
   * @param type 要禁用的内置拦截器类型
   */
  static disableInterceptor(type: DefaultInterceptorType) {
    let uid = type.toString();
    _disabledInterceptors.push(uid);
  }

  public static setGlobalDefaults(config: AxiosRequestConfig) {
    defaultHttpConfig = Object.assign(defaultHttpConfig, config);
  }

  /**
   * 禁用内置的拦截器类型
   * @param type 要禁用的内置拦截器类型
   */
  public disableInterceptor(type: DefaultInterceptorType): HttpRequest {
    let uid = type.toString();
    this.disabledInterceptors.push(uid);
    return this;
  }

  /**
   * 判断指定的拦截器是否被禁用
   * @param interceptorName  拦截器名称
   */
  public isInterceptorDisabled(interceptorName: string): boolean {
    let existed = this.disabledInterceptors.find((item) => item == interceptorName);
    if (existed) {
      return true;
    }
    return false;
  }

  /**
   * 忽略请求错误，请求错误时，不再弹出错误信息
   */
  public ignoreError() {
    this.disableInterceptor(DefaultInterceptorType.DefaultResponseError);
    return this;
  }

  /**
   * 流程错误处理onError，仅影响当前请求，默认以warning方式弹出错误信息
   * handler: true 忽略错误
   * handler: 'log' 在控制台打印错误日志
   * handler: 'popup' 弹出显示错误
   * handler: function 错误处理程序
   */
  public onError(handler: string | boolean | HttpInterceptor) {
    this.config['onError'] = handler;
    return this;
  }

  public mapper(mapper: RestResponseMapper) {
    this.responseMapper = mapper;
    return this;
  }

  /**
   * 添加请求拦截器
   * @param type 拦截器类型
   * @param handler 拦截器处理方法
   */
  public addInterceptor(type: HttpInterceptorType, handler: HttpInterceptor): string {
    let uid = _.uniqueId('http');
    let typeStr = HttpInterceptorType[type];
    let handlers = this.interceptors[typeStr];
    if (handlers) {
      handlers.push({
        name: uid,
        handler: handler
      });
    }
    return uid;
  }

  public removeInterceptor(uid: string): HttpRequest {
    for (let enumMember in HttpInterceptorType) {
      let isValueProperty = parseInt(enumMember, 10) >= 0;
      if (isValueProperty) {
        continue;
      }
      let prop = enumMember;
      let matched = -1;
      _.forEach(this.interceptors[prop], (interceptor, index) => {
        if (uid == interceptor.name) {
          matched = index;
          return false;
        }
        return true;
      });
      if (matched > -1) {
        this.interceptors[prop].splice(matched, 1);
        break;
      }
    }
    return this;
  }

  public params(params: { [propName: string]: string } | URLSearchParams): HttpRequest {
    if (!this.config.params) {
      this.config.params = {};
    }
    _.assign(this.config.params, params);
    return this;
  }

  public body(data: any) {
    this.config.data = data;
    return this;
  }

  public headers(headers: { [propName: string]: string }): HttpRequest {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    _.assign(this.config.headers, headers);
    return this;
  }

  public method(method: Method): HttpRequest {
    this.config.method = method;
    return this;
  }

  public loading(showLoading: boolean): HttpRequest {
    this.config.showLoading = showLoading;
    return this;
  }

  public formUrlEncoded(formUrlEncoded: boolean): HttpRequest {
    this.config.formUrlEncoded = formUrlEncoded;
    return this;
  }

  public url(url: string) {
    this.config.url = url;
    return this;
  }

  public http(): AxiosInstance {
    let cfg = this.baseConfig;
    if (this.baseUrlFunc) {
      cfg = Object.assign({ baseURL: null }, this.baseConfig);
      cfg.baseURL = this.baseUrlFunc(cfg);
    }
    let http = Axios.create(cfg);
    http.interceptors.request.use(
      async (config) => {
        let requestInterceptors = [
          ...defaultInterceptors.request,
          ...this.interceptors.request,
          ...HttpRequest.globalInterceptors.request
        ];
        for (let interceptor of requestInterceptors) {
          if (this.isInterceptorDisabled(interceptor.name)) {
            continue;
          }
          await interceptor.handler(config);
        }
        return config;
      },
      (error) => {
        let requestErrorInterceptors = [
          ...defaultInterceptors.requestError,
          ...this.interceptors.requestError,
          ...HttpRequest.globalInterceptors.requestError
        ];
        for (let interceptor of requestErrorInterceptors) {
          if (this.isInterceptorDisabled(interceptor.name)) {
            continue;
          }
          let suspend = interceptor.handler(error);
          if (suspend === true) {
            break;
          }
        }
        Promise.reject(error);
      }
    );
    http.interceptors.response.use(
      async (response) => {
        let resp = response;
        let responseInterceptors = [
          ...defaultInterceptors.response,
          ...this.interceptors.response,
          ...HttpRequest.globalInterceptors.response
        ];
        for (let interceptor of responseInterceptors) {
          if (this.isInterceptorDisabled(interceptor.name)) {
            continue;
          }
          let val = await interceptor.handler(resp);
          if (val instanceof Object) {
            resp = <AxiosResponse>val;
          }
        }
        return resp;
      },
      (error) => {
        let responseErrorInterceptors = [
          ...defaultInterceptors.responseError,
          ...this.interceptors.responseError,
          ...HttpRequest.globalInterceptors.responseError,
          DefaultUnauthorizedError,
          DefaultResponseErrorHandler
        ];
        for (let interceptor of responseErrorInterceptors) {
          if (this.isInterceptorDisabled(interceptor.name)) {
            continue;
          }
          let suspend = interceptor.handler(error);
          if (suspend === true) {
            break;
          } else if (suspend instanceof Promise) {
            return suspend;
          }
        }
        return Promise.reject(error);
      }
    );
    return http;
  }

  /**
   * 获取Axios的CancelTokenSource
   */
  public cancelTokenSource(): CancelTokenSource {
    return Axios.CancelToken.source();
  }

  public request<T = any>(config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(null, null, config);
    return this.send(cfg);
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, null, config);
    cfg.method = 'GET';
    return this.send(cfg);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, null, config);
    cfg.method = 'DELETE';
    return this.send(cfg);
  }

  public head<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, null, config);
    cfg.method = 'HEAD';
    return this.send(cfg);
  }

  public options<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, null, config);
    cfg.method = 'OPTIONS';
    return this.send(cfg);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, data, config);
    cfg.method = 'POST';
    return this.send(cfg);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, data, config);
    cfg.method = 'PUT';
    return this.send(cfg);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let cfg = this.buildHttpConfig(url, data, config);
    cfg.method = 'PATCH';
    return this.send(cfg);
  }

  public send<T = any>(config: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let http = this.http();

    //转换请求结果
    let mp = this.responseMapper;
    if (!mp) {
      mp = defaultResponseMapper;
    }
    return mp(http.request(config));
  }

  public mergeHttpConfig<T extends AxiosRequestConfig>(source: RequestConfigExtend, target: T): RequestConfigExtend {
    _.forIn(target, (val, key) => {
      if (key == 'params' || key == 'headers') {
        source[key] = _.merge(source[key], val);
      } else {
        source[key] = val;
      }
    });
    return source;
  }

  private rebuildUrlInSubApp(cfg) {
    let url = cfg.url;
    if (!url) {
      return;
    }
    if (webApplication.isSubApp()) {
      cfg.baseURL = webApplication.rebuildUrlInSubApp(cfg.baseURL);
    }
  }

  public buildHttpConfig(url?: string, data?: any, config?: AxiosRequestConfig): RequestConfigExtend {
    let cfg = _.assign({}, this.baseConfig, this.config);
    if (config) {
      cfg = this.mergeHttpConfig(cfg, config);
    }

    if (data) {
      cfg.data = data;
    }
    if (url) {
      cfg.url = url;
    }
    this.rebuildUrlInSubApp(cfg);
    this.config = {};
    return cfg;
  }
  //忽略当前请求的topEntity的header设置
  public $ignoreTopEntity() {
    Object.assign(this.config, { $ignoreTopEntity: true });
  }
}
