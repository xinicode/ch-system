const routes = [
	{
		path: "test/a",
		component: () => import(/* webpackChunkName: "cmp_system_system_org" */ "./system/demo/views/test.vue"),
	},
];

export default routes;
