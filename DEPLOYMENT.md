# SC Community Connect Deployment

This project can be deployed as a single Render Web Service. The root `Dockerfile` builds Angular first, runs the backend test phase, copies the built frontend into Spring Boot static resources, and runs one Java container. That means `/api`, `/ws-native`, and the Angular pages are served from the same public URL.

Do not treat the deployment as a public production launch until a real email/SMS OTP delivery provider, database migration strategy, monitoring and backups are configured. Development OTP display is intentionally disabled in the production template.

## 1. Push Code To GitHub

From the project root:

```bash
git init
git branch -M main
git remote add origin https://github.com/rweb1896-dev/SC_Community.git
git add .
git commit -m "Deploy SC Community Connect"
git push -u origin main
```

Do not commit `.env` files or real database passwords.

## 2. Neon PostgreSQL

Neon gives a URL like:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
```

Spring Boot needs JDBC format in Render:

```text
DB_URL=jdbc:postgresql://HOST/DB?sslmode=require
DB_USERNAME=USER
DB_PASSWORD=PASSWORD
DB_POOL_SIZE=2
```

If you want to keep channel binding and the deployed JDBC driver accepts it, use:

```text
DB_URL=jdbc:postgresql://HOST/DB?sslmode=require&channelBinding=require
```

After the first public deploy, rotate the Neon password if it was pasted anywhere visible.

## 3. Render Web Service

In Render:

1. Click **New** -> **Web Service**.
2. Connect the GitHub repo.
3. Select Docker runtime.
4. Keep root directory as the repository root.
5. Dockerfile path: `./Dockerfile`.
6. Health check path: `/api/health`.
7. Add environment variables from `.env.production.example`.
8. Deploy.

Required environment variables:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
APP_ADMIN_EMAIL
APP_ADMIN_PASSWORD
APP_OTP_EMAIL_CODE=SC1E
APP_OTP_MOBILE_CODE=SC2M
APP_OTP_EXPOSE_CODE=false
BOOTSTRAP_DEFAULT_INVITE_ENABLED=false
BOOTSTRAP_SAMPLE_CONTENT_ENABLED=false
CORS_ALLOWED_ORIGINS
DB_POOL_SIZE=2
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_SQL_INIT_MODE=never
PORT=10000
```

Set `CORS_ALLOWED_ORIGINS` to your Render URL, for example:

```text
https://sc-community-connect.onrender.com
```

## 4. Gallery Storage

Event gallery JPG/PNG uploads are stored in PostgreSQL and delivered through cacheable public image endpoints. The upload limit is 8 MB per file. For a larger public catalogue, move media to object storage such as S3 or Cloudinary and keep only metadata in PostgreSQL.

Member post images and ID proof references still use URLs. Store sensitive ID documents in private object storage with signed access before accepting real applicants.

## 5. Production Checklist

- Use a strong `JWT_SECRET`.
- Change `APP_ADMIN_PASSWORD` before first production startup.
- Replace the shared `APP_OTP_EMAIL_CODE` and `APP_OTP_MOBILE_CODE` values with real email/SMS delivery before a wider public launch; keep `APP_OTP_EXPOSE_CODE=false`.
- Keep production on `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` and `SPRING_SQL_INIT_MODE=never`; use versioned migrations before changing the live schema.
- Add centralized error monitoring and an external rate limit for authentication endpoints.
- Keep Neon password only in Render environment variables.
- Confirm `/api/health` returns `UP`.
- Test login, feed post creation, messages, admin approval, and meetings.
- Keep a weekly Neon export/backup while testing.
