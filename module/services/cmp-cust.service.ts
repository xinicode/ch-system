import { CmpHttpDefReturn, CmpHttpGet, CmpHttpInterceptor, CmpHttpPost, CmpInjectable, CmpService, cmp_http_data, cmp_http_query } from "@ch/core";

@CmpInjectable({
    scope: 'business'
})
export class CmpCustService extends CmpService {

    //service.approle.endpoint
    @CmpHttpPost('%cmp-console%/api/queryPageList')
    getOrgRoot(@cmp_http_data() query?: any): CmpHttpDefReturn<any[]> {
        return CmpHttpInterceptor([query]);
    }

    @CmpHttpPost('%cmp-console%/api/getEntityEx')
    getEntityEx(@cmp_http_data() query?: any): CmpHttpDefReturn<any[]> {

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