import webApplication from "@fly-vue/core";
import { CmpHttpDefReturn, CmpHttpGet, CmpHttpInterceptor, CmpInjectable, CmpService, cmp_http_path, cmp_http_query, JmmsFilter, CmpHttpPost, CmpHelper } from "@ch/core";
import { DictModel } from "../models/dict.model";
import { MenuModel } from "../models/menu.model";
import { SysparametervalueModel } from "../models/sys_parameter_value.model";

@CmpInjectable({
  scope: 'business'
})
export class SystemService extends CmpService {

  /**
   * 获取子导航数据
   * @param path 数据来源地址
   */
  @CmpHttpGet(':path')
  getSubMenu(@cmp_http_path('path') path: string): CmpHttpDefReturn<MenuModel[]> {
    return CmpHttpInterceptor([path]);
  }

  /**
   * 获取当前用户导航数据
   */
  @CmpHttpGet('%service.base.endpoint%/portalMenu/getMenuTree')
  getMenuTree(@cmp_http_query('code') code?: string): CmpHttpDefReturn<MenuModel> {
    if (!code) {
      const url = window.location + '';
      code = CmpHelper.getQuerystring(url, 'cmproot')
      || CmpHelper.getHashQuerystring(url, 'cmproot');
      if(!code) {
        if(url.indexOf("returnUrl") !== -1) {
          let  returnUrl =  CmpHelper.getHashQuerystring(url, 'returnUrl');
          returnUrl = returnUrl.indexOf("#") > -1  ? returnUrl : "/#" +returnUrl;
          code = CmpHelper.getHashQuerystring(returnUrl, 'cmproot')|| webApplication.configHelper.getConfigVal('defaultMenuCode'); 
        }else{
          code = webApplication.configHelper.getConfigVal('defaultMenuCode');
        }
      }
    }
    console.log("菜单code",code);
    return CmpHttpInterceptor([code]);
  }

    /**
   * 获取所有导航数据
   */
  @CmpHttpGet('%service.base.endpoint%/portalMenu/getAllMenu')
  getPortalMenu(@cmp_http_query('code') code?: string): CmpHttpDefReturn<MenuModel[]> {
    if (!code) {
      const url = window.location + '';
      code = CmpHelper.getQuerystring(url, 'cmproot')
      || CmpHelper.getHashQuerystring(url, 'cmproot');
      if(!code) {
        if(url.indexOf("returnUrl") !== -1) {
          let  returnUrl =  CmpHelper.getHashQuerystring(url, 'returnUrl');
          returnUrl = returnUrl.indexOf("#") > -1  ? returnUrl : "/#" +returnUrl;
          code = CmpHelper.getHashQuerystring(returnUrl, 'cmproot')|| webApplication.configHelper.getConfigVal('defaultMenuCode'); 
        }else{
          code = webApplication.configHelper.getConfigVal('defaultMenuCode');
        }
      }
    }
    return CmpHttpInterceptor([code]);
  }


  // /**
  //  * 获取所有导航数据
  //  */
  // @CmpHttpGet('%service.base.endpoint%/portal_menu')
  // getPortalMenu(): CmpHttpDefReturn<MenuModel[]> {
  //   return CmpHttpInterceptor([], { qurey: { page_size: 10000 } });
  // }

  /**
   * 获取系统参数
   * @param code
   */
  @CmpHttpGet('%service.system.endpoint%/sys_parameter_values')
  getSysParameterValues(@cmp_http_query() code: string): CmpHttpDefReturn<SysparametervalueModel[]> {
    let query = {
      orderby: 'orderId asc',
      filters: new JmmsFilter().add('spId', 'eq', code).stringify()
    };
    return CmpHttpInterceptor([query]);
  }

  /**
   * 获取系统参数
   * @param code
   */
  @CmpHttpGet('%service.system.endpoint%/sys_parameter_values')
  getSysParameterValue(@cmp_http_query() code: string): CmpHttpDefReturn<SysparametervalueModel> {
    let query = {
      orderby: 'orderId asc',
      filters: new JmmsFilter().add('code', 'eq', code).stringify()
    };
    return CmpHttpInterceptor([query], null, function (rs) {
      let data: any[] = rs.data || [];
      rs.data = data.length > 0 ? data[0] : null;
      return rs;
    });
  }

  /**
   * 获取字典
   * @param id
   */
  @CmpHttpGet('%service.system.endpoint%/sys_dictionary_items')
  getDictionary(@cmp_http_query() id: string): CmpHttpDefReturn<DictModel[]> {
    let query = {
      orderby: 'orderId asc',
      filters: new JmmsFilter().add('dictionaryId', 'eq', id).stringify()
    };
    return CmpHttpInterceptor([query]);
  }

  /**
   * 获取字典
   * @param code
   */
   @CmpHttpGet('%service.system.endpoint%/sys_dictionary_items')
   getDictionaryByCode(@cmp_http_query() code: string): CmpHttpDefReturn<DictModel[]> {
     let query = {
       orderby: 'orderId asc',
       joins:'sysd  o',
       filters: new JmmsFilter().add('o.code', 'eq', code).add('status', 'eq', 'enabled', 'and').add('isDelete', 'eq', 0, 'and').stringify()
     };
     return CmpHttpInterceptor([query]);
   }
 
  /**
   * 获取所有权限信息
   */
  @CmpHttpGet('%service.approle.endpoint%/userPermission/getPermissionByCode')
  getPermissionAll() {
    return CmpHttpInterceptor([]);
  }


  @CmpHttpPost('%cmp-console%/api/security/permissionWithState')
  getIaasPermissionAll(): CmpHttpDefReturn<any> {
    return CmpHttpInterceptor([]);
  }

  /**
   * 获取当前用户
   */
  @CmpHttpGet('%service.approle.endpoint%/cust_service_user')
  getCurrentUser(@cmp_http_query() userId: string) {
    let query = {
      orderby: 'userId asc',
      expand: 'cust',
      filters: new JmmsFilter().add('userId', 'eq', userId).add('externalid', 'eq', userId, 'or').stringify()
    };
    return CmpHttpInterceptor([query]);
  }

}
