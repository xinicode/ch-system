import webApplication from '@fly-vue/core';

import com21 from './component1.vue';
import com22 from './component2.vue';

webApplication.addModule({
  name: 'module2',
  install: () => {},
  dependencies: [''],
  components: { com21, com22 }
});
