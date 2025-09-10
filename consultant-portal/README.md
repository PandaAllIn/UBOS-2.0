# EUFM Consultant Portal (Vite + React + TypeScript)

Deploy‑ready React web app for EUFM (European Union Funds Manager) — AI Agent Orchestration System. Includes routing, Tailwind CSS styling, Zustand state, drag‑and‑drop uploads, analysis and opportunities views, pricing with a placeholder Stripe checkout, and a contact form.

## Features

- React + TypeScript (Vite)
- Tailwind CSS styling
- React Router pages:
  - `/` Home
  - `/upload` Drag & drop upload
  - `/analysis` Deadline/compliance results
  - `/opportunities` Demo matched funding calls
  - `/pricing` €299/month with Stripe placeholder button
  - `/contact` Demo request form
- Components: Navbar, Footer, Dropzone, ResultsCard, PricingTable, StripeCheckoutButton
- State: Zustand demo store (files, compliance, deadlines, opportunities)
- Error handling and lightweight logging

## Getting Started

- Node.js 18+ recommended

```bash
# from repo root
cd consultant-portal
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and set values:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_BASE_URL=https://api.example.com
```

Notes:
- `VITE_` prefix is required for variables used in the browser.
- The current Stripe checkout is a placeholder alert; wire it to your backend when ready.

## Stripe Checkout (Placeholder)

The `StripeCheckoutButton` component demonstrates where you would trigger checkout. In production:

1) Create a Checkout Session on your backend with Stripe secret key.
2) Return the session ID to the client.
3) Use Stripe.js to redirect to Checkout.

Until a backend exists, the button shows a placeholder alert and logs events.

## Deploy

### Vercel

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Environment Variables: add from `.env` as needed

You can deploy with Vercel CLI:

```bash
vercel --cwd consultant-portal
```

Or via dashboard, setting the project root to `consultant-portal`.

### Netlify

- Build Command: `npm run build`
- Publish Directory: `dist`
- Base Directory: `consultant-portal`
- Environment Variables: add from `.env`

CLI deploy example:

```bash
cd consultant-portal
netlify init   # select site
netlify deploy --build --prod
```

## Project Structure

```
consultant-portal/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .env.example
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── lib/logger.ts
    ├── store/useAppStore.ts
    ├── components/
    │   ├── Dropzone.tsx
    │   ├── Footer.tsx
    │   ├── Navbar.tsx
    │   ├── PricingTable.tsx
    │   └── StripeCheckoutButton.tsx
    └── pages/
        ├── Analysis.tsx
        ├── Contact.tsx
        ├── Home.tsx
        ├── Opportunities.tsx
        ├── Pricing.tsx
        └── Upload.tsx
```

## Notes on Quality & Safety

- TypeScript strict mode enabled; basic try/catch and logging provided
- Tailwind content paths scoped to `index.html` and `src/**/*.{ts,tsx}`
- No server code; all data shown is demo/local state
- Keep files <500 lines and functions focused per EUFM guidelines

## Next Steps

- Connect to backend APIs for real analysis and opportunity data
- Implement Stripe Checkout via server‑side session creation
- Add authentication and protected routes if needed
- Set up analytics and error monitoring

