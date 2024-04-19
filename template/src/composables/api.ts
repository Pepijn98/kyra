import AuthApiService from "~/api/AuthApiService";
import FileApiService from "~/api/FileApiService";
import ImageApiService from "~/api/ImageApiService";
import UserApiService from "~/api/UserApiService";

type Api = {
    auth: AuthApiService;
    file: FileApiService;
    image?: ImageApiService;
    user?: UserApiService;
}

export function useApi(): Api {
    const store = useUserStore();

    return {
        auth: new AuthApiService(store.user?.token),
        file: new FileApiService(),
        image: store.user && store.isLoggedIn ? new ImageApiService(store.user.token) : undefined,
        user: store.user && store.isLoggedIn ? new UserApiService(store.user.token) : undefined
    };
}
