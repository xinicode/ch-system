/**
 * 当前会话
 */
import _ from 'lodash';
import Cookies from 'js-cookie';
import store from 'store2';
import { Utils } from '../common/utils';
import { AES, enc } from 'crypto-js';
import { TokenInfo, IUser, SSOClient } from './ssoclient';
import { Route } from 'vue-router';
import { ConfigHelper } from '../config/index';
import { PermissionService } from './permission';
import { webApplication } from '../application/application';

let encUTF8 = enc.Utf8;

let sessionKeyPrefix = '_session_';
let sessionCookieKey = 'm_vue_session_id';
let accessAtKey = sessionKeyPrefix + 'access_at';
let lastLoginTimeKey = sessionKeyPrefix + '_login_time';

//check_login标记，每次启动应用只调用一次
let loginChecked = false;

export class SessionDetail {
  sessionId: string;
  anonymous = true;
  loginTime: number;
  expires = 0;
  token: TokenInfo;
  user: IUser = {
    anonymous: true,
    name: '匿名用户',
    userId: ''
  };
  constructor() {
    this.refreshAccessAt();
  }
  /** 最后访问时间 */
  public getAccessAt() {
    return store.get(accessAtKey) || 0;
  }

  public refreshAccessAt() {
    store.set(accessAtKey, _.now().valueOf());
  }
}

export interface ILoginInterceptor {
  (session: SessionDetail): void | Promise<any>;
}

export class SessionEventManger {
  onSignIn: Array<ILoginInterceptor> = [];
  onSignOut: Array<ILoginInterceptor> = [];
}

let eventManger = new SessionEventManger();
let session = new SessionDetail();

/**
 * 实始化请求的session
 */
async function loadSession(): Promise<SessionDetail> {
  if (isLogin()) {
    return session;
  }
  if (store.has(getSessionKey())) {
    let storedSession = getStoredSession();
    if (storedSession) {
      session = storedSession;
    }
    if (isLogin()) {
      await onSignIn(session);
    } else {
      session = new SessionDetail();
    }
  }
  return session;
}

/**
 * 判断当前会话是否登录
 * @returns {boolean}
 */
function isLogin(): boolean {
  let sessionId = Cookies.get(sessionCookieKey);
  if (_.isEmpty(sessionId) || sessionId != session.sessionId) {
    return false;
  }
  if (_.now().valueOf() > session.expires) {
    return false;
  }
  return true;
}

async function signIn(tokenInfo: TokenInfo): Promise<SessionDetail> {
  //其它窗口已经登录，并且cookie值与store中的数据保存一致，丢弃该授权码，使用本地数据
  let sessionId = Cookies.get(sessionCookieKey);
  let storeSession = getStoredSession();
  if (storeSession && storeSession.sessionId == sessionId) {
    session = storeSession;
    return session;
  }
  //登录
  session.token = tokenInfo;
  session.anonymous = false;
  session.user = tokenInfo.user || new SessionDetail().user;
  session.user['anonymous'] = false;
  session.loginTime = _.now().valueOf();
  session.sessionId = 'session_id_' + session.loginTime;
  session.refreshAccessAt();
  if (tokenInfo.expiresIn) {
    session.expires = session.loginTime + tokenInfo.expiresIn * 1000 - 60000;
  }
  persistSession();
  await onSignIn(session);
  return session;
}

function persistSession() {
  let scookie = {
    path: Utils.getWebContext()
  };
  if (window.location.protocol === 'https:') {
    scookie['SameSite'] = 'None';
    scookie['secure'] = true;
  }
  Cookies.set(sessionCookieKey, session.sessionId, scookie);

  let crypto = AES.encrypt(JSON.stringify(session), session.sessionId);
  store.set(getSessionKey(), crypto.toString());
}

async function onSignIn(sessionDetail: SessionDetail) {
  if (!webApplication.started) {
    return;
  }
  let authUrl = ConfigHelper.getAuthorizeUrl();
  if (authUrl) {
    await PermissionService.init(authUrl);
  }
  for (let i = 0; i < eventManger.onSignIn.length; i++) {
    let func = eventManger.onSignIn[i];
    await func(sessionDetail);
  }
}

