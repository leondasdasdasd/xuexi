export const json = (body) => ({ type: "json", body });

export const binary = (body, headers = {}, status = 200) => ({
  type: "binary",
  body,
  headers,
  status,
});

const route = (method, path, handler) => ({
  method: method.toUpperCase(),
  path,
  handler,
});

export const get = (path, handler) => route("GET", path, handler);

export const post = (path, handler) => route("POST", path, handler);

const normalizeRouteEntry = ([key, handler]) => {
  const [firstPart, ...pathParts] = key.trim().split(/\s+/);
  const hasExplicitMethod = pathParts.length > 0;
  return route(
    hasExplicitMethod ? firstPart : "GET",
    hasExplicitMethod ? pathParts.join(" ") : firstPart,
    handler,
  );
};

export const fromRouteMap = (routeMap) => [
  ...Object.entries(routeMap)
    .map(normalizeRouteEntry)
    .reduce((routeByKey, item) => {
      routeByKey.set(`${item.method} ${item.path}`, item);
      return routeByKey;
    }, new Map())
    .values(),
];
