# file-host
Private file hosting

# TODO
### **Add auth routes:**
| Method | Path          | Desc                       | Status |
| :-     | :-            | :-                         | :-:    |
| POST   | `/auth/login` | Login to the web dashboard | ✓      |
| GET    | `/auth/me`    | Get current user           | ✕      |

### **Add user routes:**
| Method | Path                | Desc                               | Status |
| :-     | :-                  | :-                                 | :-:    |
| GET    | `/user/:id`         | Get specific user                  | ✕      |
| POST   | `/user`             | Create new user                    | ✕      |
| PATCH  | `/user/:id`         | Update specific user               | ✕      |
| DELETE | `/user/:id`         | Delete specific user               | ✕      |
| GET    | `/user/:id/uploads` | Get all uploads from specific user | ✕      |

### **Add files routes:**
| Method | Path        | Desc                 | Status |
| :-     | :-          | :-                   | :-:    |
| POST   | `/file`     | Upload new file      | ✕      |
| DELETE | `/file/:id` | Delete specific file | ✕      |
