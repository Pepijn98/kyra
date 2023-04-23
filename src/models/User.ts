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

export type UserModel = User & Document & { _id: string };

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
    id: string;
    email: string;
    username: string;
    role: Role;
    createdAt: Date;

    constructor(data: UserModel) {
        this.id = data._id;
        this.email = data.email;
        this.username = data.username;
        this.role = data.role;
        this.createdAt = data.createdAt;
    }
}

export default Users;
