export interface Role {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  builtin: boolean;
  deletable: boolean;
  staff_count: number;
}

export interface RolesResponse {
  roles: Role[];
  /** permission key → human label */
  permission_catalog: Record<string, string>;
}

export interface RolePayload {
  name: string;
  permissions: string[];
}
