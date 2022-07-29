import dashboard from './modules/dashboard';

import CmpLayout from '@/layouts/cmp-layout';

/**
 * 在主框架内显示
 */

const frameIn = [
  {
    path: '/',
    // redirect: {
    //   name: 'dashboard-console'
    // },
    meta: {
      auth: true
    },
    component: CmpLayout,
    children: [
      {
        path: 'dashboard-console',
        name: 'dashboard-console',
        redirect: {
          name: 'dashboard-console'
        }
      },
      {
        path: 'log',
        name: 'log',
        meta: {
          title: '前端日志',
          auth: true
        },
        component: () => import('@/pages/system/log')
      },
      // 刷新页面 必须保留
      {
        path: 'refresh',
        name: 'refresh',
        hidden: true,
        component: {
          beforeRouteEnter(to, from, next) {
            next(instance => instance.$router.replace(from.fullPath));
          },
          render: h => h()
        }
      },
      // 页面重定向 必须保留
      {
        path: 'redirect/:route*',
        name: 'redirect',
        hidden: true,
        component: {
          beforeRouteEnter(to, from, next) {
            next(instance => instance.$router.replace(JSON.parse(from.params.route)));
          },
          render: h => h()
        }
      }
    ]
  },
  dashboard
];

// 导出需要显示菜单的
export const frameInRoutes = frameIn;

// 重新组织后导出
export default [
  ...frameIn
];
