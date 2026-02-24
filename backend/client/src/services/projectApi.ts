const resolveBaseUrl = (): string => {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  const configured = meta.env?.VITE_API_BASE_URL ?? "http://localhost:5001";
  return configured.replace(/\/$/, "");
};

const API_BASE_URL = resolveBaseUrl();

interface ApiErrorResponse {
  error?: string;
}

export interface ApiTeamMember {
  id?: string | number;
  name?: string;
  email: string;
  role?: string;
  isPrimary?: boolean;
}

export interface ApiProjectFile {
  name: string;
  size?: string;
  type?: string;
  storagePath?: string | null;
  downloadable?: boolean;
}

export interface ApiProjectStudent {
  id: number | string;
  name: string;
  email: string;
}

export interface ApiProjectFeedback {
  advisor?: string | null;
  coordinator?: string | null;
}

export interface ApiProject {
  id: number;
  title: string;
  type: string;
  status: string;
  submissionDate: string | null;
  lastModified: string | null;
  description: string;
  students: string[];
  studentDetails?: ApiProjectStudent[];
  advisor: string;
  advisorEmail?: string;
  teamName?: string;
  keywords?: string[];
  competitionName?: string | null;
  award?: string | null;
  externalLinks?: string[];
  files?: ApiProjectFile[];
  teamMembers?: ApiTeamMember[];
  semester?: string;
  year?: string;
  courseCode?: string | null;
  completionDate?: string | null;
  impact?: string;
  grade?: string | null;
  feedback?: ApiProjectFeedback;
}

interface ApiProjectsResponse {
  projects?: ApiProject[] | null;
}

const buildUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export class ApiError extends Error {
  status: number;
  info?: unknown;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export const fetchProjects = async (token: string): Promise<ApiProject[]> => {
  const response = await fetch(buildUrl("/projects"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let body: ApiProjectsResponse | ApiErrorResponse | undefined;

  try {
    body = (await response.json()) as typeof body;
  } catch (_error) {
    body = undefined;
  }

  if (!response.ok) {
    const message =
      body && "error" in body && typeof body.error === "string"
        ? body.error
        : "Failed to fetch projects.";
    throw new ApiError(message, response.status, body);
  }

  if (!body || !("projects" in body)) {
    return [];
  }

  return (body.projects ?? []).filter((project): project is ApiProject => Boolean(project));
};

/**
 * Download a project attachment file. Any authenticated user can download.
 */
export const downloadProjectFile = async (
  projectId: number | string,
  filename: string,
  token: string,
): Promise<void> => {
  const response = await fetch(
    buildUrl(`/projects/${projectId}/files/${encodeURIComponent(filename)}`),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new ApiError("Download failed", response.status);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
