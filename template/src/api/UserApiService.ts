import { ApiService } from "./ApiService";

export default class UserApiService extends ApiService {
    constructor(token: string) {
        super("user");

        this.api = this.api.extend({
            headers: {
                Authorization: token
            }
        });
    }
}
