import { Route } from 'vue-router';
export type RSPolicy = (to: Route, from?: Route) => Promise<boolean> | boolean;
/**
 * 管理应用自定义的路由权限策略
 */
export class RouteSecurityPolicy {
  private policyList: Array<RSPolicy> = [];
  public add(rSPolicy: RSPolicy) {
    this.policyList.push(rSPolicy);
  }
  public destroy() {
    this.policyList = [];
  }
  public async hasPerm(to: Route, from?: Route) {
    let hasPerm = true;
    for (let index = 0; index < this.policyList.length; index++) {
      const p = this.policyList[index];
      hasPerm = await p(to, from);
      if (hasPerm) {
        break;
      }
    }
    return hasPerm;
  }
}
