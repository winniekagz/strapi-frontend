# DEV.BLOG

Next.js blog app with Strapi (headless CMS): posts, comments, votes, auth, and editor-only write page.

## Run the app

**Strapi (backend)** – from your Strapi project root:
```bash
npm run develop
```
Runs at `http://localhost:1337`.

**Next.js (frontend)** – from this project root:
```bash
npm install
npm run dev
```
Runs at `http://localhost:3000`.

## Environment

Create `.env.local` in this project:

```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_PAGE_LIMIT=9
```

Restart the Next.js dev server after changing env.

## Strapi setup

Permissions and content types must be configured in Strapi so the app can log in, create posts, and load comments/votes.

See **[STRAPI_SETUP.md](./STRAPI_SETUP.md)** for:

- Roles & permissions (Public, Authenticated)
- Why votes/comments return 403
- Content/categories/cover not saving
- Common errors and quick checks

## Main routes

| Route        | Description                    |
|-------------|--------------------------------|
| `/`         | Blog list (paginated, search)  |
| `/blogs/[slug]` | Single post, comments, votes |
| `/write`    | Create post (Editor/Admin only) |
| `/login`    | Sign in                        |
