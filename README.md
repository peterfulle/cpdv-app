# Tesorería CPV — 2°A 2026

App Next.js 14 + Prisma + PostgreSQL para administrar la tesorería del curso (cuotas, polerones, ingresos, MercadoPago).

## Stack

- **Next.js 14** (App Router)
- **Prisma 5** + PostgreSQL (SQLite en dev opcional)
- **NextAuth** (credenciales)
- **MercadoPago Checkout Pro** (pagos online + webhook)
- **Emotion + Framer Motion** (UI)

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Edita .env.local con DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma db push
npm run seed
npm run dev
```

Usuarios por defecto:

| Usuario     | Contraseña      | Rol           |
|-------------|-----------------|---------------|
| `tesorero`  | `tesorero2026`  | Administrador |
| `apoderado` | `apoderado2026` | Usuario       |

> **Importante**: cambia las contraseñas en producción inmediatamente.

## Despliegue en Render (Blueprint)

1. Sube este repo a GitHub (`peterfulle/cpdv-app`).
2. En Render → **New** → **Blueprint** → conecta el repo.
3. Render detecta [render.yaml](./render.yaml) y crea:
   - Postgres `cpdv-db`
   - Web service `cpdv-app` con disco persistente para comprobantes
4. Después del primer deploy, completa en el Dashboard las variables marcadas `sync: false`:
   - `NEXTAUTH_URL` = `https://<tu-servicio>.onrender.com`
   - `MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET`
   - `MP_WEBHOOK_BASE_URL` = `https://<tu-servicio>.onrender.com`
5. Carga datos iniciales desde la **Shell** del servicio en Render:
   ```bash
   npm run seed
   ```
   El seed es idempotente: si ya existen usuarios, no hace nada (usa `SEED_FORCE=1` para forzar).
6. Configura el webhook de MercadoPago:
   `https://<tu-servicio>.onrender.com/api/mercadopago/webhook`

## Notas operacionales

- **Comprobantes**: los archivos subidos se persisten en un disco montado en `public/comprobantes`. Sobrevive restarts del servicio.
- **Plan free**: el web service entra en spin-down tras 15 min sin tráfico. Para producción real conviene plan **Starter**.
- **Migraciones**: el blueprint usa `prisma db push` (sin historial de migraciones). Si más adelante quieres migraciones formales, ejecuta `npx prisma migrate dev --name init` localmente y cambia el `startCommand` a `npx prisma migrate deploy`.
- **Backups**: en Render Postgres free los backups son limitados; planifica subir a **Starter** antes de uso intensivo.

## Seguridad

- Nunca commitees `.env*` (ya están en [.gitignore](./.gitignore)).
- Rota `NEXTAUTH_SECRET` y credenciales MP si se filtran.
- Las API keys de Render solo se usan en su Dashboard / API; no las pongas en el código ni en commits.
