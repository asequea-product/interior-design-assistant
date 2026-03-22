# Interior Design Assistant

Sube fotos de tus habitaciones y obtén recomendaciones de compra personalizadas con IA (Claude Vision). Productos de IKEA, Zara Home, Maisons du Monde y más — con precios en euros.

## Stack

- Frontend: HTML/CSS/JS vanilla (sin framework)
- Backend: Vercel Serverless Function (Node.js)
- IA: Claude claude-sonnet-4-20250514 (Anthropic)

## Estructura

```
interior-design-assistant/
├── api/
│   └── analyze.js        # Serverless function — proxy a Anthropic
├── public/
│   └── index.html        # Frontend completo
├── .env.example          # Plantilla de variables de entorno
├── .gitignore
├── vercel.json           # Configuración de rutas Vercel
└── README.md
```

## Deploy en Vercel (5 minutos)

### 1. Sube el repo a GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/interior-design-assistant.git
git push -u origin main
```

### 2. Importa en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa tu repo de GitHub
3. En **Environment Variables** añade:
   - Key: `ANTHROPIC_API_KEY`
   - Value: tu API key de Anthropic (la encuentras en [console.anthropic.com](https://console.anthropic.com))
4. Click **Deploy**

### 3. Listo

Tu app estará en `https://tu-proyecto.vercel.app`

## Desarrollo local

```bash
npm i -g vercel
cp .env.example .env.local
# Edita .env.local con tu API key real
vercel dev
```

La app corre en `http://localhost:3000`

## Obtener una API key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create Key**
4. Copia la key y pégala en Vercel como variable de entorno
