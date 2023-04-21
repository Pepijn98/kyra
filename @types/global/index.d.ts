import { User } from "../../src/models/User";

declare global {
    namespace Express {
        interface Request {
            rawBody: string;
            user: User | null;
        }
    }
}

export { };
