import webApplication from '@fly-vue/core';

import messages from '../i18n/index';

webApplication.addModule({
  name: 'module_i18n',
  install: (webApp) => {
    webApp.addLocaleMessages(messages);
  },
  dependencies: ['module1']
});
