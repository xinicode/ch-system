import webApplication from '@fly-vue/core';

import com31 from './component1.vue';
import com32 from './component2.vue';

webApplication.addModule({
  name: 'module3',
  install: () => {},
  dependencies: ['module1', 'module2'],
  components: { com31, com32 }
});
