import {
  mapState as mapStateVx,
  mapMutations as mapMutationsVx,
  mapGetters as mapGettersVx,
  mapActions as mapActionsVx,
  createNamespacedHelpers as createNamespacedHelpersVx
} from 'vuex';
import { webApplication } from '../application/application';

function createContext(thisObj) {
  if (thisObj.$store) {
    return thisObj;
  }
  return {
    $store: webApplication.store
  };
}

function wrapped(func) {
  return function(...args) {
    let res = func.apply(this, args);
    for (const key in res) {
      let method = res[key];
      res[key] = function(...args2) {
        let thisObj = createContext(this);
        return method.apply(thisObj, args2);
      };
    }
    return res;
  };
}

export const mapState = wrapped(mapStateVx);
export const mapMutations = wrapped(mapMutationsVx);
export const mapGetters = wrapped(mapGettersVx);
export const mapActions = wrapped(mapActionsVx);
export const createNamespacedHelpers = createNamespacedHelpersVx;