function getStoredSession() {
  let sessionId = Cookies.get(sessionCookieKey);
  if (!sessionId) {
    return null;
  }
  try {
    let decrypt = AES.decrypt(store.get(getSessionKey()), sessionId);
    session = JSON.parse(decrypt.toString(encUTF8));
    return Object.assign(new SessionDetail(), session);
  } catch (ex) {
    return null;
  }
}

async function signOut(returnUrl: string, redirect = true) {
  removeSession();
  if (_.isEmpty(returnUrl)) {
    returnUrl = window.location.href;
  }
  for (let i = 0; i < eventManger.onSignOut.length; i++) {
    let func = eventManger.onSignOut[i];
    await func(session);
  }
  if (redirect) {
    SSOClient.ssoLogout(returnUrl);
  }
}

function removeSession() {
  session = new SessionDetail();
  store.remove(getSessionKey());
  Cookies.remove(sessionCookieKey, { path: Utils.getWebContext() });
  console.log('session logout!');
}

function getSessionKey() {
  return sessionKeyPrefix + Utils.getWebContext();
}

function checkEndlessLoop() {
  let key = lastLoginTimeKey + Utils.getWebContext();
  let lastLoginTime = store.session.remove(key, 0);
  let current = _.now().valueOf();
  if (current - lastLoginTime > 3000) {
    store.session.set(key, current);
    return false;
  }
  return true;
}

