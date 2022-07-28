import webApplication from '@fly-vue/core';
import { ViewUI, iViewPro } from '@fly-vue/iview-pro';

import App from './App.vue';





webApplication
    .use(ViewUI, {
        i18n: (key, value) => webApplication.i18n.t(key, value)
    })
    .use(iViewPro)
    .start({
        mixins: [],
        render: h => h(App)
});
