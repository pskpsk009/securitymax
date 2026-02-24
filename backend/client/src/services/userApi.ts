const resolveBaseUrl = (): string => {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  const configured = meta.env?.VITE_API_BASE_URL ?? "http://localhost:5001";
  return configured.replace(/\/$/, "");
};

const API_BASE_URL = resolveBaseUrl();

type ApiErrorResponse = { error?: string };

export type CreateUserRole = "student" | "advisor" | "coordinator";

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: CreateUserRole;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: CreateUserRole;
}

interface CreateUserResponse {
  user: ApiUser;
}

export class ApiError extends Error {
  status: number;
  info?: unknown;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const createUser = async (payload: CreateUserRequest, token: string): Promise<ApiUser> => {
  const response = await fetch(buildUrl("/users"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  let body: CreateUserResponse | ApiErrorResponse | undefined;
  try {
    body = (await response.json()) as typeof body;
  } catch (_error) {
    body = undefined;
  }

  if (!response.ok) {
    const message = body && "error" in body && typeof body.error === "string" ? body.error : "Failed to create user.";
    throw new ApiError(message, response.status, body);
  }

  if (!body || !("user" in body)) {
    throw new ApiError("User payload missing in response.", response.status, body);
  }

  return (body as CreateUserResponse).user;
};

interface ListUsersResponse {
  users?: ApiUser[] | null;
  user?: ApiUser | null;
}

export const listUsers = async (token: string): Promise<ApiUser[]> => {
  const response = await fetch(buildUrl("/users"), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  let body: ListUsersResponse | ApiErrorResponse | undefined;

  try {
    body = (await response.json()) as typeof body;
  } catch (_error) {
    body = undefined;
  }

  if (!response.ok) {
    const message = body && "error" in body && typeof body.error === "string" ? body.error : "Failed to fetch users.";
    throw new ApiError(message, response.status, body);
  }

  if (!body) {
    return [];
  }

  if ("users" in body && Array.isArray(body.users)) {
    return body.users;
  }

  if ("user" in body && body.user) {
    return [body.user];
  }

  return [];
};
