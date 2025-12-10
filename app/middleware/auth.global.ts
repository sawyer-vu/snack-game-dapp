export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  const whitelist = ["/auth/login"];
  if (!authStore.isAuthenticated && !whitelist.includes(to.path)) {
    return navigateTo({
      name: "auth-login",
    });
  } else if (authStore.isAuthenticated && to.path === "/auth/login") {
    return navigateTo("/");
  }
});
