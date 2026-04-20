# Asset Tracker — User Manual

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Navigation](#3-navigation)
4. [Assets](#4-assets)
5. [Kits](#5-kits)
6. [Locations](#6-locations)
7. [Consumables](#7-consumables)
8. [People](#8-people)
9. [Maintenance](#9-maintenance)
10. [Allocations](#10-allocations)
11. [Audit Log](#11-audit-log)
12. [Settings](#12-settings)
13. [User Roles & Permissions](#13-user-roles--permissions)
14. [Barcode & QR Code Scanning](#14-barcode--qr-code-scanning)

---

## 1. Getting Started

### First-Time Setup

When no users exist in the system, the login page will prompt you to create the first admin account. Fill in a username and password — this account will have full admin privileges.

### Logging In

Navigate to the app URL and enter your username and password. If your organisation has configured Single Sign-On (SSO), provider buttons will appear on the login page and you can authenticate via those instead.

Sessions last 8 hours, after which you will be asked to log in again.

---

## 2. Dashboard

The dashboard is the home screen and gives a live overview of the entire system.

### Metric Cards

| Section | Cards shown |
|---|---|
| **Assets** | Total assets, Assigned, Available, Checked Out, Repair Needed, Retired, Booked |
| **Locations** | Total locations |
| **Consumables** | Total SKUs, Total quantity, Items needing reorder |
| **People** | Total people, Assets currently assigned |
| **Maintenance** | Total records, In Progress, Upcoming/Scheduled, Completed |

### Colour Alerts

- **Yellow/Gold** — Consumable stock has fallen to or below its reorder point; maintenance tasks are In Progress.
- **Blue** — Maintenance tasks are Scheduled/Upcoming.

### Navigation Shortcuts

Clicking any metric card takes you directly to the relevant section, with filters pre-applied where applicable (e.g. clicking "In Progress" takes you to Maintenance filtered to In Progress).

---

## 3. Navigation

### Desktop Sidebar (left)

The sidebar lists all main sections. The active section is highlighted in white. Click the collapse toggle (arrow icon) to hide labels and show icons only — useful on smaller screens.

**Main links:** Home · Assets · Kits · Locations · Consumables · Allocations · People · Maintenance · Models

**Bottom links:** Types · Audit Log *(admin only)* · Settings *(admin only)*

Your username and a sign-out button appear at the bottom of the sidebar.

### Mobile (bottom tab bar)

On mobile, navigation moves to a scrollable tab bar fixed to the bottom of the screen. All the same sections are available.

---

## 4. Assets

### Asset List

The assets page shows all assets in a sortable, filterable table.

**Columns:** Name · Asset Tag · Type · Status · Location · Tags

Click any column header to sort ascending; click again to sort descending.

### Searching and Filtering

- **Search bar** — filters by name or asset tag (partial matches, case-insensitive).
- **Status filter buttons** — toggle one or more statuses to show only those assets.
- **Tag filter** — dropdown with search; select multiple tags to filter by.
- **Clear filters** — resets all active filters.

### Adding an Asset

Requires **Asset Control** role or above.

Click **Add Asset** and fill in:

| Field | Notes |
|---|---|
| Name | Required |
| Asset Tag | Required, must be unique |
| Type | Optional free text |
| Status | Select from configured statuses |
| Location | Optional, select from locations list |
| Tags | Optional, multi-select |

### Editing an Asset

Click the **Edit** button on any row. The row converts to inline inputs. Make changes and click **Save**, or **Cancel** to discard.

### Bulk Editing

Requires **Asset Control** role or above.

- Tick the checkbox on one or more rows to select them.
- Use **Shift+Click** to select a range.
- A bulk action bar appears — you can update Status, Location, or Type across all selected assets at once.
- Click **Delete** in the bulk bar to delete all selected assets (confirmation required).

### Kit Groups in the Asset Table

Assets that belong to a kit appear indented under their kit's header row. The kit header shows the kit name, kit code, and item count. Click the arrow on a kit header to expand or collapse its members.

### Asset Detail Page

Click an asset's name to open its detail page. This page is divided into several sections:

#### Details
Editable fields: Name, Asset Tag, Type, Status, Location. Click **Edit**, make changes, then **Save**.

#### Tags
Add or remove colour-coded tags. Admins can create new tags directly from this panel.

#### Notes
A free-text notes field. Click **Edit**, type your notes, then **Save**.

#### Photos
Upload photos by clicking the upload area or dropping files onto it. Photos are displayed in a grid. Click the delete icon on any photo to remove it. Photos are stored against this asset permanently.

#### Kit Memberships
- **Container for** — lists any kits where this asset is the physical container.
- **In kits** — lists any kits this asset is a member of.
Both sections link through to the relevant kit detail page.

#### Extras
Read-only summary of:
- The person this asset is currently assigned to (if any).
- Recent allocations this asset has appeared in.
- Recent maintenance records for this asset.

---

## 5. Kits

A kit is a named collection of assets — for example, a camera kit containing a camera body, lenses, and a carry case. A kit can optionally have a **container** asset (the physical bag or case that holds everything).

### Kit List

Kits are displayed as cards. Each card shows:
- Kit name and code
- Container asset (if assigned)
- Number of items
- Preview of the first four items

Click a card to open the kit detail view.

### Creating a Kit

Requires **Asset Control** role or above. Click **Make Kit** and provide a name and kit code.

### Kit Detail View

#### Editing the Kit
Click **Edit** to modify the kit name or code. Click **Save** to confirm.

#### Container Asset
The container is the physical object that holds the kit's contents (e.g. a hard case). Assign one by selecting from the dropdown. Remove it with the remove button. The container cannot also be listed as a content item.

#### Contents
The list of assets inside the kit. In edit mode, use the **Add asset** dropdown to add assets. Remove individual items with the **X** button.

#### Deleting a Kit
Click **Delete** on the kit detail view. A confirmation dialog will appear. Deleting a kit does not delete the assets inside it — they return to being standalone assets.

---

## 6. Locations

Locations represent physical places where assets can be stored or used. They support a parent–child hierarchy (e.g. Building → Room → Shelf).

### Location List

Shows all locations, their parent location (if any), and action buttons.

### Adding a Location

Requires **Asset Control** role or above. Click **Add Location** and provide:

| Field | Notes |
|---|---|
| Name | Required |
| Parent location | Optional — select to nest this location inside another |

### Editing and Deleting

Use the inline **Edit** button on each row. Delete with the **Delete** button (confirmation required).

---

## 7. Consumables

Consumables track stock items by SKU — things like batteries, cables, or cleaning supplies — where you care about quantity rather than individual serial numbers.

### Consumables List

Searchable table showing all SKUs with current quantities and reorder points.

### Adding a Consumable

Requires **Asset Control** role or above. Click **Add Consumable** and fill in:

| Field | Notes |
|---|---|
| Name | Required |
| SKU | Required, product/part code |
| Location | Optional |
| Quantity | Current stock level |
| Reorder point | When quantity falls to this level, the dashboard highlights the item in yellow |
| Unit cost | Optional, for cost tracking |

### Reorder Alerts

When a consumable's quantity is at or below its reorder point, it appears as a yellow alert on the dashboard. No automatic purchasing or notifications are generated — this is a visual indicator only.

---

## 8. People

The People section maintains a list of individuals that assets can be assigned to.

### People List

Displays each person's name, department, and the number of assets currently assigned to them.

### Managing People

People records are created and edited through the Settings or via the asset assignment workflow. The people list itself is read-only — it provides a quick overview of who has what.

---

## 9. Maintenance

The Maintenance section tracks service records, scheduled work, and recurring maintenance tasks against assets.

### Maintenance List

Sortable, filterable table of all maintenance records.

**Columns:** Asset · Title · Status · Scheduled date · Completed date · Cost

**Status colour codes:**

| Status | Colour |
|---|---|
| Pending | Orange |
| Scheduled | Blue |
| In Progress | Yellow |
| Completed | Green |
| Cancelled | Grey |

### Searching and Filtering

- **Search bar** — matches title, description, asset name, or asset tag.
- **Status filter buttons** — toggle one or more statuses.
- **Sort** — click any column header.

### Creating a Maintenance Record

Requires **Asset Control** role or above. Click **New Record** and fill in:

| Field | Notes |
|---|---|
| Asset | Required, select from dropdown |
| Title | Required (e.g. "Annual PAT test") |
| Description | Optional detail |
| Status | PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| Scheduled date | Optional |
| Completed date | Auto-populated when status set to COMPLETED |
| Cost | Optional, displayed in £ |
| Repeat interval | No repeat, Daily, Weekly, Monthly, Quarterly, Every 6 months, Annually, or custom number of days |
| Repeat end date | Optional — when the series should stop generating new instances |

### Recurring Maintenance (Series)

When a repeat interval is set, the system creates a **series** — a linked chain of recurring tasks. In the table, series appear as a collapsible header row (purple background) showing:

- Title and repeat pattern (e.g. ↻ Weekly)
- Total number of occurrences
- End date
- Completion progress (e.g. 3/12 completed)

Individual records in a series appear indented beneath the header. Expand or collapse a series with the arrow icon.

The system automatically spawns upcoming instances daily (up to 2 months ahead), so you will always have forthcoming tasks visible in advance.

#### Deleting a Series
Clicking Delete on a series record gives two options:
- **Delete upcoming only** — removes future instances but keeps completed history.
- **Delete entire series** — removes all records in the series including history.

### Quick Complete

Each maintenance row has a **Complete today** button that instantly sets the status to Completed and fills the completed date with today's date — useful for quick logging after a task is done.

---

## 10. Allocations

An allocation is a time-bounded plan for deploying a set of assets — for example, equipment booked out for an event or project.

### Allocation List

Table of all allocations showing name, date range, status, and asset count.

### Creating an Allocation

Requires **Management** role or above. Click **New Allocation** and provide a name, start date, and end date.

### Allocation Detail View

#### Plan Items
The plan section lets you record what is needed for the allocation before you have confirmed which specific assets will be used. Add plan items with:

| Field | Notes |
|---|---|
| Description | What is needed |
| Model number | Optional |
| Quantity | How many required |
| Notes | Optional |
| Kit assignment | Optionally link a kit to fulfil this plan item |

#### Assigning Assets

Use the **Assign** / **Remove** mode toggle to switch between adding and removing assets.

**Assigning by search:**
Type in the search box — up to 8 matching assets are suggested. Use arrow keys to navigate the list, Enter to select, Esc to close. Only assets not already in the allocation are shown.

**Assigning by barcode:**
Click the barcode scanner button. Grant camera permission when prompted. Point the camera at an asset's barcode or QR code. A confirmation overlay will appear showing the asset name and tag — click **Confirm** to add it, or **Skip** to scan another.

If a scanned asset is already in the allocation and you are in Remove mode, the scanner will offer to remove it.

**Assigning a kit:**
Use the Kit dropdown to add all items in a kit to the allocation at once.

#### Asset List

Shows all assets currently in the allocation with their name, tag, location, and status. Management users can remove individual assets using the remove button.

---

## 11. Audit Log

The Audit Log records every create, update, and delete action taken in the system.

Requires **Admin** role.

### What is Logged

- Timestamp
- Which user performed the action
- What type of action (created, updated, deleted)
- Which entity was affected (asset, location, person, etc.)
- Before and after values for updates

The log displays the most recent 500 events in reverse chronological order. It is read-only — records cannot be edited or deleted.

---

## 12. Settings

Requires **Admin** role. Access via the Settings link at the bottom of the sidebar.

### Logo

Upload a custom logo to display in the sidebar. Supports common image formats. The existing logo can be deleted to revert to the default.

### OAuth / SSO Providers

Configure third-party login providers (Google, Apple, or custom OIDC). Each provider can be enabled or disabled independently. Providers appear as buttons on the login page when enabled.

### Import / Export

- **Export** — downloads all system data in your chosen format for backup or migration.
- **Import** — uploads a data file to bulk-load assets, locations, people, or other records. Check the expected format before importing.

### Asset Tags

Manage the colour-coded tags that can be applied to assets.

- Create a new tag by providing a name and selecting a colour.
- Edit or delete existing tags.
- The tag's colour is shown as a swatch next to its name throughout the application.

### Asset Statuses

Manage the statuses available for assets. Default statuses (Assigned, Available, Checked Out, Repair Needed, Retired, Booked) are created automatically. You can add custom statuses, edit names, or delete statuses you do not need.

### Users

View and manage all user accounts.

| Column | Notes |
|---|---|
| Username | Login name |
| Email | Optional |
| Role | VIEW_ONLY, ASSET_CONTROL, MANAGEMENT, ADMIN |
| Created | Account creation date |
| Last login | Most recent login timestamp |

Change a user's role using the role dropdown on their row. Delete a user with the delete button (confirmation required). You cannot delete your own account.

### Danger Zone

**Delete all data** — permanently removes all assets, locations, people, consumables, maintenance records, kits, and allocations from the database. This action cannot be undone. A confirmation prompt is shown before proceeding.

---

## 13. User Roles & Permissions

The system uses four roles in a hierarchy — each role includes all permissions of the roles below it.

### View Only
- Read-only access to all sections.
- Cannot create, edit, or delete anything.

### Asset Control
*Includes View Only permissions, plus:*
- Create, edit, and delete assets.
- Bulk edit assets (status, location, type).
- Create, edit, and delete locations.
- Create, edit, and delete consumables.
- Create, edit, and delete maintenance records.
- Create, edit, and delete kits.
- Assign tags to assets.

### Management
*Includes Asset Control permissions, plus:*
- Create and manage allocations.
- Assign and remove assets from allocations.
- Use barcode scanning for allocation management.
- Add kits to allocations.

### Admin
*Includes Management permissions, plus:*
- Access the Audit Log.
- Access Settings.
- Manage user accounts and roles.
- Configure SSO / OAuth providers.
- Upload or remove the app logo.
- Import and export data.
- Create and manage asset tags.
- Create and manage asset statuses.
- Delete all data.

---

## 14. Barcode & QR Code Scanning

The barcode scanner is available within the Allocations section to quickly assign or remove assets.

### Using the Scanner

1. Click the **barcode scanner icon** in the allocation's asset assignment area.
2. When prompted, grant camera access to your browser.
3. Point the camera at an asset's barcode or QR code.
4. The scanner detects the code automatically — no button press required.
5. A confirmation overlay appears showing the asset name, tag, and the intended action (Add or Remove).
6. Click **Confirm** to apply the action, or **Skip** to scan another item without making a change.

### Torch / Flashlight

On supported devices, a torch toggle button is available in the scanner view to illuminate poorly-lit barcodes.

### QR Codes

Each asset has a QR code that can be generated and printed from its detail page. Scanning this QR code in the allocation scanner will identify the asset instantly.

### Tips

- Hold the device steady and ensure the barcode fills most of the camera view.
- Ensure adequate lighting — use the torch button if available.
- If an asset's barcode does not scan, you can fall back to the search bar to find and add it manually.

---

*End of manual.*
