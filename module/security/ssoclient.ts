import _ from 'lodash';
import { ConfigHelper } from '../config';
import http, { AxiosResponse } from 'axios';
import qs from 'query-string';
import { webApplication } from '../application/application';
import { Utils } from '../common/utils';

/**
 * SSO token详细
 */
export interface TokenInfo {
  /**
   * 登录成功后，sso返回的token
   */
  accessToken?: string;
  /**
   * 刷新令牌
   */
  refreshToken?: string;
  /**
   * token过期时间，以秒为单位
   */
  expiresIn: number;
  loginTime?: Date;
  mode: string;
  modeMore?: {
    flowType: string;
  };
  user?: IUser;
  [proName: string]: any;
}

/**
 * 用户信息
 */
export interface IUser {
  userId: string;
  name: string;
  [propName: string]: any;
}

/**
 * 登录成功后的回调
 */
export interface OnLoginCallback {
  (tokenInfo: TokenInfo): void;
}

function buildLoginUrl(returnUrl, ssoClientQuery?) {
  let ssoclientUrl = window.location.href;
  if (webApplication.routerHistoryMode()) {
    let routerBase = ConfigHelper.getConfigVal('routerBase');
    ssoclientUrl = window.location.origin + routerBase + window.location.hash;
  }
  if (ssoclientUrl.includes('#')) {
    ssoclientUrl = ssoclientUrl.substring(0, ssoclientUrl.indexOf('#'));
  }
  if (webApplication.routerHistoryMode()) {
    ssoclientUrl += 'ssoclient?_d=' + new Date().valueOf();
  } else {
    ssoclientUrl += '#/ssoclient?_d=' + new Date().valueOf();
  }
  if (returnUrl) {
    ssoclientUrl += '&returnUrl=' + encodeURIComponent(returnUrl);
  }
  if (ssoClientQuery) {
    ssoclientUrl += '&' + ssoClientQuery;
  }

  if (webApplication.inIframe()) {
    ssoclientUrl += '&_iframeId=' + webApplication.frameId;
  }
  let url: string | null = '';
  if (ConfigHelper.isLocalLogin()) {
    url = buildLoginUrlForLocal(ssoclientUrl);
    if (!url) {
      console.error('SSO基础地址为空');
      return '';
    }
  } else if (ConfigHelper.getSSOVersion() == 'v2') {
    url = buildLoginUrlForV2(ssoclientUrl);
    if (!url) {
      console.error('SSO基础地址为空');
      return '';
    }
  } else {
    url = buildLoginUrlForV3(ssoclientUrl);
    if (!url) {
      console.error('SSO基础地址为空');
      return '';
    }
    if (ConfigHelper.getOAuth2FlowType() == 'implicit') {
      url += '&response_type=token';
    } else if (ConfigHelper.getOAuth2FlowType() == 'accessCode') {
      url += '&response_type=code';
    } else {
      url += '&response_type=' + encodeURIComponent('code id_token');
    }
  }
  if (!url) {
    alert('未配置配置地址');
    throw new Error('未配置配置地址');
  }
  return url;
}

/**
 * 跳转到sso登录页面
 */
function gotoLogin(returnUrl: string): { path: string } | string {
  //let pathName=window.location.pathname;
  //子应用调用主应用gotoLogin，ssoclient地址必须去掉子应用的应用前缀，才是主应用的ssoclient地址
  // if(subAppRouterBase){
  //     pathName=pathName.replace(subAppRouterBase,'');
  // }
  let url = buildLoginUrl(returnUrl);
  url += '&raw_return_url=' + encodeURIComponent(returnUrl);
  if (url.charAt(0) == '#') {
    return { path: url.substring(1) };
  } else {
    window.location.href = url;
  }
  return '';
}

function buildLoginUrlForLocal(returnUrl: string): string {
  let url = ConfigHelper.getLocalLoginUrl();
  if (!url) {
    return null;
  }
  return `${url}?return_url=${encodeURIComponent(returnUrl)}`;
}

