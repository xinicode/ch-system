import webApplication from '@fly-vue/core';

import com11 from './component1.vue';
import com12 from './component2.vue';

webApplication.addModule({
  name: 'module1',
  install: () => {},
  dependencies: ['module2'],
  components: { com11, com12 }
});
