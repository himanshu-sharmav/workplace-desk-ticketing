---
version: alpha
colors:
  primary: '#234cc7'
  ink: '#20283e'
  muted: '#626b7e'
  background: '#f6f8fc'
  surface: '#ffffff'
  border: '#e1e6ef'
  paleBlue: '#edf2ff'
  success: '#237653'
  warning: '#936009'
  danger: '#b52d38'
  rail: '#172842'
  railText: '#f4f7ff'
  railMuted: '#b9c7dd'
  railActive: '#294268'
  railBorder: '#3c506d'
typography:
  heading:
    fontFamily: 'Manrope, sans-serif'
  body:
    fontFamily: 'DM Sans, sans-serif'
rounded:
  control: '8px'
  panel: '12px'
  dialog: '16px'
spacing:
  unit: '8px'
  panel: '24px'
---

# Workplace Desk design

## Overview

A small workplace service desk for clients, department managers, and technicians. The provided wireframe is the structural reference: ticket cards, open/resolved tabs, expandable actions, and a visible activity trail. This is a product workspace, not a marketing site.

The visual reference is a well-organized building reception desk: cool white surfaces, blue wayfinding, clear ownership, and quiet status signals. The signature is the compact ticket card: issue first, state alongside, and the people responsible underneath. Avoid gradients, decorative dashboards, invented metrics, and empty navigation items.

The interface uses English and en-IN dates in Asia/Kolkata. It assumes a desktop for triage and a phone for technicians. Light theme only.

Runtime ownership: `frontend/src/theme.ts` owns the palette and MUI settings. Its `colors` object generates CSS custom properties through `MuiCssBaseline`; `styles.css` consumes them. This document mirrors those values and records rationale. Status background tints are local visual variants; semantic status text uses the shared palette.

## Colors

Primary blue means an action or active selection. Amber means awaiting assignment; blue means pending resolution; green means resolved. All states also have text labels. White cards sit on a cool gray workspace with fine borders. Error feedback uses the danger palette, never color alone.

## Typography

Manrope 700/800 carries page and section headings; DM Sans 400–700 carries controls and content. Fonts are bundled locally. Main heading: 40px desktop, 32px mobile. Issue title: 18px; body: 15–16px; secondary ticket metadata: 12–13px. Text uses rem units and heading tracking never goes below -0.04em. Long issue titles and comments wrap, rather than hiding information.

## Layout

A 224px navy navigation rail, an 88px top bar, and a centered content region with 36px desktop gutters. The rail gives the white work area a clear boundary; its text uses explicit light-on-dark tokens. At 960px the rail becomes an icon rail; at 600px it disappears and all navigation remains accessible in the header/back link. Ticket detail uses a primary column and a 280px information column; below 1200px the information moves below the conversation. The document owns scrolling. On mobile, the title/action block is not sticky so a tall form cannot obscure the page. The comment composer stays reachable at the bottom. Ownership and next status are visible under the ticket title at every width. On phones, success notifications appear at the top so they cannot cover the composer.

## Elevation & Depth

Cards use borders, not floating shadows. Only dialogs, menus, and the sticky comment composer use restrained elevation.

## Shapes

8px controls, 12px panels, 16px dialogs. Small rectangular status labels contrast with circular initials for people.

## Components

MUI owns buttons, text fields, authored select menus, autocomplete, tabs, pagination, avatars, dialogs, and feedback. `SelectField` keeps select menus aligned to the trigger width and wraps long options; `StatusChip` owns status labels; `TicketCard` owns listing metadata; `Feedback` owns loading/error/empty panels. Focus rings are visible. Forms show inline validation; busy buttons retain their dimensions. Motion is limited to control feedback and the action expansion, and disabled for reduced motion.

Icons come from MUI's Material icons, accompanied by labels except for the explicitly named close action. The list uses six items per page. The detail screen retains the same status, person, and timestamp language as the listing.

## Do's and Don'ts

- Do show ticket issue, status, workspace, creator, and assignees consistently.
- Do keep errors and unsent form values together so users can retry.
- Don't use placeholder actions or invent unrelated product features.
- Don't sacrifice a readable issue title to keep a badge on the same row.

## Research behind the polish pass

The interface retains MUI rather than adding another component system. MUI owns focus, forms, dialogs, menus, and responsive theme primitives. The shipped font pair already supports the task; hierarchy and readable sizing matter more than adding a third face.

- [MUI typography](https://mui.com/material-ui/customization/typography/): theme-based variants, responsive sizing, rem units, and self-hosted fonts.
- [IBM type scale](https://www.ibm.com/design/language/typography/type-scale/): consistent relationships among text sizes and line heights. The app uses a compact subset adapted to its existing font pair, not IBM branding or components.

Drafts live only in React memory for the current browser tab, keyed by demo user and ticket where applicable. Closing a create dialog or navigating away from a comment does not discard the draft. Successful submission clears it; reloading or closing the tab does. No new browser persistence or workflow transitions were introduced.
