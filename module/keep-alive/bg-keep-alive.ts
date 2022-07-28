import Vue, { VNode } from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { ICacheableComponent, VNodeCache, VNodeCachedItem } from './vnode-cache';

function isDef(v: any): boolean {
  return v !== undefined && v !== null;
}

function isAsyncPlaceholder(node: VNode): boolean {
  return node.isComment && node['asyncFactory'];
}

function getFirstComponentChild(children: Array<VNode>): VNode {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c;
      }
    }
  }
}

@Component
export default class BgKeepAlive extends Vue implements ICacheableComponent {
  name = 'bg-keep-alive';
  abstract = true;
  cache: VNodeCache;
  cacheKey: string;

  @Prop([String, RegExp, Array]) readonly include: string | RegExp | string[];
  @Prop([String, RegExp, Array]) readonly exclude: string | RegExp | string[];
  @Prop([String, Number]) readonly max: string | number;

  created() {
    this.cache = new VNodeCache(this);
  }

  destroyed() {
    this.cache.destroy();
    this.cache = null;
  }

  activated() {
    console.log('activated:' + this.cacheKey);
  }

  render() {
    const slot = this.$slots.default;
    const vnode: VNode = getFirstComponentChild(slot);
    if (!vnode || !vnode.componentOptions) {
      return slot && slot[0];
    }
    this.cacheKey = this.cache.buildCacheKey(vnode);
    let cachedItem = this.cache.get(this.cacheKey);
    if (cachedItem) {
      vnode.componentInstance = cachedItem.vnode.componentInstance;
      vnode.data.keepAlive = true;
    }
    let vnodeKey = this.cacheKey;
    vnode.key = vnodeKey;
    return vnode;
  }

  tryCreateCache(to: Route, from: Route): VNodeCachedItem {
    const slot = this.$slots.default;
    const vnode: VNode = getFirstComponentChild(slot);
    if (!vnode || !this.cache) {
      return null;
    }
    // if(this.cache.depthInRoute!=this.$route.matched.length-1){
    //     return null;
    // }
    if (this.cache.canCache(to, from)) {
      //vnode.key=this.cacheKey;
      vnode.data.keepAlive = true;
      let cacheItem = this.cache.add(vnode, this.cacheKey);
      this.$emit('on-cache', cacheItem);
      return cacheItem;
    }
  }
}
