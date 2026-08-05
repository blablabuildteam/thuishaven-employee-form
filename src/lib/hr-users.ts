export type HRAccount = {
  email: string;
  password: string;
  name: string;
  role: "HR" | "ADMIN";
};

/**
 * Parse HR users from HR_USERS env var.
 * Format: email:password:name:role,email:password:name:role
 * Role is optional (defaults to HR). Name may contain spaces.
 *
 * Example:
 * HR_USERS="hr@thuishaven.nl:changeme:HR Thuishaven:ADMIN,finance@thuishaven.nl:changeme:Finance"
 */
export function getHRUsers(): HRAccount[] {
  const raw = process.env.HR_USERS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(":");
      if (parts.length < 3) return null;

      const email = parts[0]?.trim().toLowerCase();
      const password = parts[1];
      const roleCandidate = parts[parts.length - 1]?.trim().toUpperCase();
      const hasRole = roleCandidate === "HR" || roleCandidate === "ADMIN";
      const role = hasRole ? (roleCandidate as "HR" | "ADMIN") : "HR";
      const name = (hasRole ? parts.slice(2, -1) : parts.slice(2))
        .join(":")
        .trim();

      if (!email || !password || !name) return null;
      return { email, password, name, role };
    })
    .filter((user): user is HRAccount => user !== null);
}

export function findHRUser(
  email: string,
  password: string,
): HRAccount | null {
  const normalized = email.trim().toLowerCase();
  const user = getHRUsers().find((u) => u.email === normalized);
  if (!user || user.password !== password) return null;
  return user;
}
