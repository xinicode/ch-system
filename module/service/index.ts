import mvueCore, { CmpConfig, CmpCore, CmpHelper, CmpHttpHelper, CmpHttpService, CmpLogger, CmpPipeSync, CmpUiLink, CmpUiOpenOption, CmpVueCurrentRoute, cp_each, cp_filter, cp_find, cp_take } from "@ch/core";
import webApplication from "@fly-vue/core";
import { MenuService } from "@fly-vue/iview-admin";
import _ from "lodash";
import { Location, RawLocation } from "vue-router";
import { SystemService } from "../services/system.service";
import { config, httpConfig } from "./cmp-core-config";
import { getData } from "./fetch";

const _systemSrv = new SystemService(null);

//初始配置
CmpConfig.assign(
	Object.assign(config, {
		navigation: {
			location(location: Location, option?: CmpUiOpenOption) {
				let type = (option && option.type) || "";
				let query: any = {};
				if (!_.has(location.query || {}, "_pst")) {
					const pst = getPst(type);
					if (pst) query._pst = pst;
				}
				switch (type) {
					case "iframe":
					case "wide-iframe":
					case "widefull-iframe":
						let iUrl = location.path;
						location.path = "/iframe/index";
						location.query = _.assign(
							{},
							location.query,
							{
								url: iUrl,
							},
							query
						);
						return location;
					case "browser-open":
						let href = _.isString(location) ? location : CmpHelper.setQuerystring(location.path, location.query);
						window.open(href, "_blank");
						return null;
					default:
						location.query = _.assign({}, location.query, query);
						return location;
				}
			},
			/** 配置当前menu */
			menu(route: CmpVueCurrentRoute) {
				if (!route) return null;
				let id = _getMenuIdByRoute(route);
				if (!id) {
					return _getMenuBaseByRoute(route);
				} else {
					let menu = CmpSystem.getMenu({ id: id });
					if (menu && menu["_cmpRef"]) {
						id = menu["_cmpRef"];
						menu = CmpSystem.getMenu({ id: id });
					}
					return menu;
				}
			},
		},
	})
);

let _metaUrls = [];

CmpCore.registerStartup(async function () {
	const no403 = _.includes(window.location + "", "cmplogger=");

	// CmpCore.mvueContext.getRouter().beforeEach(function (to, from, next) {
	// 	let url: string = to.path;
	// 	let query = to.query;
	// 	if (/^\/iframe\//i.test(url)) url = (query && (query.url as string)) || "";
	// 	if (no403) next();
	// 	else {
	// 		console.error("403,url为:" + url);
	// 		let theme = CmpHelper.safeOperator(function () {
	// 			return to.matched[0].meta.cmpTheme;
	// 		}, "");
	// 		let errPath = "/403";
	// 		if (theme) errPath = ["", theme, errPath].join("/").replace(/\/{2,}/g, "/");
	// 		next({ path: errPath });
	// 	}
	// });
	let portalRoutes = CmpCore.getRuntimeThemeRoute();
	_.forEach(portalRoutes, function (item) {
		_metaUrls = _metaUrls.concat(_getMetaUrls(item.children, item.path));
	});
	// await _makeMenuPermission();
}, "after");

CmpCore.registerStartup(async function () {
	await Promise.all([_loadSiteInfo(), _loadMenuData()]);
	// await Promise.all([_loadUser(), _loadSubMenuData([_menu])])

	const menuAll = _.cloneDeep(CmpSystem.getMenuList());
	// const bgMenuAll = _bgMenuAll = _toBingoMenus(menuAll);
	CmpLogger.debug("menuAll", menuAll);
	// CmpLogger.debug('bingoMenuAll', bgMenuAll);

	let headerMenus = [];
	let sideMenus = [];
	(function () {
		let firstPathMenu;
		let makeHeader = function (list, header, noIcon?: boolean) {
			_.forEach(list, function (item) {
				if (!firstPathMenu && item.path) {
					firstPathMenu = item;
				}
				item.header = header;
				noIcon === true && (item.icon = "");
				makeHeader(item.children, header, true);
			});
		};
		// _.forEach(bgMenuAll, function (item) {
		//   const children = item.children;
		//   if (children && children.length > 0) {
		//     const name = item.name;
		//     firstPathMenu = null;
		//     headerMenus.push(item);
		//     _.forEach(children, function (cItem) {
		//       makeHeader([cItem], name);
		//     });
		//     delete item.children;
		//     if (firstPathMenu) {
		//       const _menu = CmpSystem.getMenu({ id: item.id });
		//       if (_menu) _menu['_cmpRef'] = firstPathMenu.id;
		//       item.path = firstPathMenu.path;
		//       item.target = firstPathMenu.target;
		//       item.pst = firstPathMenu.pst;
		//     }
		//     sideMenus = sideMenus.concat(children);
		//   }
		// });
	})();
	CmpLogger.debug("headerMenus", headerMenus);
	CmpLogger.debug("sideMenus", sideMenus);

	MenuService.addHeaderMenus(headerMenus);
	MenuService.addMenus(sideMenus);
});

