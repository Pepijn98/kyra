import { UserModel } from "../../src/models/User";

declare global {
    namespace Express {
        interface Request {
            rawBody: string;
            user: UserModel | null;
        }
    }
}

export { };
