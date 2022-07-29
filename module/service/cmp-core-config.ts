import { CmpValidatorDescriptor, ICmpConfig, ICmpHttpConfig } from "@ch/core";
import { AxiosResponse } from "axios";
import _ from "lodash";
import mvueToolkit from '@ch/core';

/** cmp配置 */
export const config: ICmpConfig = {
    // 加载资源(js/css...)， 基础路径
    siteBasePath: './',

    /** 处理验证器 $errInfo */
    validatorMessage(descriptor: CmpValidatorDescriptor): string {
        return ['验证失败：', descriptor.$messages[0]].join('');
    },

    /** sip-access 处理Dom */
    accessDisabled(el: HTMLElement, type: 'disabled' | 'hide', disabled: boolean) {
        let className: string;
        if (type == 'hide') {
            className = 'sip-access-hide';
        } else {
            className = 'sip-access-disabled';
            el['disabled'] = disabled;
            // if (el.classList.contains('ivu-dropdown-item'))
            //     className = 'ivu-dropdown-item-disabled'
            // else
            //     className = 'disabled';
        }
        el.classList.toggle(className, disabled);
    },

    /** tableManager 默认配置 */
    table: {
        /**页面记录数选择项 */
        pageSizeOpts: [10, 20, 30, 40, 50],
        /**页面记录数 */
        pageSize: 10,
        /**是否多选 */
        multipleSelection: true,
        /**选择方式, select：选择模式，normal正常操作 */
        selectMode: 'normal' //'select' | 'normal'
    },

    form: {
        /** form label宽度 */
        labelWidth: 120,
        /** 验证时机 'change' | 'blur' | '' */
        validatorTrigger: ['blur', 'change', ''] //iview bug 没有'' form验证无效
    }
};

/** cmp配置 */
export const httpConfig: ICmpHttpConfig = {
    /** http 拦截器 */
    interceptor(response: AxiosResponse<any>, error?: any): Promise<any> {
        if (!error) {
            return Promise.resolve(response);
        } else {
            return Promise.reject(error);
        }
    },
    /**统一处理url路径 */
    handleUrl(url: string): string {
        // "%service.base.endpoint%/user/list"
        return (url || '').replace(/%([^%]+)%/g, function (find, code) {
            return mvueToolkit.config.getConfigVal(_.trim(code)) || `%${code}%`;
        }).replace(/[\\/]{2,}/, '/').replace(/\:\//, '\://');
    }

};
