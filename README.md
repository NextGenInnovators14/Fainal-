# AURICITY Contact System

Implemented the dedicated `/contact` page and protected contact-message management on top of the existing AURICITY project.

## Public
- `/contact` premium responsive Contact page
- CMS-driven hero, contact details, form labels, inquiry categories, quick actions, map, FAQs and bottom CTA
- Server-side validation and rate limiting
- Honeypot spam protection
- Success/error/loading states
- No contact messages are rendered publicly

## Navigation
- Contact Us is normalized to the `contact` view in desktop, mobile and footer navigation
- `About Us` remains a separate `about` view at `/about`
- Central SPA routing maps `contact` to `/contact`

## Admin
- `Contact CMS` section inside the existing Super Admin Hub
- Contact page content management
- Inquiry categories and FAQ management
- Quick-action enable/disable and destinations
- Map configuration
- Private Contact Messages inbox
- Search/filter/status management
- Message detail drawer with admin notes
- Statuses: New, Read, In Progress, Resolved, Archived

## Server API
- `POST /api/contact/messages`
- `GET /api/contact/messages` (admin PIN required)
- `PATCH /api/contact/messages/:id` (admin PIN required)
- `DELETE /api/contact/messages/:id` (admin PIN required)

The project continues to use AURICITY's existing server-side shared store architecture. For durable multi-instance production persistence on serverless hosting, an external database should be configured.
