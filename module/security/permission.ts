import _ from 'lodash';
import { HttpRequest } from '../http/http';
import { ConfigHelper } from '../config/index';

export interface Authorization {
  entities: { [entityName: string]: EntityAuthorization };
  [opName: string]: any;
}

export interface EntityAuthorization {
  /**
   * 实体行级权限定义
   */
  __row_ops__?: EntityAuthorization;
  /**
   * 操作权限定义
   */
  [opName: string]: string | string[] | EntityAuthorization;
}

export interface AuthOperation {
  operation: string;
  entityName?: string;
}

export class PermissionCls {
  private _authorization: Authorization = {
    entities: {}
  };

  get authorization() {
    return this._authorization;
  }

  public async init(url: string) {
    //如果配置有本地授权数据，使用本地配置的
    let authData = ConfigHelper.getConfigVal('authData');
    if (authData) {
      this.addAuthorization(authData);
      return;
    }
    let resp = await new HttpRequest().get(url);
    if (resp && resp.data) {
      this.addAuthorization(resp.data);
    }
  }

  /**
   * 添加权限
   */
  public addAuthorization(auth: Authorization | string[]) {
    if (_.isArray(auth)) {
      for (const item of auth) {
        this._authorization[item] = '';
      }
    } else {
      for (const propName in auth) {
        if (Object.prototype.hasOwnProperty.call(auth, propName)) {
          const authVal = auth[propName];
          if (propName == 'entities') {
            this.addEntityAuthorization((<Authorization>auth).entities);
          } else {
            this._authorization[propName] = authVal;
          }
        }
      }
    }
    delete this._authorization['*'];
  }

  private addEntityAuthorization(auth: { [entityName: string]: EntityAuthorization }) {
    for (const propName in auth) {
      if (Object.prototype.hasOwnProperty.call(auth, propName)) {
        this._authorization.entities[propName.toLowerCase()] = auth[propName];
      }
    }
  }

  private getEntityAuthorization(entityName: string): EntityAuthorization {
    let entityOps = this._authorization.entities && this._authorization.entities[entityName.toLowerCase()];
    return entityOps;
  }

  /**
   * 判断当前用户对指定实体是否具有读取权限
   * @param entityName 实体名
   */
  public hasReadPerm(entityName: string): boolean {
    let has = this.hasPerm('find', entityName);
    if (!has) {
      return false;
    }
    has = this.hasPerm('query', entityName);
    if (!has) {
      return false;
    }
    return true;
  }
  //实体操作权限判断
  public hasPerm(op: string | string[], entityName?: string): boolean {
    if (!_.isArray(op)) {
      return this.chkPermission(op, entityName);
    }
    let result = true;
    _.forEach(op, (p1) => {
      let r = this.chkPermission(p1, entityName);
      if (!r) {
        result = false;
        return false;
      }
    });
    return result;
  }

  /** 行级数据权限判断
   *  @param entityRecord 实体的一条数据记录
   *  @param ops 需要判断操作名称，如：'edit' 或者 ['edit','create']
   */
  hasRowPerm(entityRecord, ops): boolean {
    if (!entityRecord || !ops) {
      return true;
    }
    let hasPermission = false;
    if (!_.isArray(ops)) {
      ops = [ops];
    }
    let permsArray = [];
    _.forEach(ops, (op) => {
      let opNeedPerms = this.resolveNeedRowPerm(op);
      permsArray = permsArray.concat(opNeedPerms);
    });

    if (entityRecord['__ops__']) {
      //进行行级数据权限判断
      let itemPermOps = entityRecord['__ops__'];
      let matched = true;
      _.forEach(permsArray, (needPerm) => {
        let opMatch = false;
        _.forEach(itemPermOps, (permOp) => {
          if (permOp == '*' || needPerm.toLowerCase() == permOp.toLowerCase()) {
            opMatch = true;
            return false;
          }
        });
        if (!opMatch) {
          matched = false;
          return false;
        }
      });
      hasPermission = matched;
    } else {
      //没有权限数据，默认为有权限
      hasPermission = true;
    }
    return hasPermission;
  }

  /**
   * 判断当前用户对该操作是否具有权限
   * @param op 要检验的操作
   * @param entityName 操作所属的实体
   */
  private chkPermission(op: string, entityName?: string): boolean {
    if (_.isEmpty(op) || _.has(this._authorization, '*')) {
      return true;
    }
    let opInfo = this.resolveOpInfo(op);
    if (!entityName) {
      entityName = opInfo.entityName;
    }
    if (!entityName) {
      return _.has(this._authorization, opInfo.operation);
    }

    let entityOps = this.getEntityAuthorization(entityName);
    if (entityOps == null) {
      return false;
    }
    if (_.has(entityOps, '*')) {
      return true;
    }
    return _.has(entityOps, opInfo.operation);
  }

  /**
   * 将一个字符串的操作解析成标准的实体操作
   * @param entityOp entityOp格式：entityName:operationName
   */
  private resolveOpInfo(entityOp: string): AuthOperation {
    let indexOfSplit = entityOp.indexOf(':');
    if (indexOfSplit <= 0) {
      return { entityName: null, operation: entityOp };
    }
    let entityName = entityOp.substring(0, indexOfSplit);
    let op = entityOp.substring(indexOfSplit + 1);
    return { entityName: entityName.toLowerCase(), operation: op };
  }

  /**
   * 解析一个实体操作需要的权限
   * @param entityOp 格式：entityName:operationName
   */
  private resolveNeedRowPerm(entityOp): string[] {
    let opInfo = this.resolveOpInfo(entityOp);
    let needPerm = [opInfo.operation];
    if (!opInfo.entityName) {
      return needPerm;
    }

    let entityOps = this.getEntityAuthorization(opInfo.entityName);
    if (entityOps == null || !_.has(entityOps, '__row_ops__')) {
      return needPerm;
    }
    //获取行级权限定义
    let rowOpsDefine = entityOps.__row_ops__;
    if (!_.has(rowOpsDefine, opInfo.operation)) {
      return needPerm;
    }
    return <[]>rowOpsDefine[opInfo.operation];
  }
}

export const PermissionService = new PermissionCls();
