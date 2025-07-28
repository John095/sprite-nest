# SpriteNest

SpriteNest is a game asset marketplace where developers and animators can share and sell assets like 3D models, sprites, and animations. Built with Next.js (App Router), TypeScript, Supabase, and Tailwind CSS, it offers user authentication, asset browsing, uploads, and download tracking for a seamless MVP experience.

## Features

- **User Authentication**: Sign up and log in with email/password via Supabase Auth.
- **Asset Browsing**: View assets with category filters (e.g., 3D, animation, audio).
- **Asset Upload**: Upload assets to Supabase Storage with metadata (title, category, engine, price, license).
- **Download Tracking**: Log asset downloads for analytics (inspired by click-tracking needs).
- **Responsive UI**: Styled with Tailwind CSS for a modern, user-friendly interface.

## Project Structure

```
spritenest/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   ├── (auth)/                 # Auth pages (login, signup)
│   ├── assets/                 # Asset browsing page
│   ├── upload/                 # Asset upload page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Tailwind CSS
├── components/                 # React components (Navbar, AssetGrid, etc.)
├── lib/                        # Shared logic
│   ├── models/                 # Supabase data access
│   ├── middleware/             # Auth middleware
│   ├── supabase/               # Supabase client/server setup
│   ├── types.ts                # TypeScript types
├── public/                     # Static assets (e.g., logo.png)
├── .env.local                  # Environment variables
├── next.config.js              # Next.js config
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind config
├── package.json                # Dependencies and scripts
├── README.md                   # This file
```

## Prerequisites

- Node.js (>=18.x)
- Supabase account and project
- Git
- Vercel CLI (for deployment)

## Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd spritenest
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:

   ```plaintext
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   - Get these from Supabase Dashboard > Project > Settings > API.

4. **Configure Supabase**:
   - Create a Supabase project.
   - Set up tables:
     - `users` (id: uuid, email: text, username: text, created_at: timestamp)
     - `assets` (id: uuid, user_id: uuid, title: text, description: text, category: text, engine: text, price: numeric, license: text, file_url: text, created_at: timestamp)
     - `downloads` (id: uuid, asset_id: uuid, user_id: uuid, created_at: timestamp)
   - Create a Storage bucket: `assets` (public or use signed URLs).
   - Generate TypeScript types:

     ```bash
     npx supabase gen types typescript --project-id your-project-id > lib/types.ts
     ```

   - Set up Row-Level Security (RLS) policies:

     ```sql
     -- Allow authenticated users to insert assets
     create policy "Allow auth users to insert assets" on assets
     for insert to authenticated with check (true);

     -- Allow public to read assets
     create policy "Allow public to read assets" on assets
     for select to public using (true);

     -- Allow authenticated users to insert downloads
     create policy "Allow auth users to insert downloads" on downloads
     for insert to authenticated with check (true);

     -- Allow public to read downloads (optional, for analytics)
     create policy "Allow public to read downloads" on downloads
     for select to public using (true);
     ```

5. **Run locally**:

   ```bash
   npm run dev
   ```

   - Access at `http://localhost:3000` (redirects to `/assets`).
   - Test signup (`/signup`), login (`/login`), asset upload (`/upload`), and browsing (`/assets`).

## Deployment

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Initial SpriteNest"
   git push origin main
   ```

2. **Deploy to Vercel**:

   ```bash
   vercel --prod
   ```

   - Set environment variables in Vercel Dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. **Verify**:
   - Check Supabase Dashboard for table/storage updates.
   - Test deployed app for auth, uploads, and browsing.

## Testing

- **Local Testing**:
  - Signup: Create a user at `/signup`.
  - Login: Sign in at `/login`.
  - Upload: Upload an asset at `/upload` (requires login).
  - Browse: View assets with category filters at `/assets`.
  - Download: Click "Download" to log in `downloads` table.
- **Supabase**:
  - Verify `assets` table and Storage bucket updates.
  - Ensure RLS policies allow public reads and authenticated writes.

## Next Steps

- **Secure Domain**: Purchase `spritenest.co` via Namecheap/GoDaddy.
- **Branding**: Add a logo (e.g., pixelated nest with sprites) to `public/logo.png`.
- **Features**:
  - Add Stripe for premium asset purchases (`app/api/checkout/route.ts`).
  - Implement full-text search in `AssetGrid.tsx` (`/api/assets?search=keyword`).
  - Add 5-star ratings with a `ratings` table.
- **Analytics**: Expand download tracking with a dashboard (similar to Polycrest click-tracking).

## Contributing

Contributions are welcome! Fork the repo, create a branch, and submit a pull request.

## License

MIT License