function buildLoginUrlForV2(returnUrl: string) {
  let url = ConfigHelper.getSSOServerUrl();
  if (!url) {
    return null;
  }
  url += '/v2?openid.mode=checkid_setup&openid.ex.client_id=' + (ConfigHelper.getClientId() || 'clientId');
  url += '&openid.return_to=' + encodeURIComponent(returnUrl);
  return url;
}

function buildLoginUrlForV3(returnUrl: string): string {
  let url = ConfigHelper.getSSOAuthorizeUrl();
  if (!url) {
    url = ConfigHelper.getSSOServerUrl();
    if (!url) {
      return null;
    }
    url += '/oauth2/authorize';
  }
  if (url.charAt(0) == '#') {
    returnUrl = returnUrl.substring(returnUrl.indexOf('#'));
  }
  if (url.indexOf('?') > 0) {
    url += '&client_id=' + ConfigHelper.getClientId();
  } else {
    url += '?client_id=' + ConfigHelper.getClientId();
  }
  url += '&redirect_uri=' + encodeURIComponent(returnUrl);
  let ssoclientPath;
  if (webApplication.routerHistoryMode()) {
    ssoclientPath = 'ssoclient?logout=1&_inframe=true';
  } else {
    ssoclientPath = '#/ssoclient?logout=1&_inframe=true';
  }
  let pathName = null;
  if (webApplication.routerHistoryMode()) {
    pathName = ConfigHelper.getConfigVal('routerBase') + ssoclientPath + '?_d=' + new Date().valueOf();
  } else {
    pathName = window.location.pathname + '?_d=' + new Date().valueOf() + ssoclientPath;
  }
  url += '&logout_uri=' + encodeURIComponent(window.location.protocol + '//' + window.location.host + pathName);
  return url;
}

/**
 * 处理sso回调
 */
function onSSOCallback(callback: OnLoginCallback) {
  if (ConfigHelper.isLocalLogin()) {
    return processCallbackLocal(callback);
  }
  if (ConfigHelper.getSSOVersion() == 'v2') {
    return processCallbackForV2(callback);
  }
  return processCallbackForV3(callback);
}
function resolveCallbackParams() {
  let params = {};
  if (webApplication.routerHistoryMode()) {
    params = resolveParams(window.location.search) || {};
  } else {
    params = resolveParams(window.location.hash) || {};
  }
  return params;
}
/**
 * 本地登录成功后的处理
 * @param callback
 * @returns {Promise<TokenInfo>}
 */
