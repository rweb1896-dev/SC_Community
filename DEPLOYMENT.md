# SC Community Connect Deployment

This project is ready for a single Render Web Service. The root `Dockerfile` builds Angular first, copies the built frontend into Spring Boot static resources, and runs one Java container. That means `/api`, `/ws-native`, and the Angular pages are served from the same public URL.

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
CORS_ALLOWED_ORIGINS
DB_POOL_SIZE=2
PORT=10000
```

Set `CORS_ALLOWED_ORIGINS` to your Render URL, for example:

```text
https://sc-community-connect.onrender.com
```

## 4. Images With Google Drive

The current app stores `imageUrl` and `idProofUrl` in the database. It does not upload binary files yet.

For quick testing with Google Drive:

1. Upload an image to Google Drive.
2. Set sharing to **Anyone with the link can view**.
3. Copy the file ID from the share URL.
4. Use this image URL in the app:

```text
https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
```

Google Photos is not recommended for app image hosting because public links are not stable enough for website images. Google Drive can work for testing, but Cloudinary or Supabase Storage is better for production uploads.

## 5. Production Checklist

- Use a strong `JWT_SECRET`.
- Change `APP_ADMIN_PASSWORD` before first production startup.
- Keep Neon password only in Render environment variables.
- Confirm `/api/health` returns `UP`.
- Test login, feed post creation, messages, admin approval, and meetings.
- Keep a weekly Neon export/backup while testing.
