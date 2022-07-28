const meta = {
    auth: true
};


export default [
    {
        path: `/dashboard/console`,
        name: `dashboardConsole`,
        meta: {
            ...meta,
            title: '主控台',
            closable: false
        },
        component: () => import('@/pages/dashboard/console')
    }
];
