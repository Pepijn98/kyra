import { UserDoc } from "../../src/models/User";

declare global {
    namespace Express {
        interface Request {
            rawBody: string;
            user: UserDoc | null
        }
    }
}

export { };
