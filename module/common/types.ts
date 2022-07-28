import './class-component-hooks';
/**
 * 层次结构
 */
export interface Hierarchical {
  children?: Hierarchical[];
  parent?: Hierarchical;
  fullPath?: string;
  [propName: string]: any;
}
/**
 * 层次结构遍历回调
 */
export interface HierarchicalVisitHandler {
  (item: Hierarchical, parent: Hierarchical, keyOrIndex: string | number): boolean | void;
}
