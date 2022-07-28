export default [
    {
        path: '/',
        name: 'index',
        meta:{
            auth:false
        },
        component: () => import('./index.vue')
    },
    {
        name: 'ssoclient',
        component: () => import('./pages/sso/ssoclient.vue'),
        path: '/ssoclient'
    },
    {
        name: 'link-login',
        component: () => import('./pages/sso/ssoclient.vue'),
        path: '/link-login'
    },
    {
        name: 'http',
        component: () => import('./pages/http/index.vue'),
        path: '/http'
    },
    {
        name: 'proxy',
        component: () => import('./pages/http/proxy.vue'),
        path: '/proxy'
    },
    {
        name: 'i18n',
        component: () => import('./pages/i18n/index.vue'),
        path: '/i18n'
    },
    {
        name: 'permission',
        component: () => import('./pages/sso/permission.vue'),
        path: '/permission'
    }
]
