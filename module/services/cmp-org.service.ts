import { CmpHttpDefReturn, CmpHttpGet, CmpHttpInterceptor, CmpInjectable, CmpService, cmp_http_query } from "@ch/core";

@CmpInjectable({
    scope: 'business'
})
export class CmpOrgService extends CmpService {

    //service.approle.endpoint
    @CmpHttpGet('%service.approle.endpoint%/orgManage/queryOrgRoot')
    getOrgRoot(@cmp_http_query('custId') custId?: string): CmpHttpDefReturn<any[]> {
        return CmpHttpInterceptor([custId]);
    }

    @CmpHttpGet('%service.approle.endpoint%/orgManage/queryOrgByParent')
    getOrgParent(@cmp_http_query() query?: any): CmpHttpDefReturn<any[]> {

        return CmpHttpInterceptor([query]);
    }


    @CmpHttpGet('%service.approle.endpoint%/orgManage/queryKeyword')
    queryKeyword(@cmp_http_query() query?: any): CmpHttpDefReturn<any[]> {
        return CmpHttpInterceptor([query]);
    }



    // sec_organization

    @CmpHttpGet('%service.approle.endpoint%/sec_organization')
    getOrgById(@cmp_http_query() query?: any): CmpHttpDefReturn<any[]> {
        return CmpHttpInterceptor([query]);
    }

}