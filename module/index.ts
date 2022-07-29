import { CmpCore } from '@ch/core';
import '@fly-vue/builder/module-ref';
import { IWebModule, webApplication, WebApplicationEventType } from '@fly-vue/core';
import routes from './cmp.routes';

// context.initByWebApplication();

export * from './cmp.index';
export * from "./service";
// export * from "./services/system.service";

CmpCore.registerRoutes('system',routes)


export const CmpSystemModule: IWebModule = {
  name: process.env.VUE_APP_NAME,
  version: process.env.VUE_APP_VERSION,
  dependencies: process.env.VUE_APP_DEPENDENCIES.split(','),
  install(app) {
    const Vue = app.Vue;
    
    CmpCore.registerEvent(WebApplicationEventType.userSignIn, async function () {
      await CmpCore._doneStartup('before');
      await CmpCore._doneStartup();
      await CmpCore._doneStartup('after');
      await CmpCore._doneStartup('afterApp');
    })



  }
};

webApplication.addModule(CmpSystemModule);

export default CmpSystemModule;
