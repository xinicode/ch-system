import axios, { AxiosResponse } from 'axios';
import _ from 'lodash';
import { webApplication } from '../application/application';

export type AppConfig = {
  [idx in string | number]: any;
} & {
  /**
   * 远程配置Url
   */
  configUrl?: string;
  /**
   * 当前应用Api的Base Url
   */
  apiBaseUrl?: string;
  /**
   * 默认语言
   */
  locale?: string;
};

let mergedConfig: AppConfig = {
  timeDiff: 0 //与服务端的时间差
};

if (window.config) {
  mergedConfig = _.extend({ locale: 'zh-CN' }, window.config);
} else {
  console.warn('全局配置文件未引入，请通过window.config对象进行配置!');
}

function getServerConfigUrl(): string {
  if (mergedConfig.configUrl) {
    return mergedConfig.configUrl;
  }
  if (mergedConfig.apiBaseUrl) {
    return mergedConfig.apiBaseUrl + '/web.json';
  }
  return '';
}

function getConfigVal(key: string) {
  return mergedConfig[key];
}

export class ConfigCls {
  /**
   * 从远程服务器加载配置
   */
  async loadServerConfig(): Promise<AppConfig> {
    let configUrl = getServerConfigUrl();
    if (_.isEmpty(configUrl)) {
      return mergedConfig;
    }
    try {
      if (webApplication.isSubApp()) {
        configUrl = webApplication.rebuildUrlInSubApp(configUrl);
      }
      let d1 = new Date().getTime();
      let resp: AxiosResponse = await axios.get<AppConfig>(configUrl);
      mergedConfig = _.assign(mergedConfig, resp.data);
      let d2 = new Date().getTime();
      if (mergedConfig['system.currentTimestamp']) {
        mergedConfig['timeDiff'] = Math.round((d2 + d1) / 2) - mergedConfig['system.currentTimestamp'];
      }
      return mergedConfig;
    } catch (error) {
      //let msg = `配置加载信息失败：${error.config.url}`;
      let msg = `配置加载信息失败：${configUrl}`;
      console.error(msg);
      if (error.response.status == 404) {
        console.error('请确认配置服务器地址是否正确，配置地址如下：' + configUrl);
      } else {
        alert(msg);
      }
      throw error;
    }
  }
  /**
   * 根据key获取配置信息
   * @param key 配置key
   */
  getConfigVal(key: string) {
    return getConfigVal(key);
  }
  /**
   * sso登录地址
   */
  getSSOServerUrl(): string {
    let key = 'oauth2.serverUrl';
    return getConfigVal(key);
  }
  /**
   * token校验地址
   */
  getOAuth2TokenUrl(): string {
    let key = 'oauth2.tokenUrl';
    return getConfigVal(key);
  }
  /**
   * 获取授权token地址
   */
  getSSOAuthorizeUrl() {
    let key = 'oauth2.authorizeUrl';
    return getConfigVal(key);
  }
  /**
   * 应用账号
   */
  getClientId() {
    let key = 'oauth2.clientId';
    return getConfigVal(key);
  }
  /**
   * 应用密钥
   */
  getClientSecret() {
    let key = 'oauth2.clientSecret';
    return getConfigVal(key);
  }
  /**
   * sso服务端版本
   */
  getSSOVersion() {
    let key = 'oauth2.serverVersion';
    return getConfigVal(key);
  }
  /**
   * 服务端代理登录，代理地址
   */
  getAuthAccessCodeProxyUrl() {
    let key = 'oauth2.accessCode.proxyUrl';
    return getConfigVal(key);
  }
  /**
   * 获取当前用户信息
   */
  getAuthUserInfoUrl() {
    let key = 'oauth2.userInfo';
    let url = getConfigVal(key);
    if (!_.isEmpty(url)) {
      return url;
    }
    return this.getSSOServerUrl() + '/oauth2/userinfo';
  }
  /**
   * token登录方式
   */
  getOAuth2FlowType() {
    let key = 'oauth2.flow';
    let type = getConfigVal(key);
    if (!_.isEmpty(type)) {
      return type;
    }
    //计算type的默认值
    let authAccessCodeProxyUrl = this.getAuthAccessCodeProxyUrl();
    if (authAccessCodeProxyUrl != null && authAccessCodeProxyUrl.length > 0) {
      type = 'accessCodeProxy';
    } else {
      let clientSecret = this.getClientSecret();
      if (clientSecret != null && clientSecret.length > 0) {
        type = 'accessCode';
      } else {
        type = 'implicit';
      }
    }
    return type;
  }

