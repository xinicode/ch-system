// 使用样式，修改主题可以在 styles 目录下创建新的主题包并修改 iView 默认的 less 变量
// 参考 https://www.iviewui.com/docs/guide/theme

import { Logger, webApplication } from '@fly-vue/core';

import App from './App.vue';
import routes from './route';

import './modules/module1';
import './modules/module2';
import './modules/module3';
import './modules/module4';
import './modules/module_on_sign';
import './modules/module_i18n';

webApplication
  .nodeEnv(process.env.NODE_ENV)
  .addRoutes(routes)
  .start({
    render: (h) => h(App)
  });

Logger.debug('Test Logger', webApplication);