function processCallbackLocal(callback: OnLoginCallback): Promise<TokenInfo> {
  let params = resolveCallbackParams();

  if (hasError(params, true)) {
    return null;
  }
  let url = ConfigHelper.getLocalUserInfoUrl() + '?_=' + new Date().getTime();
  return new Promise(function(resolve, reject) {
    http
      .get(url)
      .then(function({ data }) {
        let user: IUser = _.assign({}, data, { anonymous: false });
        let tokenInfo: TokenInfo = {
          user: user,
          mode: 'local',
          expiresIn: 7200
        };
        tokenInfo['user'] = user;
        if (callback) {
          callback(tokenInfo);
        }
        resolve(tokenInfo);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/**
 * v2流程校验serviceticket，获取access_token
 * @param callback
 */
function processCallbackForV2(callback: OnLoginCallback) {
  let params = resolveCallbackParams();
  let ticket = params['openid.ex.service_ticket'];
  let tokenUrl = ConfigHelper.getSSOServerUrl() + '/v2';
  let reqParam: any = {
    'openid.mode': 'check_authentication',
    'openid.ex.client_id': ConfigHelper.getClientId(),
    'openid.ex.client_secret': ConfigHelper.getClientSecret(),
    'openid.ex.service_ticke': ticket,
    'openid.ex.logout_url': window.location.href + '#/logout',
    'openid.ex.get_oauth_access_token': 'y'
  };

  http
    .post(tokenUrl, qs.stringify(reqParam), { responseType: 'text' })
    .then(function({ data }) {
      let arrItems = data.replace(/\r/g, '').split('\\n');
      let respMap: any = {};
      _.forEach(arrItems, function(item) {
        if (_.isEmpty(item)) {
          return;
        }
        let entry = item.split(':');
        if (entry.length != 2) {
          return;
        }
        respMap[entry[0]] = entry[1];
      });
      if (respMap['mode'] != 'ok') {
        console.error('ticket ' + ticket + ' 无效，错误信息：' + respMap['error']);
        return;
      }
      let tokenInfo: TokenInfo = {
        accessToken: respMap['ex.oauth_access_token'],
        identity: respMap['identity'],
        expiresIn: respMap['ex.oauth_access_token_expires'],
        refreshToken: respMap['ex.oauth_refresh_token'],
        user: {
          name: respMap['identity'],
          userId: respMap['identity']
        },
        mode: 'v2'
      };
      if (callback) {
        callback(tokenInfo);
      }
    })
    .catch(function(error) {
      console.log(error.response.data);
    });
}

/**
 * v3版SSO回调 ，验证accessCode获取access_token
 * @param callback
 */
function processCallbackForV3(callback: OnLoginCallback) {
  let params = resolveCallbackParams();
  if (hasError(params, true)) {
    return;
  }
  if (ConfigHelper.getOAuth2FlowType() == 'implicit') {
    return onImplictFlow(params, callback);
  } else {
    return onAccessCodeFlow(params, callback);
  }
}

/**
 * 处理隐式流程
 * @param callback
 */
function onImplictFlow(params: any, callback: OnLoginCallback) {
  let tokenInfo = {
    accessToken: params['access_token'],
    expiresIn: params['expires_in'],
    state: params['state'],
    mode: 'v3',
    modeMore: {
      flowType: 'implicit'
    },
    params: params
  };
  getUserInfo(tokenInfo).then(function(user) {
    console.log(`${user.name}login`);
    if (callback) {
      callback(tokenInfo);
    }
  });
}

function getUserInfo(tokenInfo: TokenInfo): Promise<IUser> {
  let url = Utils.appendParam(ConfigHelper.getAuthUserInfoUrl(), '_d', new Date().getTime() + '');
  if (ConfigHelper.isMultiTenant()) {
    url = Utils.appendParam(url, 'select', 'tenants');
  }
  return new Promise(function(resolve, reject) {
    http
      .get(url, { headers: { Authorization: 'Bearer ' + tokenInfo.accessToken } })
      .then(function({ data }) {
        let user = _.assign({}, data, {
          name: data['name'] || data['username'],
          userId: data['sub'],
          anonymous: false
        });
        tokenInfo['user'] = user;
        resolve(user);
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

/**
 * 处理授权码流程
 * @param callback
 */
function onAccessCodeFlow(params: any, callback: OnLoginCallback) {
  let code = params['code'];
  checkAccessCode(code, function(token) {
    let tokenInfo = {
      accessToken: token['access_token'],
      expiresIn: token['expires_in'],
      state: token['state'],
      refreshToken: token['refresh_token'],
      mode: 'v3',
      modeMore: {
        flowType: 'accessCode'
      }
    };
    getUserInfo(tokenInfo).then(function(userInfo) {
      console.log(`user:${userInfo.name}:${userInfo.userId} is logined`);
      if (callback) {
        callback(tokenInfo);
      }
    });
  });
}

function checkAccessCode(accessCode: string, callback: OnLoginCallback) {
  //优先读取自定义的tokenUrl，自定义的tokenUrl，可以不需要clientSecret
  let tokenUrl = ConfigHelper.getOAuth2TokenUrl();
  if (!tokenUrl) {
    tokenUrl = ConfigHelper.getSSOServerUrl() + '/oauth2/token';
  }
  let reqParam = {
    grant_type: 'authorization_code',
    code: accessCode
  };
  let clientId = ConfigHelper.getClientId();
  let clientSecret = ConfigHelper.getClientSecret();
  http
    .post(tokenUrl, qs.stringify(reqParam), { auth: { username: clientId, password: clientSecret } })
    .then(function({ data }) {
      if (hasError(data, true)) {
        return;
      }
      if (callback) {
        callback(data);
      }
    })
    .catch(function(error) {
      console.log(error.message);
    });
}

function hasError(resp: any, throwError: boolean) {
  if (resp['error']) {
    if (throwError) {
      alert('登录出错：' + resp['error_description']);
    }
    return true;
  }
  return false;
}

function resolveParams(url: string) {
  if (url == null || typeof url == 'undefined' || url.indexOf('?') < 0) {
    return {};
  }
  let search = url.substr(url.indexOf('?') + 1);
  let params = qs.parse(search) || {};
  return params;
}

function ssoLogout(returnUrl: string) {
  let url = '';
  if (ConfigHelper.isLocalLogin()) {
    url = ConfigHelper.getLocalLogoutUrl() + '?return_url=' + encodeURIComponent(returnUrl);
  } else {
    url = ConfigHelper.getSSOServerUrl();
    if (ConfigHelper.getSSOVersion() == 'v2') {
      url += '/v2?openid.mode=logout';
      url += '&openid.return_to=' + encodeURIComponent(returnUrl);
    } else {
      url += '/oauth2/logout?post_logout_redirect_uri=' + encodeURIComponent(returnUrl);
    }
  }
  window.location.href = url;
}

function refreshToken(tokenInfo: TokenInfo): Promise<AxiosResponse> {
  //优先读取自定义的tokenUrl，自定义的tokenUrl，可以不需要clientSecret
  let tokenUrl = ConfigHelper.getOAuth2TokenUrl();
  if (!tokenUrl) {
    tokenUrl = ConfigHelper.getSSOServerUrl() + '/oauth2/token';
  }
  let reqParam = {
    grant_type: 'refresh_token',
    refresh_token: tokenInfo.refreshToken
  };
  let clientId = ConfigHelper.getClientId();
  let clientSecret = ConfigHelper.getClientSecret();
  return http.post(tokenUrl, qs.stringify(reqParam), { auth: { username: clientId, password: clientSecret } });
}

function switchTenantRequest(tenantId) {
  let url = buildLoginUrl(null, 'switch_tenant=1');
  url = Utils.appendParam(url, 'tenant_id', tenantId);
  let ifrmId = 'changeTenant';
  let ifrm: HTMLIFrameElement = document.getElementById('changeTenant') as HTMLIFrameElement;
  if (!ifrm) {
    ifrm = document.createElement('iframe');
    ifrm.id = ifrmId;
    ifrm.style.display = 'none';
    ifrm.style.width = '0px';
    ifrm.style.height = '0px';
    document.body.appendChild(ifrm);
  }
  ifrm.src = url;
  return ifrm;
}

export class SSOClientImpl {
  gotoLogin(returnUrl: string) {
    return gotoLogin(returnUrl);
  }
  onSSOCallback(callback: OnLoginCallback) {
    onSSOCallback(callback);
  }
  ssoLogout(returnUrl: string) {
    ssoLogout(returnUrl);
  }
  refreshToken(tokenInfo: TokenInfo) {
    return refreshToken(tokenInfo);
  }
  checkLogin(): Promise<AxiosResponse> {
    let tokenCheckUrl = ConfigHelper.getSSOServerUrl() + '/login/check_login';
    return http.get(tokenCheckUrl, { withCredentials: true });
  }
  switchTenantRequest(tenantId) {
    return switchTenantRequest(tenantId);
  }
}

export const SSOClient = new SSOClientImpl();
