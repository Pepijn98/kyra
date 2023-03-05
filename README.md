# file-host
Private file hosting

# TODO
### Api
- Check for user folder before saving file
- Add login routes
    - POST,     `/auth/login` (only for frontend)
    - GET,      `/auth/me` (only for frontend)
- Add users routes (create, update, delete)
    - GET,      `/user/:id`
    - POST,     `/user`
    - PATCH,    `/user/:id`
    - DELETE,   `/user/:id`
    - GET,      `/user/:id/uploads`
- Add files routes (upload documents like .txt)
    - POST,     `/file`
    - DELETE,   `/file/:id`
### Files
- Test static files `/thumbnails`, `/images`, `files`
