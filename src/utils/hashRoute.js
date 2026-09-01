export const buildHashRouteUrl = (route = "/") => {
  if (typeof window === "undefined") {
    return route;
  }

  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const currentPath =
    window.location.pathname && window.location.pathname !== "/"
      ? window.location.pathname.replace(/\/$/, "")
      : "/";

  return `${window.location.origin}${currentPath}#${normalizedRoute}`;
};

export const navigateToHashRoute = (route) => {
  const targetUrl = buildHashRouteUrl(route);
  window.location.href = targetUrl;
  return targetUrl;
};
