import { Document, Model, Schema, model } from "mongoose";

export enum Role {
    OWNER,
    ADMIN,
    USER
}

export type User = {
    email: string;
    username: string;
    password: string;
    token: string;
    role: Role;
    createdAt: Date
};

export type PublicUser = Omit<User, "email" | "password" | "token"> & { id: string };
export type LoginUser = Omit<User, "password"> & { id: string };

export type UserModel = User & Document & {
    publicData
    : () => PublicUser
    loginData: () => LoginUser
};

export const UserSchema: Schema<UserModel> = new Schema<UserModel>({
    email: String,
    username: String,
    password: String,
    token: String,
    role: { type: Number, min: 0, max: 2, default: 2 },
    createdAt: Date
});

UserSchema.methods.publicData = function (): PublicUser {
    return {
        id: this._id,
        username: this.username,
        role: this.role,
        createdAt: this.createdAt
    };
};

UserSchema.methods.loginData = function (): LoginUser {
    return {
        id: this._id,
        email: this.email,
        username: this.username,
        token: this.token,
        role: this.role,
        createdAt: this.createdAt
    };
};

export const Users: Model<UserModel> = model<UserModel>("Users", UserSchema);
