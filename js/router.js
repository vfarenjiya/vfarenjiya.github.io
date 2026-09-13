export const ROUTES = ['/habits', '/insights', '/coach', '/profile'];   // v1.2: exported for shortcuts
export const currentRoute = () => {
  const path = location.hash.replace(/^#/, '') || '/habits';
  return ROUTES.includes(path) ? path : '/habits';
};
export const navigate = (path) => { location.hash = path; };
export function initRouter(render) {
  window.addEventListener('hashchange', () => render(currentRoute()));
  render(currentRoute());
}