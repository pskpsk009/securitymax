export type PlatformRole = "student" | "coordinator" | "advisor";

export const resolveRole = (value: unknown): PlatformRole => {
  const allowedRoles: PlatformRole[] = ["student", "coordinator", "advisor"];
  return allowedRoles.includes(value as PlatformRole) ? (value as PlatformRole) : "student";
};

export const deriveDisplayName = (candidateEmail: string | null, displayName: string | null): string => {
  if (displayName && displayName.trim().length > 0) {
    return displayName;
  }

  if (candidateEmail && candidateEmail.includes("@")) {
    return candidateEmail.split("@")[0];
  }

  return "User";
};
