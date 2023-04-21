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
    role: { type: Number, min: 0, max: 2, default: 2 },
    createdAt: Date
});

export const Users: Model<UserModel> = model<UserModel>("Users", UserSchema);

export class PublicUser {
    email: string;
    username: string;
    role: Role;
    createdAt: Date;

    constructor(data: UserModel | User) {
        this.email = data.email;
        this.username = data.username;
        this.role = data.role;
        this.createdAt = data.createdAt;
    }
}

export default Users;
