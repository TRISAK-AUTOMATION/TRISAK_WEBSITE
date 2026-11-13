# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: purchasing / procurement staff at Thai manufacturers who need a trustworthy source of genuine industrial automation parts and a quote. Other audiences seen in the site (engineers looking up products, plant managers, job seekers via Career) are secondary and not confirmed as priorities.

## Product Purpose
Corporate website for TRISAK GROUP (Thailand). It must let a visitor browse the product catalog (categories, brands, series, product detail with availability) and contact TRISAK to request a quote. Both actions are equally important. Success: buyers find the right product and reach sales.

## Positioning
TRISAK is an authorized distributor: genuine OMRON, YASKAWA and NITTO products sourced directly from the brands. Authenticity of supply is the core claim.

## Operating Context
- Bilingual site: English and Thai (`client/src/i18n/translations.js`).
- Content is managed by staff through an admin CMS (`client/src/pages/admin/`): home, history, products/catalog, brands, industries, careers, contacts, popups, footer, menu.
- Inbound flows: contact requests / leads, career applications.

## Capabilities and Constraints
- Stack: React (Vite) client, Node/Express API, PostgreSQL.
- Pages: Home, History, Products (category / brand / series / product detail), Automation Solution, Career, Contacts.
- Site copy also describes engineering solutions (design, integration, commissioning) and technical support; these exist but are not the confirmed differentiator.
- Group includes TRISAK, FACCO and HTC (logos in `client/src/assets/logos/`); how much to present the group is undecided.

## Brand Commitments
- Name: TRISAK GROUP. Tagline (EN): "Industrial Automation & Engineering Solutions."
- Authorized-distributor relationship with OMRON, YASKAWA, NITTO must be stated accurately.

## Evidence on Hand
- Company timeline and brand partnerships in History content (editable in admin).
- Solution imagery: `client/src/assets/solutions/`.
- No testimonials, customer names, case studies or figures are confirmed; do not fabricate them.

## Product Principles
1. Genuine and authorized first: every surface should reinforce authentic supply.
2. Make the quote path short: from any product, reaching sales is one step.
3. Catalog serves buyers: part numbers, brand and availability are easy to scan.
4. Thai and English are equal citizens; layouts must hold both.
