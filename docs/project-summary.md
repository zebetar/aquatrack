# AquaTrack - Project Summary

## Overview
**AquaTrack** is a professional, high-performance water supply management application tailored for tubewell operations. It streamlines the entire workflow from customer registration and water usage logging to billing, payments, and advanced financial reporting.

## Technical Stack
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript.
- **Styling:** Tailwind CSS, ShadCN UI components, Lucide icons.
- **Backend:** Firebase (Authentication, Firestore).
- **Charts & Data:** Recharts with ShadCN integration for interactive analytics.
- **Generative AI:** Google Genkit for intelligent financial forecasting.
- **PDF Engine:** jsPDF and jspdf-autotable for professional statement generation.
- **Deployment:** Optimized for Vercel (Free Hobby Plan) and Firebase (Free Spark Plan).

## Theme and User Experience
- **Aesthetic:** "Modern Professional Blue & Gold" color palette.
- **Glassmorphism:** Elegant, semi-transparent UI elements with backdrop filters.
- **Responsive Layout:**
    - **Desktop:** A hover-to-expand sidebar for efficient navigation.
    - **Mobile:** A swipe-to-open navigation drawer.
- **Theming:** Full native support for **Light and Dark modes**, allowing users to choose their preferred environment.
- **Interactive Elements:** Animated splash screens, shimmer text effects on login, and smooth transitions.

## Admin Features
### 1. Intelligence Dashboard
- **Key Metrics:** Real-time tracking of Total Customers, Monthly Supply (Hours/Minutes), Monthly Revenue (PKR), and Total Outstanding Debt.
- **Dynamic Charts:** Bar charts for supply volume and Area charts for revenue trends, supporting both daily and monthly granular views.
- **Quick Insights:** A "Top Outstanding Bills" list for immediate action on high-priority accounts.

### 2. Customer & User Management
- **Full CRM:** Searchable and filterable list of all customers.
- **Automated Provisioning:** Adding a customer automatically creates their secure Viewer login account.
- **Safe Deletion:** A "Final Statement" PDF is automatically generated and downloaded before a customer record is removed from the system.

### 3. Usage & Billing Logic
- **Usage Logging:** Record sessions by date and start/end time. The system automatically calculates duration and cost based on a global PKR/hour rate.
- **Payment Processing:** Log PKR payments which instantly update the customer's balance through Firestore Write Batches.
- **Automated Statements:** Generate and download professional PDF invoices for any date range.

### 4. Advanced Reporting & AI
- **AI Revenue Projection:** A Genkit-powered feature that analyzes current trends, last month's performance, and seasonal water consumption patterns (specifically for the Pakistan region) to forecast next month's income.
- **Financial Overviews:** Aggregated summaries of total revenue vs. outstanding balances.

## Viewer (Customer) Features
- **Personal Portal:** A simplified dashboard showing the customer their current balance and usage trends.
- **Usage Transparency:** A complete history of every water session logged by the admin.
- **Issue Reporting:** Customers can flag specific usage records for admin review, triggering an instant notification.
- **Self-Service Billing:** View a full history of all payments made to the tubewell operator.
- **Account Security:** Customers can independently manage their email and password within their profile.

## System Architecture
- **Role-Based Access Control (RBAC):** Custom Firebase Security Rules ensure that Admins have total control while Viewers are restricted strictly to their own data.
- **Command Palette:** A `Ctrl+K` searchable interface for power users to navigate pages and find customers instantly.
- **Data Integrity:** Batched Firestore operations ensure that balance updates are always synchronized with usage and payment logs.

---
*Generated for the AquaTrack Development Repository.*
