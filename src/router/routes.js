const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'prospects-list',
        component: () => import('../pages/ProspectsListPage.vue'),
      },
      {
        path: 'prospects/:id',
        name: 'prospect-detail',
        component: () => import('../pages/ProspectDetailPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
]

export default routes
