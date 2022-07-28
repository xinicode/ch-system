# 迁移到@bingo

- libs/context 使用  module/libs/context.ts
- mvue-toolkit 替换成 @cmp/core
- mvue-components 替换成 @fly-vue/components
- 样式b-开头的替换为bin-开头，全局搜索替换

- module/index.ts 保留原所有内容，并添加以下代代码（参考cmp-template 工程的 3.4分支代码）：

```typescript

// 注意要将CmpTemplateModule改成相应模块名称
export const CmpTemplateModule: IWebModule = {
  name: process.env.VUE_APP_NAME,
  version: process.env.VUE_APP_VERSION,
  dependencies: process.env.VUE_APP_DEPENDENCIES.split(','),
  install(app) {

  }
};

webApplication.addModule(CmpTemplateModule);

export default CmpTemplateModule;


```
