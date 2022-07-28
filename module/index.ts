import { webApplication } from './application/application';
import { Store } from 'vuex';
import VueRouter from 'vue-router';
import { AppConfig } from './config';

export * from './config';
export * from './http/index';
export * from './security/index';
export * from './application';
export * from './common';
export * from './common/logger';
export * from './route';
export * from './keep-alive';
export * from './micro-app/starter';
export * from './common/vuex-wrapped';

export function store(): Store<string> {
  return webApplication.store;
}
export function router(): VueRouter {
  return webApplication.router;
}
export function config(): AppConfig {
  return webApplication.config;
}

export default webApplication;
