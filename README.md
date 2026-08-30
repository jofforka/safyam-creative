# Safyam Creative Emporium — Premium Storefront + Admin Backend

This build is designed for **GitHub Pages + Supabase**. GitHub serves the premium storefront; Supabase provides the database, admin login and product-image storage.

## Included

- `index.html` — customer-facing premium storefront
- `admin.html` — product and store-management dashboard
- `styles.css` / `script.js` — storefront styling and interaction
- `admin.css` / `admin.js` — admin interface and product management
- `config.js` — Supabase connection settings
- `data/products.json` — fallback/demo catalogue
- `data/settings.json` — fallback store settings
- `supabase-schema.sql` — complete database/RLS/storage setup
- `assets/images/safyam-logo.jpeg` — official supplied logo
- `assets/images/safyam-brand-poster.jpeg` — official supplied brand artwork

## Current behavior

When `config.js` has no Supabase keys, the website runs in **demo/local mode**. Admin changes are stored only in that browser using Local Storage. This is useful for testing the management flow, but it is not a shared production backend.

When Supabase is configured, the same Admin page becomes the live backend: changes made by an authenticated admin are saved to the database and immediately become available to visitors.

## Connect the real backend

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase-schema.sql`.
3. In Supabase Authentication, create the approved admin user(s) with email/password.
4. Open `config.js` and paste the project URL and public anon key:

```js
window.SAFYAM_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-PUBLIC-KEY",
  productsTable: "products",
  settingsTable: "store_settings",
  storageBucket: "product-images",
  currency: "NGN",
  locale: "en-NG"
};
```

The anon key is intended for browser use. Security is enforced by the Row Level Security policies in the SQL file. Do **not** place a Supabase service-role key in this website.

## Admin capabilities

Open `/admin.html` after deployment. The dashboard supports:

- Add products
- Edit product name/category/description
- Change price and stock
- Show/hide a product
- Reorder featured products
- Replace image by URL
- Upload images directly to Supabase Storage in live mode
- Delete products
- Update hero text, announcement bar, WhatsApp, email and Instagram

## Sample product photography

The initial catalogue contains temporary online sample imagery to demonstrate the final product-card experience. Several samples are from Unsplash and include image-credit metadata. These are placeholders, not claims that the pictured products belong to Safyam. Replace them from Admin with Safyam's original product photography before commercial launch.

## GitHub Pages deployment

Upload all files to the repository root. In GitHub go to **Settings → Pages → Deploy from a branch**, select `main` and `/root`, then save.

## Recommended launch hardening

Before public launch: replace all sample photography, add the business WhatsApp/email, test the Supabase RLS policies with a non-admin browser, add custom domain/SSL, connect Paystack or Flutterwave for payment if required, add delivery pricing logic, and connect order notifications/analytics.
