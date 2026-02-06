# Strapi setup & troubleshooting

Configure Strapi so the Next.js app can authenticate, create posts, and load comments/votes.

---

## 1. Permissions

**Settings** → **Users & Permissions Plugin** → **Roles**

### Public role

Used when the app fetches votes and comments **without** a token (e.g. anonymous visitors).

- **Comment**: `find`, `findOne`
- **Vote**: `find`, `findOne`  
- **Blog**: `find` (if list/single post are public)

### Authenticated role

- **User**: `findOne` (required for `/api/users/me`)
- **Comment**: `find`, `findOne`, `create`
- **Blog**: `find`, `create`, `update` (and ensure **content**, **categories**, **cover** can be set)
- **Vote**: `find`, `findOne`, `create`, `update`, `delete`

Save, then **restart Strapi**.

---

## 2. Votes or comments return 403

- The app **sends the JWT** when fetching votes/comments if the user is logged in. So **Authenticated** must have `find` / `findOne` on Comment and Vote.
- Anonymous requests use the **Public** role → enable **Public** → Comment and Vote → `find`, `findOne` (see §1).

---

## 3. Content / categories / cover not saved on create

Only title and description save when creating a post from `/write`:

1. **Permissions**  
   Under **Authenticated** → **Blog** → **create**, ensure the role can set **content**, **categories**, and **cover**. If Strapi has field-level options, enable those; otherwise full create usually includes them.

2. **Content field**  
   Blog **content** is Rich text (Blocks). The app sends an array of blocks. If you only send a string, Strapi may store null. No code change needed if you use the current `/write` flow.

3. **Categories**  
   Sent as `categories: { set: [documentId, ...] }`. Ensure **Authenticated** can set the **categories** relation on Blog.

4. **Cover**  
   Cover is attached **after** create via `POST /api/upload` with `ref`, `refId`, `field=cover`. Ensure **Upload** and **Blog** permissions allow this.

---

## 4. Comment schema (400 on fetch)

If your **Comment** content type has **author** (not **user**) and no **isApproved** field, the app is already aligned: it uses `populate=author` and does not filter by `isApproved`. If you still get 400, check that the filters and populate match your Strapi schema.

---

## 5. Vote content type

- **value**: Number (e.g. -1 / 1)
- **blog**: Relation → Blog
- **users_permissions_user**: Relation → User (users-permissions plugin)

The app uses `users_permissions_user` in filters; do not rename to `user` in Strapi.

---

## 6. Common errors

| Symptom | Check |
|--------|--------|
| 403 on votes/comments | Public + Authenticated permissions (§1–2) |
| 401 on login or /me | Authenticated → User → findOne |
| Content null / only title+description | Authenticated → Blog → create, content/categories/cover (§3) |
| Network / ERR_FAILED | Strapi running, `NEXT_PUBLIC_STRAPI_URL` in `.env.local`, Next.js restarted |
| CORS errors | Strapi CORS/config allows `localhost:3000` |

---

## 7. Quick checks

```bash
# Strapi up
curl http://localhost:1337/api

# Public votes (replace BLOG_ID)
curl "http://localhost:1337/api/votes?filters[blog][id][\$eq]=BLOG_ID"

# Public comments
curl "http://localhost:1337/api/comments?filters[blog][id][\$eq]=BLOG_ID"
```

After changing permissions, restart Strapi.
