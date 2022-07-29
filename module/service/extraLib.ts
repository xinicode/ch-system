
// cmp-helper disallow file

export const AttrDeclare = `


interface UserModel {
  sub?: string;
  login_name?: string;
  name?: string;
  enabled?: number;
  uid?: string;
  status?: number;
  e_code?: string;
  userId?: string;
  anonymous?: boolean;
}
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
  description?: any;
  status?: number;
  hidden?: number;
  expandType?: string;
  prdtVersions?: string;
  spId?: string;
  id?: string;
  children?: any[];
}
declare class CmpSystem {
  /** 获取 %path%/user 真实地址 */
  static makeUrl(url: string): string;
  /** 是否有菜单权限 */
  hasMenuPermission(url: string): boolean;
  /** 当前系统登录用户 */
  static get user(): UserModel;
  /** 网站信息 */
  static get siteInfo(): {};
  /** 网站信息 实体版本 */
  static get siteInfoEx(): {
      [key: string]: SysparametervalueModel;
  };
  /**
 * 获取 前端 diy 配置
 * @param key
 * @param defaultValue 默认值
 */
  static getDiyConfig(key: string, defaultValue?: any): any;
  /**
   * 设置 前端 diy 配置
   * @param key
   * @param value
   */
  static setDiyConfig(key: string, value: any): void;
  /**
   * 根据route取得menu.id
   * @param route
   */
  static getMenuIdByRoute(route: CmpVueCurrentRoute): string;
  /**
   * 打开页面
   * @param path 路径，如：/system/role
   * @param query 地址参数，如: {id: '111'}
   * @param params
   */
  static open(location: RawLocation, query?: any, option?: CmpUiOpenOption): CmpUiLink;
  static openByMenuId(id: string, option?: CmpUiOpenOption, menus?: MenuModel[]): CmpUiLink;
  static openByMenu(menu: MenuModel, option?: CmpUiOpenOption): CmpUiLink;
  /**
   * 获取菜单
   * @param params
   * @param menus 数据来源， 默认系统数据
   */
  static getMenu(params: MenuModel, menus?: MenuModel[]): MenuModel;
  /**
   * 获取bingo菜单
   * @param params
   * @param menus 数据来源， 默认系统数据
   */
  static getBingoMenu(params: MenuModel, menus?: MenuModel[]): any;
  /**
   * 获取TopRightMenus菜单
   */
  static getBingoTopRightMenus(): any[];
  static toBingoMenu(menu: MenuModel): any;
  /**
   * 获取首页信息
   */
  static getMenuHome(menus?: MenuModel[]): MenuModel;
  /**
   * 获取菜单
   * @param params 默认不传获取全部
   * @param menus 数据来源， 默认系统数据
   */
  static getMenuList(params?: MenuModel, menus?: MenuModel[]): MenuModel[];
  /**
   * 获取路由获取当前 menu
   * @param route
   */
  static getMenuCurrent(route: CmpVueCurrentRoute): import("@ch/core").CmpNavMenuItem;
  /**
   * 获取父菜单
   * @param params 默认不传获取全部
   */
  static getMenuParent(params: MenuModel, menus?: MenuModel[]): MenuModel;
  /**
   * 从服务器刷新menu
   */
  static refreshMenuFromServer(): void;
  /**
   * 刷新menu
   */
  static refreshMenu(): void;
  /** 加载子菜单 */
  static loadSubMenu(id: string): void;
  /**
   * 注册刷新menu数据通知
   * @param fn
   * @example
   *  registerRefreshMenu(()=>{ this.updateMenu(); })
   */
  static registerRefreshMenu(fn: () => void): void;
  /**
   * 获取系统参数管理的数据
   * @param code 系统参数树的code(参数代码)
   */
  static getSiteConfigList(code: string): Promise<SysparametervalueModel[]>;
  /**
   * 根据id, 获取字典
   * @param id
   */
  static getDictionary(id: string): Promise<DictModel[]>;
  /**
   * 根据code, 获取字典
   * @param code
   */
  static getDictionaryByCode(code: string): Promise<DictModel[]>;
  /**
   * 获取用户列表
   * @param params
   */
  static getUserList(params: Object): any;
  /**
   * 根据id获取用户
   * @param id 用户id
   */
  static getUser(id: String): any;
  /**
   * 获取部门列表
   * @param params
   */
  static getOrgList(params: Object): any;
  /**
   * 获取租户列表
   * @param params
   */
  static getCustList(params: Object): any;
  /**
   * 按主键获取SecRole的一行记录
   * @param params id
   */
  static getSecRole(id: String): any;
  /**
   * 按条件查询SecRole的多行记录
   * @param params id
   */
  static getSecRoleList(params: Object): any;
  /**
   * 是否有用户权限
   * @param operation 操作码
   */
  static hasUserPermission(operation: string): boolean;
  /**
   * 按主键获取用户角色表的一行记录
   * @param params userid
   * @param params roleID
   * @param params param
   */
  static getUserSecRole(userid: String, roleID: String, params: Object): any;
  /**
   * 按条件查询用户角色表的多行记录
   * @param params id
   */
  static getUserSecRoleList(params: Object): any;
  /**
   * 按主键获取系统参数配置表的一行记录
   * @param params id
   *
   */
  static getSysParameters(id: string): any;
  /**
   * 按主键获取系统参数配置表的一行记录
   * @param params id
   *
   */
  static getSysParameter(code: string): Promise<import("@ch/core").CmpHttpResult<SysparametervalueModel>>;
  /**
   * 按条件查询用户角色表的多行记录
   * @param params id
   */
  static getSysParametersList(params: Object): any;
  /**
   * 添加语言包
   * @param messages
   */
  static addLocaleMessages(messages: any): void;
}
`;
