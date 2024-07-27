import { usePermissions } from "~/hooks/use-auth";

export function Can(props: React.PropsWithChildren<{ permission: string }>) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(props.permission)) return null;

  return props.children;
}
