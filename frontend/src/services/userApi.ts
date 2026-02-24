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

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: CreateUserRole;
}

interface UpdateUserResponse {
  user?: ApiUser | null;
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

export const updateUser = async (id: number, payload: UpdateUserRequest, token: string): Promise<ApiUser> => {
  const sanitizedPayload: Record<string, string> = {};

  if (typeof payload.name === "string" && payload.name.trim().length > 0) {
    sanitizedPayload.name = payload.name.trim();
  }

  if (typeof payload.email === "string" && payload.email.trim().length > 0) {
    sanitizedPayload.email = payload.email.trim();
  }

  if (typeof payload.role === "string" && payload.role.trim().length > 0) {
    sanitizedPayload.role = payload.role.trim();
  }

  if (typeof payload.password === "string" && payload.password.trim().length > 0) {
    sanitizedPayload.password = payload.password.trim();
  }

  if (Object.keys(sanitizedPayload).length === 0) {
    throw new ApiError("No updates supplied.", 400, payload);
  }

  const response = await fetch(buildUrl(`/users/${id}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(sanitizedPayload)
  });

  let body: UpdateUserResponse | ApiErrorResponse | undefined;

  try {
    body = (await response.json()) as typeof body;
  } catch (_error) {
    body = undefined;
  }

  if (!response.ok) {
    const message = body && "error" in body && typeof body.error === "string" ? body.error : "Failed to update user.";
    throw new ApiError(message, response.status, body ?? payload);
  }

  if (!body || !("user" in body) || !body.user) {
    throw new ApiError("User payload missing in response.", response.status, body);
  }

  return body.user;
};

export const deleteUser = async (id: number, token: string): Promise<void> => {
  const response = await fetch(buildUrl(`/users/${id}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    let body: ApiErrorResponse | undefined;

    try {
      body = (await response.json()) as typeof body;
    } catch (_error) {
      body = undefined;
    }

    const message = body && "error" in body && typeof body.error === "string" ? body.error : "Failed to delete user.";
    throw new ApiError(message, response.status, body);
  }
};
