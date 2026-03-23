export interface BitrixAuth {
  access_token?: string;
  domain?: string;
  expires_in?: number;
  member_id?: string;
  refresh_token?: string;
}

export interface BitrixPlacementInfo {
  PLACEMENT?: string;
  PLACEMENT_OPTIONS?: string;
  LANG?: string;
}

export interface BitrixErrorPayload {
  error?: string;
  error_description?: string;
}

export interface BitrixResponse<T> {
  answer?: BitrixErrorPayload & {
    result?: T;
    next?: number;
    total?: number;
  };
}

export interface BitrixSdk {
  init(callback: () => void): void;
  getAuth(): BitrixAuth;
  placementInfo(callback: (info: BitrixPlacementInfo) => void): void;
  callMethod<T>(
    method: string,
    params: Record<string, unknown>,
    callback: (response: BitrixResponse<T>) => void,
  ): void;
  isAdmin?(): boolean;
}

export interface BitrixContext {
  embedded: boolean;
  placement: BitrixPlacementInfo | null;
  auth: BitrixAuth | null;
}

export interface BitrixUserItem {
  ID?: string | number;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: string;
  ACTIVE?: boolean | string;
  ADMIN?: boolean | string;
}

export interface BitrixCrmItem {
  id?: string | number;
  title?: string;
  assignedById?: string | number;
  createdBy?: string | number;
  [key: string]: unknown;
}

declare global {
  interface Window {
    BX24?: BitrixSdk;
  }
}

export {};
