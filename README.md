# Safyam Creative Emporium — Premium Website Build

A premium, mobile-first fashion and creative e-commerce front-end built with semantic HTML, CSS and vanilla JavaScript. It is designed for GitHub Pages and can later be connected to a real commerce backend.

## Included

- Editorial luxury homepage
- Responsive navigation + mobile menu
- Search overlay
- Product filtering and sorting
- 12-item demo catalogue
- Product quick-view modal
- Shopping bag with quantity controls
- Wishlist / saved pieces
- Order-request handoff into the enquiry form
- Lookbook section
- Brand story / services / training sections
- Testimonial slider
- Concierge enquiry form
- Newsletter capture UI
- Scroll animations and reduced-motion support
- SEO metadata + Schema.org Store markup
- Fully responsive layouts for mobile, tablet and desktop

## Files

- `index.html` — site structure and SEO
- `styles.css` — complete responsive visual system
- `script.js` — catalogue, bag, wishlist, search, modal, sliders and forms
- `assets/images/` — reserved for Safyam's original photography

## GitHub Pages deployment

1. Create a new public GitHub repository, e.g. `safyam-creative-emporium`.
2. Upload `index.html`, `styles.css`, `script.js` and the `assets` folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. GitHub will publish the site at your Pages URL.

## Before commercial launch

Replace the demo catalogue with Safyam's real product names, prices, stock details and original photography. Add the verified WhatsApp number, email address and delivery policy. Connect the order flow to WhatsApp or a backend. For actual online payments and inventory management, connect a production backend and Nigerian payment provider such as Paystack or Flutterwave.

## Product image convention

When original images are available, place them in `assets/images/` and update each product object in `script.js` with an `image` field. The current CSS-art placeholders are intentionally self-contained so the website can be previewed immediately.
