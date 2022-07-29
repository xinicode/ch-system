import { CmpHttpDefReturn, CmpHttpGet, CmpHttpInterceptor, CmpInjectable, CmpService, cmp_http_query } from "@ch/core";

@CmpInjectable({
    scope: 'business'
})
export class CmpUserService extends CmpService {

    @CmpHttpGet('%service.approle.endpoint%/cust_service_user')
    userList(@cmp_http_query() query?): CmpHttpDefReturn<any[]> {
        if (query) {
            query.expand = 'org';
        }
        return CmpHttpInterceptor([query]);
    }

}