  /**
   * 前端Cookie过期时间，单位为秒(s)，默认为1天=1440s
   */
  getCookiesExpires() {
    let key = 'cookiesExpires';
    let val = getConfigVal(key);
    if (!val) {
      val = -1;
    } else if (val === 1) {
      val = 1440;
    }
    return val;
  }

  /**
   * 获取本地登录地址
   */
  getLocalLoginUrl(): string {
    let key = 'loginUrl';
    return getConfigVal(key);
  }
  /**
   * 获取本地注销地址
   */
  getLocalLogoutUrl() {
    let key = 'logoutUrl';
    return getConfigVal(key);
  }
  /**
   * 本地登录，获取用户信息地址
   */
  getLocalUserInfoUrl() {
    let key = 'userInfoUrl';
    return getConfigVal(key);
  }
  /**
   * 判断是否为本地登录
   */
  isLocalLogin() {
    let loginLoginUrl = this.getLocalLoginUrl();
    let ssoServerUrl = this.getSSOServerUrl();
    if (_.isEmpty(ssoServerUrl) && !_.isEmpty(loginLoginUrl)) {
      return true;
    }
    return false;
  }
  /**
   * api调用接口BaseUrl
   */
  getApiBaseUrl() {
    let key = 'apiBaseUrl';
    let url = getConfigVal(key);
    if (!_.isEmpty(url)) {
      return url;
    }
    return getConfigVal('service.metad.api.endpoint');
  }
  /**
   * 网关地址
   */
  getGatewayUrl() {
    let key = 'service.gateway.endpoint';
    let url = getConfigVal(key);
    if (_.isEmpty(url)) {
      url = this.getApiBaseUrl();
    }
    return url;
  }

  /**
   * 统一用户查询
   */
  getIamEndpoint() {
    return getConfigVal('service.iam.endpoint');
  }
  /**
   * 查询当前用户详细信息接口
   */
  getUserInfoUrl() {
    let key = 'service.iam.endpoint';
    let url = getConfigVal(key);
    if (!_.isEmpty(url)) {
      return url + '/userinfo';
    }
    //未配置时，默认使用oauth2的userInfo接口
    url = this.getSSOServerUrl() + '/oauth2/userinfo';
    return url;
  }
  /**
   * 用户查询接口
   */
  getUserApiUrl() {
    let url = getConfigVal('userApiUrl');
    if (!_.isEmpty(url)) {
      return url;
    }
    let base = this.getIamEndpoint();
    if (_.isEmpty(base)) {
      return 'user';
    }
    return `${base}/user`;
  }
  /**
   * 部门查询接口
   */
  getOrgApiUrl() {
    let url = getConfigVal('orgApiUrl');
    if (!_.isEmpty(url)) {
      return url;
    }
    let base = this.getIamEndpoint();
    if (_.isEmpty(base)) {
      return 'organization';
    }
    return `${base}/organization`;
  }

  /**
   * 授权信息地址
   */
  getAuthorizeUrl() {
    return getConfigVal('authorizeUrl');
  }

  /**
   * 元数据服务接口
   */
  getMetaserviceUrl() {
    return getConfigVal('service.metabase.endpoint');
  }
  /**
   * 文件上传服务接口
   */
  getUploadUrl() {
    let key = 'service.stream.endpoint';
    return getConfigVal(key);
  }
  /**
   * 工具类服务接口
   */
  getToolEndpoint() {
    return getConfigVal('service.tool.endpoint');
  }
  /**
   * 获取路由模式history | hash
   */
  getRouterMode() {
    return getConfigVal('routerMode');
  }

  /**
   * 判断路由是不是history模式
   */
  isHistoryRouter(): boolean {
    return ConfigHelper.getRouterMode() === 'history';
  }

  /**
   * 是否支持多租户
   */
  isMultiTenant(): boolean {
    let enabled = ConfigHelper.getConfigVal('tenant.enabled');
    return enabled !== 'false' && !!enabled;
  }

  /**
   * 获取路由模式history | hash
   */
  getRouterBase(): string {
    return getConfigVal('routerBase') || '/';
  }

  /** 获取与服务器的时间差 */
  getTimeDiff() {
    return getConfigVal('timeDiff') || 0;
  }

  /**
   * 添加配置
   * @param key 配置项的Key
   * @param val 配置项的值
   */
  set(key: string, val: any) {
    mergedConfig[key] = val;
  }
  /**
   * 添加多个配置项
   * @param items 配置项
   */
  addAll(items: { [propName: string]: any }) {
    mergedConfig = _.assign(mergedConfig, items);
  }
  /**
   * 获取所有配置项
   */
  items(): AppConfig {
    return mergedConfig;
  }
  shouldCheckLogin() {
    return getConfigVal('shouldCheckLogin') || false;
  }
}

export const ConfigHelper = new ConfigCls();
