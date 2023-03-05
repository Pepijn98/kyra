import { Document, Model, Schema, model } from "mongoose";

export enum Role {
    OWNER,
    ADMIN,
    USER
}

export interface User {
    email: string;
    username: string;
    password: string;
    token: string;
    role: Role;
    createdAt: Date
}

export type UserModel = User & Document;

export const UserSchema: Schema<UserModel> = new Schema<UserModel>({
    email: String,
    username: String,
    password: String,
    token: String,
    role: { type: Number, enum: Object.values(Role) },
    createdAt: Date
});

export const Users: Model<UserModel> = model<UserModel>("Users", UserSchema);

export default Users;
