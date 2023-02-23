import { Document, Model, Schema, model } from "mongoose";

interface UserDoc extends Document {
    // uid: string;
    username: string;
    password: string;
    token: string;
    createdAt: Date
}

const User: Schema<UserDoc> = new Schema<UserDoc>({
    // uid: String,
    username: String,
    password: String,
    token: String,
    createdAt: Date
});

const Users: Model<UserDoc> = model<UserDoc>("Users", User);

export default Users;
export {
    UserDoc,
    User,
    Users
};
