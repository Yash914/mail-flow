# MailFlow

MailFlow is a lightweight email campaign workspace for managing recipients, creating personalized email campaigns, and reviewing send activity.

> **Current status:** This project is a frontend prototype. The interface uses sample data and simulated actions. It does not currently connect to an Excel file, database, email provider, or authentication system.

## Features

- Dashboard with recipient, campaign, sent-email, and failure statistics
- Recipient list with search and status filtering
- Recipient synchronization simulation
- Campaign list and campaign history views
- Campaign creation modal with live email preview
- Manual team leader name field
- Personalized message placeholders:
  - `{name}` — recipient name
  - `{email}` — recipient email address
  - `{teamLeaderName}` — team leader name entered in the campaign form
- Simulated campaign sending flow and success confirmation
- Responsive layout with mobile navigation

## Requirements

- Node.js 18.18 or newer
- pnpm

## Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Open the local URL shown by Next.js, normally:

   ```text
   http://localhost:3000
   ```

## How to Use the Web App

### 1. Dashboard

The Dashboard is the starting page. It shows an overview of workspace activity:

- **Total recipients** — the current recipient count in the prototype
- **New recipients** — recipients identified during the latest sync
- **Emails sent** — total sent email count
- **Failed** — messages that were not delivered
- **Recent campaigns** — recent campaign summaries
- **Recent activity** — recent workspace events

Select **Start a campaign** or **Create campaign** to open the campaign form.

### 2. Recipients

Open **Recipients** from the left navigation.

You can:

- Search by recipient name or email address
- Filter recipients by status, such as New, Updated, Delivered, or Invalid
- Select **Sync recipients** to simulate a synchronization process
- View the last synchronization time
- Select **Upload list** to see the intended upload entry point

The current Upload list button is visual only. Excel and CSV importing has not yet been implemented.

### 3. Campaigns

Open **Campaigns** to view all available campaigns, including:

- Campaign name
- Email subject
- Number of recipients
- Number sent
- Number failed
- Campaign status
- Creation date

Select **Create campaign** to create a new campaign.

### 4. Creating a Campaign

The campaign form contains these fields:

1. **Campaign name** — internal name for identifying the campaign
2. **Recipients** — choose the recipient group
3. **Team leader name** — enter the leader name that should appear in personalized emails
4. **Email subject** — subject line shown in the email
5. **Message** — email content and personalization placeholders

Example message:

```text
Hi {name},

Your team leader, {teamLeaderName}, has a few exciting updates to share with you.

Thanks,
The MailFlow team
```

If the team leader field contains `Morgan Lee` and the recipient is Olivia, the preview will display:

```text
Hi Olivia,

Your team leader, Morgan Lee, has a few exciting updates to share with you.

Thanks,
The MailFlow team
```

The current live preview demonstrates placeholder replacement for the sample recipient. Actual personalized sending is not connected yet.

Select **Send campaign** to run the simulated send flow. After a short delay, MailFlow displays a success message.

### 5. Email History

Open **History** to review previously sent messages. You can search by:

- Recipient name
- Recipient email
- Campaign name

Each row shows the delivery status and sent time. The **Export history** button is currently a visual placeholder.

### 6. Mobile Navigation

On smaller screens, select the menu button in the top-left corner to open the navigation drawer. Selecting a page automatically closes the drawer.

## Personalization Rules

Placeholders must be written exactly as follows:

| Placeholder | Value | Example |
|---|---|---|
| `{name}` | Recipient name | Olivia Martin |
| `{email}` | Recipient email | olivia@example.com |
| `{teamLeaderName}` | Team leader entered in the form | Morgan Lee |

The placeholder is case-sensitive. For example, `{teamLeaderName}` works, while `{teamleadername}` does not.

## Important Prototype Limitations

The current version does not yet:

- Import participants from `.xlsx` or `.csv` files
- Save manually entered recipients permanently
- Store team leader names per participant
- Send real emails
- Connect to an email service such as Resend, SendGrid, or Mailgun
- Persist campaigns in a database
- Provide user accounts or authentication
- Export history data
- Validate email addresses server-side
- Enforce unsubscribe or email-compliance requirements

The team leader name currently applies to the campaign preview as one campaign-level value. If every participant needs an individual team leader, the recipient data model should be expanded so each recipient has its own `teamLeaderName` field.

## Available Commands

```bash
pnpm dev       # Start the development server
pnpm build     # Create a production build
pnpm start     # Start the production server after building
```

## Technology

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React icons
- shadcn/ui project conventions

## Recommended Next Steps for Production

1. Add a database for recipients, team leaders, campaigns, and delivery records.
2. Add a manual recipient form with name, email, and team leader fields.
3. Add Excel/CSV parsing and column mapping.
4. Add an email provider and server-side sending route.
5. Personalize each message using recipient-specific data.
6. Add authentication and workspace permissions.
7. Add validation, unsubscribe handling, bounce tracking, and rate limits.
8. Replace simulated dashboard values with real database queries and email statistics.

## Project Structure

```text
app/
  layout.tsx       Root layout and metadata
  page.tsx         MailFlow dashboard and interactive prototype
  globals.css     Global styles and design tokens
public/            Static assets
package.json       Scripts and dependencies
```

## License

This project is private and intended for the project owner unless a separate license is provided.
