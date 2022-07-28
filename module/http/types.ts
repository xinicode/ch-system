import { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

export enum DefaultInterceptorType {
  DefaultRequest,
  RequestUrlProcess,
  SSOToken,
  HttpMethodOverride,
  ShowLoading,
  DefaultRequestError,
  DefaultResponse,
  OnResponseError,
  UnauthorizedError,
  DefaultResponseError
}

/**
 * 扩展AxiosRequestConfig
 */
export interface RequestConfigExtend extends AxiosRequestConfig {
  uid?: string;
  showLoading?: boolean;
  query?: { [key: string]: any };
  formUrlEncoded?: boolean;
  [index: string]: any;
}

export interface HttpInterceptor {
  (param: AxiosError | RequestConfigExtend): boolean | RequestConfigExtend | void | AxiosResponse;
}

export interface Consumer0<R> {
  (): R;
}
export interface Consumer1<P, R> {
  (param: P): R;
}

export enum HttpInterceptorType {
  request,
  requestError,
  response,
  responseError
}

export interface HttpNamedInterceptor {
  name: string;
  handler: HttpInterceptor;
}

export interface DefaultHttpInterceptorSettings {
  request: Array<HttpNamedInterceptor>;
  requestError: Array<HttpNamedInterceptor>;
  response: Array<HttpNamedInterceptor>;
  responseError: Array<HttpNamedInterceptor>;
  [index: string]: Array<HttpNamedInterceptor>;
}

/**
 * 远程接口调用返回
 */
export interface RestResponse<T = any> {
  data: T;
  success: boolean;
  errorText?: string;
  error?: any;
  total?: number;
}

export interface RestResponseMapper {
  <T = any>(response: Promise<AxiosResponse<T>>): Promise<AxiosResponseEx<T>>;
}

export interface AxiosResponseEx<T = any> extends RestResponse<T>, AxiosResponse<T> {
  [propName: string]: any;
}

export interface CrudService {
  /**
   * 根据id获取记录
   * @param id - 记录Id或者query参数
   * @param config - 请求配置项，见: AxiosRequestConfig
   */
  get?<T = any>(id?: string | URLSearchParams, config?: AxiosRequestConfig): Promise<RestResponse<T>>;

  /**
   * 查询数据
   * @param queryParams query的查询参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  query?<T = any>(
    queryParams?: { [propName: string]: any } | URLSearchParams,
    config?: AxiosRequestConfig
  ): Promise<RestResponse<T>>;

  /**
   * 使用post，新建数据
   * @param queryParams query参数，如果data和config为空，则自动转为body参数
   * @param data body参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  create?<T = any>(
    queryParams: { [propName: string]: any } | URLSearchParams,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<RestResponse<T>>;

  /**
   * 使用patch，更新数据
   * @param queryParams id，或query参数，如果data和config为空，则自动转为body参数
   * @param data body参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  update?<T = any>(
    queryParams: string | { [propName: string]: any } | URLSearchParams,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<RestResponse<T>>;

  /**
   * 使用delete，删除数据
   * @param id  id id或query参数
   * @param config 请求配置项，见: AxiosRequestConfig
   */
  delete?<T = any>(id: string | URLSearchParams, config?: AxiosRequestConfig): Promise<RestResponse<T>>;

  [propName: string]: any;
}
