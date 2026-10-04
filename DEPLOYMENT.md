# DEPLOYMENT — Otula (PROD)

```text
Project:
Otula

Production domain:
otula.hackyeah.site

VPS:
179.198.221.186

Reverse proxy:
Nginx Proxy Manager (kontener `npm`, panel tylko lokalnie 127.0.0.1:81)

Docker network:
proxy (external) + project2-internal (prywatna: app <-> backend/db/redis)

Application container:
project2-app (nginx: statyczny build Vite + proxy /api/ -> backend, /static/ z volume)

Application port:
80 (wewnetrzny, tylko w sieciach Dockera; NPM forward: http://project2-app:80)
```

## Uslugi (project2)

| Kontener | Rola | Port wewn. | Sieci |
|---|---|---|---|
| `project2-app` | nginx gateway: SPA + `/api/` -> backend + `/static/` | 80 (`expose`) | `proxy`, `project2-internal` |
| `project2-backend` | Django + gunicorn (entrypoint: migrate + collectstatic) | 8000 (`expose`) | `project2-internal` |
| `project2-db` | PostgreSQL 16 | — | `project2-internal` |
| `project2-redis` | Redis 7 (AOF) | — | `project2-internal` |
| `project2-worker` | Celery worker (`--concurrency=2`) | — | `project2-internal` |
| `project2-beat` | Celery beat (przypomnienia, EPDS, nudges) | — | `project2-internal` |

Brak `ports:` — nic poza NPM nie slyszy publicznie. Restart: `unless-stopped`
wszedzie. Volumes: `project2-pgdata`, `project2-redisdata`, `project2-static`
(collectstatic backendu serwowany przez nginx).

Pliki na serwerze: `/opt/infrastructure/projects/project2/docker-compose.yml`,
`.env` (chmod 600, sekrety tylko tam), `src/` (kopia repo: `backend/`,
`frontend/`, `deploy/`). Zrodla prod w repo: `backend/config/settings/prod.py`,
`backend/Dockerfile.prod`, `backend/entrypoint.prod.sh`,
`frontend/Dockerfile.prod`, `frontend/nginx.prod.conf`,
`deploy/project2/docker-compose.yml`, `deploy/project2/.env.example`.

NPM Proxy Host (id 2): `otula.hackyeah.site` -> `http`, `project2-app`, port
`80`, Block Common Exploits ON, Force SSL ON, HTTP/2 ON, HSTS OFF, certyfikat
Let's Encrypt (auto-renew przez NPM).

## Deployment (pierwszy + kolejne)

```bash
# 1. Spakuj repo BEZ sekretow i node_modules (lokalnie):
tar --exclude='./frontend/node_modules' --exclude='./frontend/dist' \
  --exclude='./.git' --exclude='./.env' --exclude='__pycache__' \
  --exclude='./backend/celerybeat-schedule' \
  -czf /tmp/otula-src.tar.gz backend frontend deploy
# 2. Wgraj na VPS i rozpakuj do src/:
#    /root/otula-src.tar.gz -> /opt/infrastructure/projects/project2/src/
# 3. Skopiuj compose:
cp /opt/infrastructure/projects/project2/src/deploy/project2/docker-compose.yml \
   /opt/infrastructure/projects/project2/docker-compose.yml
# 4. Zbuduj i wystartuj:
cd /opt/infrastructure/projects/project2
docker compose up -d --build
# 5. Seed tresci + demo (przy pierwszym wdrozenu i po wipe DB):
docker compose exec -T backend python manage.py seed_content
docker compose exec -T backend python manage.py seed_demo
```

`.env` tworzy sie RAZ (sekrety generowane na serwerze, nigdy w repo):

```bash
# SECRET_KEY: openssl rand -hex 48
# POSTGRES_PASSWORD: openssl rand -hex 24 (hex = bezpieczny w DATABASE_URL)
# FIELD_ENCRYPTION_KEY: z obrazu backendu —
docker run --rm --entrypoint python project2-backend:latest \
  -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# VAPID_*: python manage.py generate_vapid (lub ten sam sposob przez py_vapid)
chmod 600 .env
```

Frontend buduje sie z `VITE_API_URL=https://otula.hackyeah.site/api/v1`
(wartosc domyslna w `frontend/Dockerfile.prod`, ten sam origin = brak CORS).

## Restart

```bash
cd /opt/infrastructure/projects/project2
docker compose up -d            # po zmianie compose/src (recreate z nowym env)
docker compose restart backend  # restart BEZ przeladowania env — nie uzywac po zmianie .env
```

## Logs

```bash
cd /opt/infrastructure/projects/project2
docker compose ps
docker compose logs -f --tail=100 backend   # gunicorn + migrate
docker compose logs -f --tail=100 app       # nginx gateway
docker compose logs --tail=50 worker beat    # celery
docker logs --tail=100 npm                   # reverse proxy / certbot
```

## Healthcheck

- `docker inspect project2-backend --format "{{.State.Health.Status}}"` →
  `healthy` (GET `/api/v1/health/` wewnatrz kontenera).
- `docker inspect project2-app ...` → `healthy` (GET `/` nginxa).
- Przez siec proxy (tak widzi to NPM):
  `docker exec npm node -e "fetch('http://project2-app/api/v1/health/')..."`
  → `200 {"status":"ok"}`.
- Publicznie: `http://otula.hackyeah.site` → 301 → `https://...` → 200;
  `/api/v1/health/` → `{"status":"ok"}`.

## Rollback

Deploy jest zrodlowy (build z `src/`), nie tagowany obrazem:

```bash
cd /opt/infrastructure/projects/project2
# 1. Wroc poprzednie src (backup katalogu lub poprzedni tarball):
#    np. cp -r /opt/infrastructure/backups/project2-src-<DATA> src
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 backend
# 2. Migracje wstecz tylko dedykowanym skryptem aplikacji
#    (rollback kodu NIE cofa migracji).
```

Backup DB przed kazdym wdrozeniem ze zmiana modeli:

```bash
docker exec project2-db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > /opt/infrastructure/backups/project2-db-$(date +%F).sql.gz
```

## Uwagi

- `ALLOWED_HOSTS` musi zawierac `otula.hackyeah.site,127.0.0.1,localhost`
  (healthcheck + testy wewnetrzne) oraz `project2-app,project2-backend`
  (Host przekazywany wewnatrz sieci Dockera).
- Konta demo (SPEC §9): `demo@otula.app` (Marta, postpartum),
  `demo-cycle@otula.app` (Kasia, cykl) — haslo w server-side `.env`
  (`DEMO_PASSWORD`), nie w repo ani w tym pliku.
- Numery helpline w seed data oznaczone `VERIFY` do potwierdzenia przez czlowieka.
- Email LE w NPM: `admin@otula.hackyeah.site` — podmienic na prawdziwy adres
  wlasciciela do powiadomien o wygasnieciu (edycja certyfikatu w panelu NPM).
