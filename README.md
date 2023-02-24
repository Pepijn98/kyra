# file-host
Private file hosting

# TODO
### Api
- Check for user folder before saving file
- Add login routes
    - POST,     `/auth/login` (only for frontend)
    - GET,      `/auth/me` (only for frontend)
- Add users routes (create, update, delete)
    - GET,      `/users/:id`
    - POST,     `/users`
    - PATCH,    `/users/:id`
    - DELETE,   `/users/:id`
    - GET,      `/users/:id/uploads`
- Add files routes (upload documents like .txt)
    - POST,     `/files`
    - DELETE,   `/files/:id`
### Files
- Test static files `/thumbnails`, `/images`, `files`
