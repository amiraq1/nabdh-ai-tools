# تطبيق إدارة الموردين والأرصدة - Design Guidelines

## Design Approach
**System-Based Approach**: Material Design principles adapted for Arabic RTL interface, prioritizing data clarity and operational efficiency. Selected for its robust handling of dense information, clear visual hierarchy, and proven success in financial/business applications.

## Core Design Principles
- **Data First**: Information accessibility over decorative elements
- **RTL Native**: All layouts mirror-ready for Arabic right-to-left flow
- **Scan-ability**: Quick data parsing through strong visual hierarchy
- **Consistency**: Predictable patterns for frequent daily use

## Typography System

**Arabic Font Stack**: 
- Primary: 'IBM Plex Sans Arabic' or 'Cairo' via Google Fonts CDN
- Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)

**Hierarchy**:
- Page Headers: text-3xl font-bold (36px)
- Section Headers: text-xl font-semibold (24px)
- Card Titles: text-lg font-medium (20px)
- Body Text: text-base (16px)
- Labels/Captions: text-sm (14px)
- Metadata: text-xs (12px)

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: gap-4, gap-6, gap-8
- Page margins: m-8, m-12
- Card spacing: p-6

**Grid Structure**:
- Dashboard: 3-column grid (lg:grid-cols-3) for stat cards
- Tables: Full-width with sticky headers
- Forms: 2-column layout (lg:grid-cols-2) for efficiency
- Sidebar: Fixed 280px width (desktop), collapsible (mobile)

## Component Library

**Navigation**:
- Right-aligned sidebar (RTL) with icon + text menu items
- Top header bar with search, notifications, user profile (right-aligned)
- Breadcrumbs for deep navigation

**Dashboard Elements**:
- Stat Cards: Key metrics with large numbers, trend indicators, icon placeholders
- Quick Actions Bar: Primary action buttons prominently placed
- Recent Activity Feed: Transaction list with timestamps
- Balance Summary: Large numerical displays with currency formatting

**Data Tables**:
- Sortable column headers with icon indicators
- Striped rows for readability (alternate subtle backgrounds)
- Action buttons (edit/delete) right-aligned in rows
- Pagination controls bottom-right
- Export/filter controls top-left
- Row selection checkboxes

**Forms**:
- Grouped field sections with clear labels above inputs
- Required field indicators
- Inline validation messages
- Submit buttons right-aligned (RTL)
- Cancel/secondary actions left-aligned
- Multi-step forms with progress indicator at top

**Modal Dialogs**:
- Centered overlay with backdrop
- Clear header with close button (top-right for RTL)
- Content area with scrolling if needed
- Action buttons in footer (primary right, secondary left)

**Cards**:
- Elevated cards with subtle shadows
- Consistent padding (p-6)
- Clear header sections with titles and action menus
- Dividers between sections using border utilities

**Status Indicators**:
- Badge components for payment status (Heroicons library)
- Numeric indicators for balances (positive/negative)
- Progress bars for partial payments

## Accessibility
- All form inputs with visible labels
- Focus states on interactive elements (ring utilities)
- Keyboard navigation throughout
- ARIA labels for icon-only buttons
- Minimum touch targets 44x44px

## Responsive Behavior
- Mobile (base): Single column, stacked layout, hamburger sidebar
- Tablet (md): 2-column grids, expanded sidebar
- Desktop (lg+): Full 3-column layouts, persistent sidebar

## Assets
- Icons: Heroicons via CDN (outline style for UI, solid for filled states)
- No hero images required (utility application)
- Placeholder icons for supplier categories
- Chart library: Chart.js for balance visualizations

## Key Screens Structure

**Dashboard**: 3 stat cards (total suppliers, total balance, pending payments) + recent transactions table + quick add supplier button

**Suppliers List**: Search bar + filters dropdown + data table with columns (name, category, phone, current balance, actions) + floating add button

**Supplier Detail**: Header card (name, contact info, total balance) + tabs (overview, transactions, payments, invoices) + transaction history table

**Add/Edit Forms**: 2-column layout with fields (supplier info, category dropdown, contact details, initial balance) + save/cancel buttons

**Transaction Form**: Simple layout with supplier selector, amount input, type selector (debit/credit), date picker, notes field