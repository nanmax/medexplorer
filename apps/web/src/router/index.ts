import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "explorer",
    component: () => import("@/views/ExplorerView.vue"),
  },
  {
    path: "/folders/:id",
    name: "folder",
    component: () => import("@/views/ExplorerView.vue"),
    props: true,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
