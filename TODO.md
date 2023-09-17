### get_image (/images/:id)
 - UUID from request param
 - Image data from database
 - Use uploader_id + image_id to get the saved path
 - Send image data as json
 - Optionally add a `nojson` and `thumbnail` query param to return the image raw data

### login (/auth/login)
 - username or email + password from request body
 - Check if username or email exists in database
 - Get user from database
 - Verify password
 - Return token or full user

### register (/auth/register)
 - Probably not going to implement this as this project is just meant for me and I really don't want to deal with users
