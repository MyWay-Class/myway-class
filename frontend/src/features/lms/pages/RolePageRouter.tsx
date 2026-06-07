import { renderHomeRoute, renderLoadingRoute, renderRoleRoute, type RolePageRouterProps, type SharedRouteArgs } from './RolePageRouterRoutes';

export function RolePageRouter(props: RolePageRouterProps) {
  const sessionToken = props.session.session_token;
  const shortformInitialTab = props.page === 'my-shortforms' ? 'library' : props.page === 'community' ? 'community' : 'create';
  const args: SharedRouteArgs = { ...props, sessionToken, shortformInitialTab };

  if (props.page === 'home') return renderHomeRoute(args);
  if (props.loading) return renderLoadingRoute();
  return renderRoleRoute(args);
}