export const Session = {
  isLogin: function() {
    return isLogin();
  },
  getToken: function() {
    if (this.hasToken()) {
      return session.token.accessToken;
    }
    return null;
  },
  hasToken: function() {
    if (isLogin() && (session.token && session.token.accessToken)) {
      return true;
    }
    return false;
  },
  doSignIn: async function(tokenInfo: TokenInfo) {
    return signIn(tokenInfo);
  },
  doLogout: async function(returnUrl: string, redirect = true) {
    returnUrl = returnUrl || window.location.href;
    //子应用调到主应用去登录
    if (webApplication.isSubApp()) {
      return webApplication.microApp.doLogout(returnUrl);
    }
    return signOut(returnUrl, redirect);
  },
  doLogin: function(returnUrl: string) {
    let isEndlessLoop = checkEndlessLoop();
    if (isEndlessLoop) {
      throw new Error('login endless loop');
    }
    returnUrl = returnUrl || window.location.href;
    removeSession();
    //子应用调到主应用去登录
    if (webApplication.isSubApp()) {
      return webApplication.microApp.doLogin(returnUrl);
    }
    return SSOClient.gotoLogin(returnUrl);
  },
  getCurrentUser: function() {
    return session.user;
  },
  onSignIn: function(func: ILoginInterceptor) {
    eventManger.onSignIn.push(func);
  },
  onSignOut: function(func: ILoginInterceptor) {
    eventManger.onSignOut.push(func);
  },
  getSessionDetail: function() {
    return session;
  },
  async setSessionDetail(_session) {
    session = _session;
    return onSignIn(session);
  },
  /**
   * 刷新token，可手工传入要刷新的token，或者auth2.flow = accessCode，由系统自动使用refreshToken进行刷新
   */
  async refreshToken(tokenInfo?) {
    try {
      if (!tokenInfo && session.token.refreshToken) {
        let resp = await SSOClient.refreshToken(session.token);
        if (resp.status != 200 || !resp.data) {
          console.error('token刷新失败!');
          return false;
        }
        tokenInfo = resp;
      }
      if (!tokenInfo) {
        console.error('当前session不包含refresh_token，无法进行refreshToken的操作');
        return false;
      }
      Object.assign(session.token, {
        accessToken: tokenInfo['access_token'],
        refreshToken: tokenInfo['refresh_token'],
        expiresIn: tokenInfo['expires_in']
      });
      if (session.token.expiresIn) {
        session.expires = _.now().valueOf() + session.token.expiresIn * 1000 - 60000;
        session.refreshAccessAt();
      }
      if (!webApplication.isSubApp()) {
        persistSession();
      }
    } catch (ex) {
      console.error('token刷新失败:' + ex);
      return false;
    }
    return true;
  },
  doFilter: async function(to: Route, from: Route, next: any) {
    //因为to.matched会从父到子放置所有匹配的路由，所以从最后一个路由向上判断是否定义了requiresAuth就可以确定了
    let len = to.matched.length;
    let sessionDetail = await loadSession();

    //空闲后注销处理
    if (ConfigHelper.getCookiesExpires() > 0) {
      if (
        !sessionDetail.anonymous &&
        _.now().valueOf() > sessionDetail.getAccessAt() + ConfigHelper.getCookiesExpires() * 60 * 1000
      ) {
        this.doLogout();
        return;
      }
      sessionDetail.refreshAccessAt();
    }

    //校验当前路由是否需要权限
    let requiresAuth = false;
    for (let i = len - 1; i >= 0; --i) {
      let m = to.matched[i];
      if (m.meta.requiresAuth || m.meta.auth) {
        //路由配置指定了需要验证
        requiresAuth = m.meta.requiresAuth || m.meta.auth;
        break;
      }
    }

    //判断用户对当前路由是否有访问权限
    let hasPerm = false;
    if (_.isArray(requiresAuth)) {
      hasPerm = PermissionService.hasPerm(requiresAuth);
    } else if (_.isFunction(requiresAuth)) {
      hasPerm = await requiresAuth(to, from, next);
    } else {
      if (requiresAuth === true && !sessionDetail.anonymous) {
        hasPerm = true;
      } else {
        hasPerm = !requiresAuth;
      }
    }
    //在用户登录之后，调用应用设置的路由权限设置策略
    if (hasPerm && !sessionDetail.anonymous) {
      hasPerm = await webApplication.hasRouteSecurityPerm(to, from);
    }

    // 生成当前页面状态码
    let statusCode = 200;
    if (hasPerm) {
      if (sessionDetail.anonymous) {
        let shouldCheckLogin = ConfigHelper.shouldCheckLogin() && !loginChecked && to.path !== '/ssoclient';
        if (shouldCheckLogin) {
          try {
            let checkLoginResult = await SSOClient.checkLogin();
            if (checkLoginResult.data.code === 'ok') {
              statusCode = 401;
            }
          } catch (e) {
            statusCode = 200;
          }
        }
      }
    } else {
      if (sessionDetail.anonymous) {
        statusCode = 401;
      } else {
        statusCode = 403;
      }
    }

    // 根据不同状态，实现页面的不同处理
    if (statusCode === 401) {
      let nextTo = this.doLogin(to.fullPath);
      if (nextTo) {
        next(nextTo);
      }
    } else if (statusCode === 403) {
      next({ name: '403', params: { requiresAuth: requiresAuth } });
    } else {
      next();
    }
  },
  switchTenant(tenantId, timeout = 10000) {
    let ifrm = SSOClient.switchTenantRequest(tenantId);
    let resolver, rejector;
    let isComplete = false;
    let handler = async (event) => {
      // @param event {data,origin ,source}
      if (event.data.type !== 'switchTenant') {
        return;
      }
      detach();
      removeSession();
      await signIn(event.data.tokenInfo);
      resolver(event.data);
    };
    let detach = function() {
      isComplete = true;
      document.body.removeChild(ifrm);
      if (window.removeEventListener) {
        window.removeEventListener('message', handler, false);
      } else {
        window.detachEvent('onmessage', handler, false);
      }
    };
    if (window.addEventListener) {
      window.addEventListener('message', handler, false);
    } else {
      window.attachEvent('onmessage', handler, false);
    }
    window.setTimeout(() => {
      if (isComplete) {
        return;
      }
      rejector({ error: 'timeout' });
      detach();
    }, timeout);
    return new Promise((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
    });
  }
};
