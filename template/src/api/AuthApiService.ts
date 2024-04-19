import { ApiService, type UserResponse, type ErrorResponse } from "./ApiService";

export default class AuthApiService extends ApiService {
    token?: string;

    constructor(token?: string) {
        super("auth");

        this.token = token;
    }

    async login(email: string, password: string): Promise<UserResponse | ErrorResponse> {
        try {
            return await this.api.post("login", { json: { email, password } }).json<UserResponse>();
        } catch (error) {
            return await this.handleError(error);
        }
    }

    async me(): Promise<UserResponse | ErrorResponse> {
        if (!this.token)
            return {
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "Not logged in",
            };

        try {
            return await this.api.get("me", { headers: { Authorization: this.token } }).json<UserResponse>();
        } catch (error) {
            return await this.handleError(error);
        }
    }
}
