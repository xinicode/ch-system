import CmpLayout from '@/layouts/cmp-layout';

const meta = {
    auth: true
};

const pre = 'dashboard-';

export default {
    path: '/dashboard',
    name: 'dashboard',
    redirect: {
        name: `${pre}console`
    },
    meta,
    component: CmpLayout,
    children: [
        {
            path: 'console',
            name: `${pre}console`,
            meta: {
                ...meta,
                title: '主控台',
                closable: false
            },
            component: () => import('@/pages/dashboard/console/index.vue')
        },{
            path: 'console1/*',
            name: `${pre}console1`,
            meta: {
                ...meta,
                title: '主控台1',
                closable: false
            },
            component: function(a){
                 console.warn('aa', arguments);  return import('@/pages/dashboard/console/index.vue'); }
        }
    ]
};