export class CmpSystem {
	static addLocaleMessages(messages: any) {
		messages = _.cloneDeep(messages);
		const localeMessages = webApplication.localeMessages;
		_.forEach(messages, function (value, key) {
			const localeValue = localeMessages[key];
			if (!value || !localeValue) return;
			//合并cmp下的模块语言内容
			const cmp = _makeCmpLocaleMessage(value.cmp, localeMessages[key].cmp);
			if (cmp) value.cmp = cmp;
		});

		webApplication.addLocaleMessages(messages);
	}

	static get rootMenu(): any {
		return _menu;
	}


	static getBingoTopRightMenus() {
		const menu = CmpSystem.getMenu({ code: "cmp_top_right" });
		return menu && _toBingoMenus(menu.children || [], false, 100);
	}

	static makeUrl(url: string): string {
		return CmpHttpHelper.handleUrl(url);
	}

	static get user(): any {
		return _user;
	}

	static get siteInfo() {
		return _siteInfo;
	}

	static get siteInfoEx(): { [key: string]: any } {
		return _siteInfoEx;
	}

	static getMenuIdByRoute(route: CmpVueCurrentRoute) {
		return _getMenuIdByRoute(route);
	}

	static open(location: RawLocation, query?: any, option?: CmpUiOpenOption): CmpUiLink {
		return CmpCore.open(location, query, option);
	}

	static openByMenuId(id: string, option?: CmpUiOpenOption, menus?: any[]) {
		return CmpSystem.openByMenu(CmpSystem.getMenu({ id: id }, menus), option);
	}

	static openByMenu(menu: any, option?: CmpUiOpenOption) {
		if (!menu) return new CmpUiLink();
		if (!menu.id) menu = CmpSystem.getMenu(menu);
		var url = menu.url;
		if (/^null|children$/.test(url)) url = null;

		if (!url) {
			// alert("菜单定义数据有误");
			return new CmpUiLink();
		}
		let query = { _mid: menu.id };
		return CmpSystem.open(menu.url, query, _.assign({}, option, { type: menu.showType }));
	}

	static getMenu(params: any, menus?: any[]): any {
		menus || (menus = _menu.children);
		return _getMenu(menus, params);
	}

	static getMenuHome(menus?: any[]): any {
		if (!menus) return _homeMenu;
		let menu = CmpSystem.getMenu({ code: "cmp-home-page" }, menus);
		return menu || CmpSystem.getMenu({ code: "cmp-home-page-default" }, menus);
	}

	static getSiteConfigList(code: string): Promise<any[]> {
		return _systemSrv
			.getSysParameterValues(code)
			.send()
			.then(function (rs) {
				return rs.data || [];
			});
	}

	static getMenuList(params?: MenuModel, menus?: MenuModel[]): MenuModel[] {
		menus || (menus = _menu.children);
		if (!params) return menus;
		return _getMenuList(menus, params);
	}
}

function _getMenuList(menus: MenuModel[], params) {
	return CmpPipeSync(menus, cp_filter(params, "children"));
}

let _bgMenuAll = [];

interface MenuModel {
	menuId?: string;
	name?: string;
	url?: string;
	submenuSource?: any;
	submenuSourceType?: string;
	icon?: string;
	displayOrder?: number;
	showType?: any;
	menuSource?: any;
	menuSourceId?: any;
	level?: number;
	modifiedBy?: string;
	modifiedTime?: string;
	parentId?: string;
	code?: string;
	cssStyle?: any;
	description?: string;
	desc?: string;
	status?: number;
	hidden?: number;
	expandType?: string;
	prdtVersions?: string;
	spId?: string;
	id?: string;
	children?: any[];
}

var _menu: MenuModel = {};
var _urlPath = {};
let _user = {};

let _siteInfo = {};
let _siteInfoEx = {};
/** 加载网站信息 */
function _loadSiteInfo() {
	return CmpSystem.getSiteConfigList("site_config").then(function (datas) {
		_siteInfo = {};
		_.forEach(datas, function (item) {
			_siteInfo[item.code] = item.value;
			_siteInfoEx[item.code] = item;
		});
	});
}

// 获取url环境路径
function _loadUrlPath() {
	return CmpSystem.getSiteConfigList("child_project").then(function (datas) {
		_urlPath = {};
		_.forEach(datas, function (item) {
			_urlPath[item.code] = item.value;
		});
	});
}

