import { AxiosRequestConfig } from 'axios';
import { ConfigHelper } from '../config';
import _ from 'lodash';
import { HttpRequest } from './http';
import { Utils } from '../common/utils';
import { AxiosResponseEx, Consumer0, CrudService, HttpInterceptor, RestResponseMapper } from './types';

/**
 * 实现标准的RestService，一般与后端的controller对应
 */
export class RestService implements CrudService {
  urlPattern: string;
  baseURL: string | Consumer0<string>;
  config: AxiosRequestConfig;
  errorHandler: string | boolean | HttpInterceptor;
  responseMapper: RestResponseMapper;
  /**
   * @param urlPattern 资源基础路径，如:user{/id}
   * @param baseURL  资源的BaseUrl，可以直接设置，或指定config中key，或处理器
   * @param config   http请求的其它配置项，见：AxiosRequestConfig
   */
  constructor(urlPattern: string, baseURL?: string | Consumer0<string>, config?: AxiosRequestConfig) {
    this.urlPattern = urlPattern;
    this.baseURL = baseURL;
    this.config = config;
  }

  /**
   *
   * 请求误处理onError，仅影响当前请求（只生效一次），默认以warning方式弹出错误信息
   * handler: true 忽略错误
   * handler: 'log' 在控制台打印错误日志
   * handler: 'popup' 弹出显示错误
   * handler: function 错误处理程序
   */
  public onError(handler: string | boolean | HttpInterceptor) {
    this.errorHandler = handler;
    return this;
  }

  /**
   * 设置请求结果的转换器
   * @param mapper 请求结果转换器
   */
  public mapper(mapper: RestResponseMapper) {
    this.responseMapper = mapper;
    return this;
  }

  /**
   * 获取内置的HttRequest对象
   */
  get http(): HttpRequest {
    let base = this.baseURL;
    if (this.baseURL) {
      if (_.isString(this.baseURL)) {
        let fromConfig = ConfigHelper.getConfigVal(this.baseURL);
        if (fromConfig) {
          base = fromConfig;
        }
      }
      if (_.isFunction(this.baseURL)) {
        base = this.baseURL();
      }
    }
    let requestConfig = Object.assign({}, this.config);
    if (this.errorHandler) {
      requestConfig['onError'] = this.errorHandler;
      this.errorHandler = null;
    }
    let request = new HttpRequest(<string>base, requestConfig);
    if (this.responseMapper) {
      request.mapper(this.responseMapper);
    }
    return request;
  }

  /**
   * 根据id获取记录
   * @param id - 记录Id或者query参数
   * @param config - 请求配置项，见: AxiosRequestConfig
   */
  get<T = any>(id?: string | URLSearchParams, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let mergedConfig = this.mergeParams(id, config);
    return this.http.get(this.urlPattern, mergedConfig);
  }

  /**
   * 查询数据
   * @param queryParams query的查询参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  query<T = any>(
    queryParams?: { [propName: string]: any } | URLSearchParams,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponseEx<T>> {
    if (!queryParams) {
      queryParams = {};
    }
    let mergedConfig = this.mergeParams(queryParams, config);
    return this.http.get(this.urlPattern, mergedConfig);
  }

  /**
   * 使用post，新建数据
   * @param queryParams query参数，如果data和config为空，则自动转为body参数
   * @param data body参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  create<T = any>(
    queryParams: { [propName: string]: any } | URLSearchParams,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponseEx<T>> {
    if (!config && !data) {
      data = queryParams;
      queryParams = {};
    }
    let mergedConfig = this.mergeParams(queryParams, config);
    return this.http.post(this.urlPattern, data, mergedConfig);
  }

  /**
   * 使用patch，更新数据
   * @param queryParams id，或query参数，如果data和config为空，则自动转为body参数
   * @param data body参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  update<T = any>(
    queryParams: string | { [propName: string]: any } | URLSearchParams,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponseEx<T>> {
    if (_.isString(queryParams)) {
      queryParams = { id: queryParams };
    }
    if (!config && !data) {
      data = queryParams;
      queryParams = {};
    }
    let mergedConfig = this.mergeParams(queryParams, config);
    return this.http.patch(this.urlPattern, data, mergedConfig);
  }

  /**
   * 使用delete，删除数据
   * @param id  id id或query参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  delete<T = any>(id: string | URLSearchParams, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let mergedConfig = this.mergeParams(id, config);
    return this.http.delete(this.urlPattern, mergedConfig);
  }

  /**
   * 生成新的rest-service
   * @param relativePath 子路径，相对当前rest-service的urlPattern
   * @param params 实例化路径参数
   */
  nest(relativePath: string, params?: string | { [propName: string]: any }) {
    let url = Utils.mergePath(this.urlPattern, relativePath);
    if (params) {
      if (_.isString(params)) {
        params = { id: params };
      }
      url = Utils.parseUrl(url, params);
    }
    return new RestService(url, this.baseURL, this.config).mapper(this.responseMapper);
  }

  /**
   * 使用post，新建数据
   * @param queryParams query参数，如果data和config为空，则自动转为body参数
   * @param data body参数
   * @param config 请求配置项，见: AxiosRequestConfig
   * @deprecated 使用 create方法
   */
  save<T = any>(
    queryParams: { [propName: string]: any } | URLSearchParams,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponseEx<T>> {
    if (!config && !data) {
      data = queryParams;
      queryParams = {};
    }
    let mergedConfig = this.mergeParams(queryParams, config);
    return this.http.post(this.urlPattern, data, mergedConfig);
  }

  /**
   * 使用delete，删除数据
   * @param id id或query参数
   * @param config  请求配置项，见: AxiosRequestConfig
   * @deprecated 使用delete方法
   */
  remove<T = any>(id: string | URLSearchParams, config?: AxiosRequestConfig): Promise<AxiosResponseEx<T>> {
    let mergedConfig = this.mergeParams(id, config);
    return this.http.delete(this.urlPattern, mergedConfig);
  }

  private mergeParams(
    params: string | { [propName: string]: any } | URLSearchParams = {},
    config: AxiosRequestConfig = {}
  ) {
    config.params = config.params || {};
    let queryParams: any = {};
    if (_.isString(params)) {
      queryParams['id'] = params;
    } else {
      queryParams = params;
    }

    Object.assign(config.params, queryParams);
    return config;
  }
}
