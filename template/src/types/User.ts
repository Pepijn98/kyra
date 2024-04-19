import { type ObjectValues } from "./General";

export const Role = {
    OWNER: 0,
    ADMIN: 1,
    USER: 2,
} as const;

export type RoleLevel = ObjectValues<typeof Role>;

export type User = {
    id: string;
    email: string;
    username: string;
    token: string;
    role: RoleLevel;
    created_at: Date;
};
