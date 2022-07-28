let routes = [
  {
    component: () => import(/* webpackChunkName: "pages-demo" */ "./views/list.vue"),
    path: "demo/list",
    name:"ch3"
  }
];

export const demo_routes = routes;

