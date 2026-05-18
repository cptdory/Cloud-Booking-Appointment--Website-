import type { AuthUser } from "@/types/bc-types";

export type Session = {
  logged_in: boolean;
  user: AuthUser;
};