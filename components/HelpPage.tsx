'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, ChevronDown, ChevronRight, X } from 'lucide-react'

type Section = {
  id: string
  title: string
  subsections?: { id: string; title: string }[]
  content: React.ReactNode
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-400 text-black rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  )
}

function Table({ headers, rows, query }: { headers: string[]; rows: string[][]; query: string }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left px-3 py-2 bg-zinc-800 text-zinc-300 font-medium border border-zinc-700 first:rounded-tl last:rounded-tr">
                {highlight(h, query)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 border border-zinc-700 text-zinc-300 align-top">
                  {highlight(cell, query)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function P({ children, query }: { children: string; query: string }) {
  return <p className="text-zinc-300 leading-relaxed my-2">{highlight(children, query)}</p>
}

function H3({ children, id, query }: { children: string; id: string; query: string }) {
  return (
    <h3 id={id} className="text-base font-semibold text-white mt-6 mb-2 scroll-mt-24">
      {highlight(children, query)}
    </h3>
  )
}

function H4({ children, query }: { children: string; query: string }) {
  return (
    <h4 className="text-sm font-semibold text-zinc-200 mt-4 mb-1">
      {highlight(children, query)}
    </h4>
  )
}

function Li({ children, query }: { children: string; query: string }) {
  return (
    <li className="text-zinc-300 leading-relaxed ml-4 list-disc">
      {highlight(children, query)}
    </li>
  )
}

function Code({ children }: { children: string }) {
  return <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
}

function buildSections(query: string): Section[] {
  return [
    {
      id: 'getting-started',
      title: '1. Getting Started',
      subsections: [
        { id: 'first-time-setup', title: 'First-Time Setup' },
        { id: 'logging-in', title: 'Logging In' },
      ],
      content: (
        <div>
          <H3 id="first-time-setup" query={query}>First-Time Setup</H3>
          <P query={query}>When no users exist in the system, the login page will prompt you to create the first admin account. Fill in a username and password — this account will have full admin privileges.</P>

          <H3 id="logging-in" query={query}>Logging In</H3>
          <P query={query}>Navigate to the app URL and enter your username and password. If your organisation has configured Single Sign-On (SSO), provider buttons will appear on the login page and you can authenticate via those instead.</P>
          <P query={query}>Sessions last 8 hours, after which you will be asked to log in again.</P>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: '2. Dashboard',
      subsections: [
        { id: 'metric-cards', title: 'Metric Cards' },
        { id: 'colour-alerts', title: 'Colour Alerts' },
      ],
      content: (
        <div>
          <P query={query}>The dashboard is the home screen and gives a live overview of the entire system.</P>

          <H3 id="metric-cards" query={query}>Metric Cards</H3>
          <Table
            query={query}
            headers={['Section', 'Cards shown']}
            rows={[
              ['Assets', 'Total assets, Assigned, Available, Checked Out, Repair Needed, Retired, Booked'],
              ['Locations', 'Total locations'],
              ['Consumables', 'Total SKUs, Total quantity, Items needing reorder'],
              ['People', 'Total people, Assets currently assigned'],
              ['Maintenance', 'Total records, In Progress, Upcoming/Scheduled, Completed'],
            ]}
          />

          <H3 id="colour-alerts" query={query}>Colour Alerts</H3>
          <ul className="my-2 space-y-1">
            <Li query={query}>Yellow/Gold — Consumable stock has fallen to or below its reorder point; maintenance tasks are In Progress.</Li>
            <Li query={query}>Blue — Maintenance tasks are Scheduled/Upcoming.</Li>
          </ul>
          <P query={query}>Clicking any metric card takes you directly to the relevant section, with filters pre-applied where applicable.</P>
        </div>
      ),
    },
    {
      id: 'navigation',
      title: '3. Navigation',
      content: (
        <div>
          <H3 id="desktop-sidebar" query={query}>Desktop Sidebar</H3>
          <P query={query}>The sidebar lists all main sections. The active section is highlighted in white. Click the collapse toggle to hide labels and show icons only.</P>
          <P query={query}>Main links: Home · Assets · Kits · Locations · Consumables · Allocations · People · Maintenance · Models</P>
          <P query={query}>Bottom links: Types · Audit Log (admin only) · Settings (admin only)</P>
          <P query={query}>Your username and a sign-out button appear at the bottom of the sidebar.</P>

          <H3 id="mobile-nav" query={query}>Mobile</H3>
          <P query={query}>On mobile, navigation moves to a scrollable tab bar fixed to the bottom of the screen. All the same sections are available.</P>
        </div>
      ),
    },
    {
      id: 'assets',
      title: '4. Assets',
      subsections: [
        { id: 'asset-list', title: 'Asset List' },
        { id: 'adding-an-asset', title: 'Adding an Asset' },
        { id: 'editing-an-asset', title: 'Editing an Asset' },
        { id: 'bulk-editing', title: 'Bulk Editing' },
        { id: 'asset-detail', title: 'Asset Detail Page' },
      ],
      content: (
        <div>
          <H3 id="asset-list" query={query}>Asset List</H3>
          <P query={query}>The assets page shows all assets in a sortable, filterable table. Columns: Name · Asset Tag · Type · Status · Location · Tags. Click any column header to sort ascending; click again to sort descending.</P>

          <H4 query={query}>Searching and Filtering</H4>
          <ul className="my-2 space-y-1">
            <Li query={query}>Search bar — filters by name or asset tag (partial matches, case-insensitive).</Li>
            <Li query={query}>Status filter buttons — toggle one or more statuses to show only those assets.</Li>
            <Li query={query}>Tag filter — dropdown with search; select multiple tags to filter by.</Li>
            <Li query={query}>Clear filters — resets all active filters.</Li>
          </ul>

          <H3 id="adding-an-asset" query={query}>Adding an Asset</H3>
          <P query={query}>Requires Asset Control role or above. Click Add Asset and fill in:</P>
          <Table
            query={query}
            headers={['Field', 'Notes']}
            rows={[
              ['Name', 'Required'],
              ['Asset Tag', 'Required, must be unique'],
              ['Type', 'Optional free text'],
              ['Status', 'Select from configured statuses'],
              ['Location', 'Optional, select from locations list'],
              ['Tags', 'Optional, multi-select'],
            ]}
          />

          <H3 id="editing-an-asset" query={query}>Editing an Asset</H3>
          <P query={query}>Click the Edit button on any row. The row converts to inline inputs. Make changes and click Save, or Cancel to discard.</P>

          <H3 id="bulk-editing" query={query}>Bulk Editing</H3>
          <P query={query}>Requires Asset Control role or above. Tick the checkbox on one or more rows to select them. Use Shift+Click to select a range. A bulk action bar appears — you can update Status, Location, or Type across all selected assets at once. Click Delete in the bulk bar to delete all selected assets (confirmation required).</P>

          <H3 id="asset-detail" query={query}>Asset Detail Page</H3>
          <P query={query}>Click an asset's name to open its detail page. This page has several sections:</P>

          <H4 query={query}>Details</H4>
          <P query={query}>Editable fields: Name, Asset Tag, Type, Status, Location. Click Edit, make changes, then Save.</P>

          <H4 query={query}>Tags</H4>
          <P query={query}>Add or remove colour-coded tags. Admins can create new tags directly from this panel.</P>

          <H4 query={query}>Notes</H4>
          <P query={query}>A free-text notes field. Click Edit, type your notes, then Save.</P>

          <H4 query={query}>Photos</H4>
          <P query={query}>Upload photos by clicking the upload area or dropping files onto it. Photos are displayed in a grid. Click the delete icon on any photo to remove it.</P>

          <H4 query={query}>Kit Memberships</H4>
          <P query={query}>"Container for" lists any kits where this asset is the physical container. "In kits" lists any kits this asset is a member of. Both sections link through to the relevant kit detail page.</P>

          <H4 query={query}>Extras</H4>
          <P query={query}>Read-only summary of the person this asset is assigned to, recent allocations, and recent maintenance records.</P>
        </div>
      ),
    },
    {
      id: 'kits',
      title: '5. Kits',
      subsections: [
        { id: 'kit-list', title: 'Kit List' },
        { id: 'creating-a-kit', title: 'Creating a Kit' },
        { id: 'kit-detail', title: 'Kit Detail View' },
      ],
      content: (
        <div>
          <P query={query}>A kit is a named collection of assets — for example, a camera kit containing a camera body, lenses, and a carry case. A kit can optionally have a container asset (the physical bag or case that holds everything).</P>

          <H3 id="kit-list" query={query}>Kit List</H3>
          <P query={query}>Kits are displayed as cards showing the kit name, code, container asset, item count, and a preview of the first four items. Click a card to open the kit detail view.</P>

          <H3 id="creating-a-kit" query={query}>Creating a Kit</H3>
          <P query={query}>Requires Asset Control role or above. Click Make Kit and provide a name and kit code.</P>

          <H3 id="kit-detail" query={query}>Kit Detail View</H3>
          <H4 query={query}>Container Asset</H4>
          <P query={query}>The container is the physical object that holds the kit's contents. Assign one by selecting from the dropdown. The container cannot also be listed as a content item.</P>

          <H4 query={query}>Contents</H4>
          <P query={query}>The list of assets inside the kit. In edit mode, use the Add asset dropdown to add assets. Remove individual items with the X button.</P>

          <H4 query={query}>Deleting a Kit</H4>
          <P query={query}>Deleting a kit does not delete the assets inside it — they return to being standalone assets.</P>
        </div>
      ),
    },
    {
      id: 'locations',
      title: '6. Locations',
      content: (
        <div>
          <P query={query}>Locations represent physical places where assets can be stored or used. They support a parent–child hierarchy (e.g. Building → Room → Shelf).</P>
          <P query={query}>Requires Asset Control role or above to add or edit. Click Add Location and provide a name and optional parent location.</P>
          <P query={query}>Deleting a location requires confirmation. Assets assigned to a deleted location will be left without a location.</P>
        </div>
      ),
    },
    {
      id: 'consumables',
      title: '7. Consumables',
      subsections: [
        { id: 'adding-a-consumable', title: 'Adding a Consumable' },
        { id: 'reorder-alerts', title: 'Reorder Alerts' },
      ],
      content: (
        <div>
          <P query={query}>Consumables track stock items by SKU — things like batteries, cables, or cleaning supplies — where you care about quantity rather than individual serial numbers.</P>

          <H3 id="adding-a-consumable" query={query}>Adding a Consumable</H3>
          <P query={query}>Requires Asset Control role or above. Click Add Consumable and fill in:</P>
          <Table
            query={query}
            headers={['Field', 'Notes']}
            rows={[
              ['Name', 'Required'],
              ['SKU', 'Required, product/part code'],
              ['Location', 'Optional'],
              ['Quantity', 'Current stock level'],
              ['Reorder point', 'When quantity falls to this level, the dashboard highlights the item in yellow'],
              ['Unit cost', 'Optional, for cost tracking'],
            ]}
          />

          <H3 id="reorder-alerts" query={query}>Reorder Alerts</H3>
          <P query={query}>When a consumable's quantity is at or below its reorder point, it appears as a yellow alert on the dashboard. This is a visual indicator only — no automatic purchasing or notifications are generated.</P>
        </div>
      ),
    },
    {
      id: 'people',
      title: '8. People',
      content: (
        <div>
          <P query={query}>The People section maintains a list of individuals that assets can be assigned to. It displays each person's name, department, and the number of assets currently assigned to them.</P>
          <P query={query}>People records are created and edited through the Settings or via the asset assignment workflow. The people list itself provides a quick overview of who has what.</P>
        </div>
      ),
    },
    {
      id: 'maintenance',
      title: '9. Maintenance',
      subsections: [
        { id: 'creating-maintenance', title: 'Creating a Record' },
        { id: 'recurring-maintenance', title: 'Recurring Maintenance' },
        { id: 'quick-complete', title: 'Quick Complete' },
      ],
      content: (
        <div>
          <P query={query}>The Maintenance section tracks service records, scheduled work, and recurring maintenance tasks against assets.</P>

          <H4 query={query}>Status Colours</H4>
          <Table
            query={query}
            headers={['Status', 'Colour']}
            rows={[
              ['Pending', 'Orange'],
              ['Scheduled', 'Blue'],
              ['In Progress', 'Yellow'],
              ['Completed', 'Green'],
              ['Cancelled', 'Grey'],
            ]}
          />

          <H3 id="creating-maintenance" query={query}>Creating a Record</H3>
          <P query={query}>Requires Asset Control role or above. Click New Record and fill in:</P>
          <Table
            query={query}
            headers={['Field', 'Notes']}
            rows={[
              ['Asset', 'Required, select from dropdown'],
              ['Title', 'Required (e.g. "Annual PAT test")'],
              ['Description', 'Optional detail'],
              ['Status', 'PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED'],
              ['Scheduled date', 'Optional'],
              ['Completed date', 'Auto-populated when status set to COMPLETED'],
              ['Cost', 'Optional, displayed in £'],
              ['Repeat interval', 'No repeat, Daily, Weekly, Monthly, Quarterly, Every 6 months, Annually, or custom days'],
              ['Repeat end date', 'Optional — when the series should stop'],
            ]}
          />

          <H3 id="recurring-maintenance" query={query}>Recurring Maintenance (Series)</H3>
          <P query={query}>When a repeat interval is set, the system creates a series — a linked chain of recurring tasks. In the table, series appear as a collapsible header row showing the title, repeat pattern, total occurrences, end date, and completion progress (e.g. 3/12 completed).</P>
          <P query={query}>The system automatically spawns upcoming instances daily (up to 2 months ahead), so you will always have forthcoming tasks visible in advance.</P>
          <H4 query={query}>Deleting a Series</H4>
          <P query={query}>You can choose to delete upcoming instances only (keeping completed history) or delete the entire series including history.</P>

          <H3 id="quick-complete" query={query}>Quick Complete</H3>
          <P query={query}>Each maintenance row has a Complete today button that instantly sets the status to Completed and fills the completed date with today's date — useful for quick logging after a task is done.</P>
        </div>
      ),
    },
    {
      id: 'allocations',
      title: '10. Allocations',
      subsections: [
        { id: 'plan-items', title: 'Plan Items' },
        { id: 'assigning-assets', title: 'Assigning Assets' },
      ],
      content: (
        <div>
          <P query={query}>An allocation is a time-bounded plan for deploying a set of assets — for example, equipment booked out for an event or project.</P>
          <P query={query}>Requires Management role or above to create. Click New Allocation and provide a name, start date, and end date.</P>

          <H3 id="plan-items" query={query}>Plan Items</H3>
          <P query={query}>The plan section lets you record what is needed before confirming specific assets. Add plan items with a description, optional model number, quantity, notes, and an optional kit assignment.</P>

          <H3 id="assigning-assets" query={query}>Assigning Assets</H3>
          <P query={query}>Use the Assign / Remove mode toggle to switch between adding and removing assets.</P>

          <H4 query={query}>By Search</H4>
          <P query={query}>Type in the search box — up to 8 matching assets are suggested. Use arrow keys to navigate, Enter to select, Esc to close. Only assets not already in the allocation are shown.</P>

          <H4 query={query}>By Barcode</H4>
          <P query={query}>Click the barcode scanner button and grant camera permission. Point the camera at an asset's barcode or QR code. A confirmation overlay will appear — click Confirm to add it, or Skip to scan another. If a scanned asset is already in the allocation and you are in Remove mode, the scanner will offer to remove it.</P>

          <H4 query={query}>By Kit</H4>
          <P query={query}>Use the Kit dropdown to add all items in a kit to the allocation at once.</P>
        </div>
      ),
    },
    {
      id: 'audit-log',
      title: '11. Audit Log',
      content: (
        <div>
          <P query={query}>The Audit Log records every create, update, and delete action taken in the system. Requires Admin role.</P>
          <P query={query}>Each entry shows the timestamp, which user performed the action, the type of action, which entity was affected, and before/after values for updates.</P>
          <P query={query}>The log displays the most recent 500 events in reverse chronological order. It is read-only — records cannot be edited or deleted.</P>
        </div>
      ),
    },
    {
      id: 'settings',
      title: '12. Settings',
      subsections: [
        { id: 'logo', title: 'Logo' },
        { id: 'sso', title: 'OAuth / SSO' },
        { id: 'import-export', title: 'Import / Export' },
        { id: 'tags-statuses', title: 'Tags & Statuses' },
        { id: 'users', title: 'Users' },
        { id: 'danger-zone', title: 'Danger Zone' },
      ],
      content: (
        <div>
          <P query={query}>Requires Admin role. Access via the Settings link at the bottom of the sidebar.</P>

          <H3 id="logo" query={query}>Logo</H3>
          <P query={query}>Upload a custom logo to display in the sidebar. Supports common image formats. The existing logo can be deleted to revert to the default.</P>

          <H3 id="sso" query={query}>OAuth / SSO Providers</H3>
          <P query={query}>Configure third-party login providers (Google, Apple, or custom OIDC). Each provider can be enabled or disabled independently. Enabled providers appear as buttons on the login page.</P>

          <H3 id="import-export" query={query}>Import / Export</H3>
          <P query={query}>Export downloads all system data for backup or migration. Import uploads a data file to bulk-load assets, locations, people, or other records. Check the expected format before importing.</P>

          <H3 id="tags-statuses" query={query}>Asset Tags & Statuses</H3>
          <P query={query}>Tags are colour-coded labels applied to assets. Create a new tag by providing a name and selecting a colour. Edit or delete existing tags.</P>
          <P query={query}>Default statuses (Assigned, Available, Checked Out, Repair Needed, Retired, Booked) are created automatically. You can add custom statuses, edit names, or delete statuses you don't need.</P>

          <H3 id="users" query={query}>Users</H3>
          <Table
            query={query}
            headers={['Column', 'Notes']}
            rows={[
              ['Username', 'Login name'],
              ['Email', 'Optional'],
              ['Role', 'VIEW_ONLY, ASSET_CONTROL, MANAGEMENT, ADMIN'],
              ['Created', 'Account creation date'],
              ['Last login', 'Most recent login timestamp'],
            ]}
          />
          <P query={query}>Change a user's role using the role dropdown. Delete a user with the delete button (confirmation required). You cannot delete your own account.</P>

          <H3 id="danger-zone" query={query}>Danger Zone</H3>
          <P query={query}>Delete all data permanently removes all assets, locations, people, consumables, maintenance records, kits, and allocations from the database. This action cannot be undone. A confirmation prompt is shown before proceeding.</P>
        </div>
      ),
    },
    {
      id: 'roles',
      title: '13. User Roles & Permissions',
      content: (
        <div>
          <P query={query}>The system uses four roles in a hierarchy — each role includes all permissions of the roles below it.</P>
          <Table
            query={query}
            headers={['Role', 'Permissions']}
            rows={[
              ['View Only', 'Read-only access to all sections. Cannot create, edit, or delete anything.'],
              ['Asset Control', 'Create/edit/delete assets, bulk edit assets, manage locations, consumables, maintenance records, and kits. Assign tags to assets.'],
              ['Management', 'All Asset Control permissions plus: create and manage allocations, assign/remove assets from allocations, use barcode scanning, add kits to allocations.'],
              ['Admin', 'Full access including audit log, settings, user management, SSO configuration, logo upload, import/export, tag and status management, and delete all data.'],
            ]}
          />
        </div>
      ),
    },
    {
      id: 'barcode-scanning',
      title: '14. Barcode & QR Scanning',
      content: (
        <div>
          <P query={query}>The barcode scanner is available within the Allocations section to quickly assign or remove assets.</P>

          <H3 id="using-the-scanner" query={query}>Using the Scanner</H3>
          <ol className="my-2 space-y-1 list-decimal ml-4">
            {[
              'Click the barcode scanner icon in the allocation\'s asset assignment area.',
              'When prompted, grant camera access to your browser.',
              'Point the camera at an asset\'s barcode or QR code.',
              'The scanner detects the code automatically — no button press required.',
              'A confirmation overlay appears showing the asset name, tag, and the intended action (Add or Remove).',
              'Click Confirm to apply the action, or Skip to scan another item without making a change.',
            ].map((step, i) => (
              <li key={i} className="text-zinc-300 leading-relaxed">{highlight(step, query)}</li>
            ))}
          </ol>

          <H3 id="torch" query={query}>Torch / Flashlight</H3>
          <P query={query}>On supported devices, a torch toggle button is available in the scanner view to illuminate poorly-lit barcodes.</P>

          <H3 id="qr-codes" query={query}>QR Codes</H3>
          <P query={query}>Each asset has a QR code that can be generated and printed from its detail page. Scanning this QR code in the allocation scanner will identify the asset instantly.</P>

          <H3 id="scan-tips" query={query}>Tips</H3>
          <ul className="my-2 space-y-1">
            <Li query={query}>Hold the device steady and ensure the barcode fills most of the camera view.</Li>
            <Li query={query}>Ensure adequate lighting — use the torch button if available.</Li>
            <Li query={query}>If an asset's barcode does not scan, fall back to the search bar to find and add it manually.</Li>
          </ul>
        </div>
      ),
    },
  ]
}

function sectionMatchesQuery(section: Section, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  if (section.title.toLowerCase().includes(q)) return true
  // crude text match by rendering content to a string via recursive check
  const contentStr = JSON.stringify(section.content).toLowerCase()
  return contentStr.includes(q)
}

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const searchRef = useRef<HTMLInputElement>(null)

  const sections = useMemo(() => buildSections(query), [query])
  const filtered = useMemo(() => sections.filter(s => sectionMatchesQuery(s, query)), [sections, query])

  useEffect(() => {
    if (query.trim()) {
      const allOpen: Record<string, boolean> = {}
      filtered.forEach(s => { allOpen[s.id] = true })
      setOpenSections(allOpen)
    }
  }, [query, filtered])

  function toggle(id: string) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isOpen = (id: string) => query.trim() ? true : !!openSections[id]

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800 px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Help & Documentation</h1>
            <p className="text-zinc-400 text-sm mt-0.5">User manual for the Asset Tracker system</p>
          </div>
          <div className="sm:ml-auto relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search documentation…"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex gap-8">
        {/* Table of contents — desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Contents</p>
            <nav className="space-y-0.5">
              {sections.map(section => {
                const visible = sectionMatchesQuery(section, query)
                return (
                  <div key={section.id} className={visible ? '' : 'opacity-30'}>
                    <button
                      onClick={() => scrollTo(section.id)}
                      className="w-full text-left text-sm text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
                    >
                      {section.title}
                    </button>
                    {section.subsections && isOpen(section.id) && (
                      <div className="ml-3 border-l border-zinc-800 pl-2 space-y-0.5 mt-0.5">
                        {section.subsections.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => scrollTo(sub.id)}
                            className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded transition-colors"
                          >
                            {sub.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {filtered.length === 0 && (
            <div className="text-zinc-400 text-sm py-12 text-center">
              No results for <span className="text-white">&ldquo;{query}&rdquo;</span>
            </div>
          )}

          {filtered.map(section => (
            <div key={section.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <button
                id={section.id}
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left scroll-mt-24 hover:bg-zinc-800/50 transition-colors"
              >
                <h2 className="text-base font-semibold text-white">
                  {highlight(section.title, query)}
                </h2>
                {isOpen(section.id)
                  ? <ChevronDown size={18} className="text-zinc-400 shrink-0" />
                  : <ChevronRight size={18} className="text-zinc-400 shrink-0" />
                }
              </button>

              {isOpen(section.id) && (
                <div className="px-5 pb-5 pt-1 border-t border-zinc-800">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
