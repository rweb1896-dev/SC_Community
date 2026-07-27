# SC Community Connect

Production-oriented full-stack community platform built with Angular, Spring Boot, PostgreSQL, JWT authentication, Bcrypt password encoding, Spring Data JPA, and STOMP WebSockets.

## What Is Included

- Invite-code gated registration with mandatory email OTP, mobile OTP, and ID proof URL.
- New registrations remain pending until an admin reviews the ID proof and approves the account.
- Password recovery works with either the registered email or mobile number.
- JWT login for verified users only.
- Blocked users cannot log in, post, comment, or send messages.
- Admin dashboard, user approval/block/unblock, post hiding, and invite-code generation.
- Categorized community feed for Health Help, Job Updates, Business Growth, and Open Forum/SOS.
- Direct messaging over Spring WebSocket/STOMP with REST conversation history.

## Project Layout

- `backend/` - Spring Boot API.
- `frontend/` - Angular app.
- `database/create_sc_con.sql` - SQL helper to create the PostgreSQL database.
- `docker-compose.yml` - Optional PostgreSQL container.

## Database

I created the local PostgreSQL database `sc_con` with:

```bash
createdb sc_con
```

If you need the SQL form:

```bash
psql -f database/create_sc_con.sql
```

For Docker PostgreSQL instead:

```bash
docker compose up -d postgres
```

Then run the backend with:

```bash
DB_USERNAME=postgres DB_PASSWORD=postgres mvn spring-boot:run
```

Spring Boot uses JPA `ddl-auto=update`, so it creates/updates the requested tables on startup and seeds the four categories.

## Backend

```bash
cd backend
mvn spring-boot:run
```

If port `8080` is busy, run:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

Defaults:

- API: `http://localhost:8080/api` by default
- WebSocket endpoints: `/ws-native` for native STOMP WebSocket and `/ws` for SockJS fallback
- Database URL: `jdbc:postgresql://localhost:5432/sc_con`
- Local DB username default: your shell `$USER`
- Local DB password default: blank

Bootstrap admin:

- Email: `admin@scconnect.local`
- Password: `Admin@12345`

Initial invite code:

- `WELCOME-SC-2026`

Local/testing OTP for both email and mobile:

- `1SC2`

The OTP expires after 10 minutes, allows five attempts, and produces a one-time verification token. This fixed value is for testing only. Replace it with a real email/SMS delivery provider before a wider public launch.

Override bootstrap credentials and OTP settings with:

```bash
APP_ADMIN_EMAIL=admin@example.com \
APP_ADMIN_PASSWORD='strong-password' \
APP_OTP_CODE=1SC2 \
APP_OTP_EXPOSE_CODE=true \
mvn spring-boot:run
```

## Frontend

Angular latest could not be scaffolded because this machine has Node `24.13.0`, while Angular CLI `22.0.8` requires Node `24.15.0` or newer. I used Angular `21.1.x`, the newest compatible line for the installed Node.

```bash
cd frontend
npm install
npm start
```

Open:

```text
http://localhost:4201
```

The signup form requires:

- Verified email OTP
- Verified mobile OTP
- Strong password and confirmation
- Unused admin invite code
- Publicly viewable ID proof URL
- Professional group

The included Angular dev proxy points `/api`, `/ws-native`, and `/ws` to `http://localhost:8081` because port `8080` was already occupied on this machine during setup. The frontend also uses `4201` because `4200` was occupied. Change `frontend/proxy.conf.json` back to `8080` if you run the backend on the default port.

## Verification

Ran successfully:

```bash
cd backend && mvn test
cd frontend && npm run build
```

Angular build shows CommonJS optimization warnings for `@stomp/stompjs` and `sockjs-client`; those are expected for these realtime client packages.
