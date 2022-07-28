import { CmpCore } from "@ch/core";
import "@fly-vue/builder/module-ref";
import { IWebModule, webApplication } from "@fly-vue/core";
import { routes } from "./cmp.routes";


CmpCore.registerRoutes("system", routes);

export const ChSystemModule: IWebModule = {
	name: process.env.VUE_APP_NAME,
	version: process.env.VUE_APP_VERSION,
	dependencies: process.env.VUE_APP_DEPENDENCIES.split(","),
	install(app) {
		const Vue = app.Vue;
	},
};

webApplication.addModule(ChSystemModule);
console.log("file: index.ts ~ line 21 ~ webApplication", webApplication)

export default ChSystemModule;
