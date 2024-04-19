import { ApiService } from "./ApiService";

export default class ImageApiService extends ApiService {
    constructor(token: string) {
        super("image");

        this.api = this.api.extend({
            headers: {
                Authorization: token
            }
        });
    }

    // @ts-expect-error idc
    async post(file: File): Promise<void> {

    }

    // @ts-expect-error idc
    async delete(id: string, filename: string): Promise<void> {

    }
}