function _deepReplaceUrl(menus) {
	menus.forEach((item) => {
		if (item.url) {
			item.url = _.trim(item.url || "")
				.replace(/%([^%]+)%/g, function (find, code) {
					let key = _.trim(code);
					return key in _urlPath ? _urlPath[key] : find;
				})
				.replace(/[\\/]{2,}/, "/")
				.replace(/\:([\\/])/, ":$1$1");
		}
		if (item.children) {
			_deepReplaceUrl(item.children);
		}
	});
}

let _homeMenu: MenuModel;
function _loadMenuData(): Promise<any> {
	return Promise.all([
		_loadUrlPath(),
		_systemSrv
			.getMenuTree()
			.send()
			.then((res) => {
				_menu = res.data || { children: [] };
			}),
	])
		.then(function () {
			//替换 %path% 变量
			_deepReplaceUrl([_menu]);
		})
		.then(function () {
			//处理homeMenu
			let menuList = CmpSystem.getMenuList({ code: "cmp-home-page" });
			if (menuList.length > 0) {
				_homeMenu = menuList[0];
			} else {
				let menuListAll = CmpSystem.getMenuList();
				if (menuListAll.length > 0) {
					let m1 = menuListAll[0].children[0];
					if (m1.children) {
						_homeMenu = m1.children[0];
					} else {
						_homeMenu = m1;
					}
				}
			}
			CmpPipeSync(
				menuList,
				cp_take(1),
				cp_each(function (item) {
					item.hidden = 1;
				})
			);
			//end 处理homeMenu
		});
}

function _getMenuIdByRoute(route: CmpVueCurrentRoute): string {
	let id: any = (route.query && (route.query.cmpnav || route.query._mid)) || "";
	return id;
}

function _getMenu(menus: MenuModel[], params: MenuModel): MenuModel {
	return CmpPipeSync(menus, cp_find(params, "children"));
}

function getPst(showType: string) {
	return showType.indexOf("widefull") >= 0 ? "sh" : showType.indexOf("wide") >= 0 ? "s" : null;
}

function _getMenuBaseByRoute(route: CmpVueCurrentRoute): MenuModel {
	let query = route.query;
	if (!query || !query.cmptitle || !query.cmpdesc) return null;
	return {
		name: (query.cmptitle as any) || "",
		description: query.cmpdesc || "",
	};
}

function _getMetaUrls(list?: any[], portPath?: string) {
	return _.map(
		_.filter(list, function (item) {
			return item.meta && item.meta.CmpMetarenderOptRoute;
		}),
		function (item) {
			return [portPath, item.path].join("/").replace(/\/{2,}/g, "/");
		}
	);
}


function _makeCmpLocaleMessage(message1, message2) {
  if (_.isEmpty(message1))
    return message2;
  else if (_.isEmpty(message2))
    return message1;
  const keys = _.uniq(_.concat(_.keys(message1), _.keys(message2)));
  const cmp = {};
  _.forEach(keys, function (key) {
    const item1 = message1[key];
    const item2 = message2[key];
    let res;
    if (_.isEmpty(item1))
      res = item2;
    else if (_.isEmpty(item2))
      res = item1;
    else {
      res = _.assign({}, item2, item1);
    }
    if (!_.isEmpty(res))
      cmp[key] = res;
  });
  return cmp;
}


function _toBingoMenus(list: MenuModel[], all = false, lv = 0) {
	const mapList = function (list, lv) {
	  let outList = [];
	  _.forEach(list, function (item: MenuModel, index: number) {
		if (!all && item.hidden) return;
		const outItem = _makeBingoMenuItem(item, item.id);//`l${lv}i${index}`);
		outList.push(outItem);
		const children = item.children;
		if (children && children.length > 0)
		  outItem.children = mapList(children, lv + 1);
	  });
	  return outList;
	};
	return mapList(list, lv);
  }

  function _makeBingoMenuItem(item: any, name?: string) {
	const showType: string = item.showType || '';
	const bgMenu = {
	  id: name || item.id,
	  cmpid: item.id,
	  code: item.code,
	  path: item.url,// || CmpHelper.makeAutoId(),
	  title: item.name,
	  icon: item.icon || 'ios-at',
	  name: name || CmpHelper.makeAutoId(),
	  displayMode: item.displayMode,
	  // header: '',
	  target: showType.indexOf('iframe') >= 0 ? 'iframe' : (showType == 'browser-open' ? '_blank' : 'tab'),
	  pst: showType.indexOf('widefull') >= 0 ? 'sh' : (showType.indexOf('wide') >= 0 ? 's' : '_'),
	  auth: false,
	  submenuSource: null,
	  children: null
	};
	if (item.url && item.url.indexOf("_pst") > -1) {
	  delete bgMenu.pst;
	}
	return bgMenu;
  }