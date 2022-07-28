import webApplication from '@fly-vue/core';

let route1 = [
  {
    name: 'route1',
    component: () => import('./component1.vue'),
    path: '/route1'
  }
];

let route2 = [
  {
    name: 'route1-route2',
    component: () => import('./component1.vue'),
    path: '/route2',
    children: [
      {
        name: 'route1-route2-route3',
        component: () => import('./component1.vue'),
        path: '/route3'
      }
    ]
  }
];

webApplication.addModule({
  name: 'module4',
  install: (webApp) => {
    webApp.addRoutes(route1, '/');
    webApp.addRoutes(route2, 'route1');
  },
  dependencies: ['module1']
});
