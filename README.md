# SNP Padel Manager

Gestor de partidos para torneos de pádel Series Nacionales (SNP). Incluye:

- 📋 **Vista de partidos**: lista de enfrentamientos del día con countdown, llamadas a capitanes, asignación de canchas y marcador por sets.
- 🏟️ **Tablero de canchas**: vista tipo torre de control con las 16 canchas, estado en vivo, cola de espera y asignación rápida.
- 📂 **Importador de Excel**: mapeo manual de columnas para adaptar cualquier torneo.
- 🔄 **Sincronización**: tú y tu compañero ven los cambios en ~6 segundos vía Vercel KV.

## 🚀 Deploy en Vercel (sin CLI, drag & drop)

### Opción A: Deploy desde GitHub (recomendado)

1. Crea un repo nuevo en GitHub y sube esta carpeta (puedes hacerlo arrastrando los archivos desde la web de GitHub).
2. Ve a [vercel.com/new](https://vercel.com/new) y conecta tu repo.
3. En la pantalla de configuración, haz clic en **"Storage"** y añade una base de datos **Vercel KV** (gratis).
4. Vercel detectará automáticamente las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
5. Haz clic en **Deploy**. En 1 minuto tendrás tu link: `https://snp-padel-manager.vercel.app`

### Opción B: Deploy drag & drop (sin GitHub)

1. Comprime esta carpeta en un ZIP.
2. Ve a [vercel.com/new](https://vercel.com/new) y selecciona **"Upload"** (o arrastra el ZIP).
3. Añade Vercel KV como en la Opción A (pestaña Storage en el proyecto).
4. Deploy.

## 🔑 Configurar Vercel KV (importante para el sync)

Sin Vercel KV la app funciona, pero **no sincroniza entre dispositivos** (cada usuario ve solo sus datos locales). Para activar el sync compartido:

1. En tu proyecto de Vercel, ve a **Storage** → **Create Database** → **KV**.
2. Dale un nombre (ej: `snp-kv`) y crea.
3. En la pestaña de conexión, haz clic en **"Connect to Project"** y selecciona tu proyecto.
4. Vercel añade automáticamente las variables de entorno. Redesplega y listo.

## 📥 Usar la app

1. Abre tu link de Vercel.
2. Haz clic en **"Importar Torneo"** y sube los dos archivos Excel:
   - `enfrentamientos.xls` (partidos del torneo)
   - `jugadores.xls` (con nombres, teléfonos y equipo al que pertenecen)
3. Mapea las columnas si no se detectan automáticamente.
4. Selecciona el día en el header y empieza a gestionar.
5. **Comparte el link** con tu compañero: ambos ven los mismos datos en tiempo casi real.

## 🧱 Estructura

```
app/
  layout.js         # Layout raíz
  page.js           # Página principal con switcher de vistas
  api/data/route.js # API para leer/escribir estado en KV
components/
  ImportWizard.js   # Wizard de importación con mapeo de columnas
  MatchesView.js    # Vista de lista de partidos
  CourtsBoard.js    # Tablero de canchas tipo torre de control
lib/
  kv.js             # Wrapper de Vercel KV con fallback local
  utils.js          # Helpers (fechas, scoring, etc.)
```

## 📄 Licencia

Uso interno. Desarrollado para Antonio Tembleque.
