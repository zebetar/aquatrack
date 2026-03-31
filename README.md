
# AquaTrack

This is a NextJS management application for Tubewell Water Supply, built in Firebase Studio.

## Quick Start (Vercel Deployment)

To host this app for free on Vercel without a credit card, follow these steps:

1.  **Sign Up for Vercel:** Use your GitHub account at [vercel.com](https://vercel.com).
2.  **Import Project:** Select your `zebetar/aquatrack` repository.
3.  **Add Environment Variables:** Copy these from your local `.env` file into the Vercel project settings:
    *   `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    *   `NEXT_PUBLIC_FIREBASE_APP_ID`
4.  **Add Admin Variable:** You also need the `FIREBASE_SERVICE_ACCOUNT_KEY`.
    *   Generate this in **Firebase Console > Project Settings > Service Accounts**.
    *   Click "Generate new private key", open the JSON file, and copy its entire content into a Vercel variable named `FIREBASE_SERVICE_ACCOUNT_KEY`.
5.  **Add AI Variable:** For the Revenue Projection feature, add `GOOGLE_GENAI_API_KEY` with your Google AI Studio API key.
6.  **Deploy:** Click "Deploy" and your app will be live! **Do not use Firebase "App Hosting" as it requires a paid plan.**

## How to Install as an App (PWA)

Once deployed to Vercel:
1. Open your Vercel URL in Chrome on your Android phone.
2. Tap the menu (three dots) and select **"Install app"**.
3. It will now appear on your home screen with an icon and work like a native application.

## Features

- **Admin Dashboard:** Metrics, charts, and AI revenue projection.
- **Customer Portal:** Usage history, billing, and profile management.
- **PDF Statements:** Professional automated reporting.
- **Dark/Light Mode:** Full aesthetic flexibility.
- **PWA Ready:** Installable on Android/iOS via your mobile browser.

For detailed project information, see [docs/project-summary.md](docs/project-summary.md).
