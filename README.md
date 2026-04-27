# Royal Optics (Next.js + PostgreSQL)

Production-ready e-commerce rewrite for **Royal Optics** with storefront + admin dashboard.

## Tech Stack

- Next.js App Router (TypeScript)
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- Secure custom auth (JWT HttpOnly cookies + bcrypt)
- Razorpay integration (order create + signature verification)

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables in `.env`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/royal_optics?schema=public"
AUTH_SECRET="replace-with-strong-random-secret"
NEXTAUTH_SECRET="optional-alias-for-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxx"
ADMIN_SEED_USERNAME="admin"
ADMIN_SEED_PASSWORD="Admin@123"
```

3. Run migrations

```bash
npx prisma migrate dev
```

4. Seed database

```bash
npx prisma db seed
```

5. Start development server

```bash
npm run dev
```

## Default Seed Accounts

- Admin username: value from `ADMIN_SEED_USERNAME` (default `admin`)
- Admin password: value from `ADMIN_SEED_PASSWORD` (default `Admin@123`)
- Demo user email: `customer@royaloptics.com`
- Demo user password: `User@123`

## Key Features Implemented

- Home page with DB-driven hero banners, categories, trending products, testimonials, why-choose-us
- Product listing with filters and sort
- Product detail with lens customization slide-over and live pricing
- Guest + logged-in cart/wishlist
- Cart uniqueness by `product + selectedColor + lensDetails (hash)`
- Checkout with login requirement, address handling, promo code, Razorpay-first payment
- Razorpay order + verification flow
- User profile, password change, addresses, orders
- Admin modules:
  - Dashboard stats
  - Products (add/edit/delete, multiple image URLs)
  - Categories (parent/child)
  - Lens prices (dynamic option keys)
  - Orders (view/update status/delete)
  - Users (view/delete)
  - Blogs (add/edit/delete)
  - Testimonials (approve/disapprove/delete)

## Prisma Models

Includes:

- `User`, `AdminUser`, `Session`
- `Category`, `Product`, `ProductImage`
- `CartItem`, `WishlistItem`
- `LensPrice`
- `Order`, `OrderItem`, `Payment`
- `Blog`, `Testimonial`
- `PromoCode`
- `Address`
- `HeroBanner`, `WhyChooseItem`

## Notes

- Image paths use public assets and `/uploads/*` style storage path conventions.
- SQL injection risks from legacy PHP are removed by Prisma query handling.
- Order status is standardized through one enum (`OrderStatus`).
- Admin/user auth session keys are consistent through one auth cookie (`royal_auth`).
