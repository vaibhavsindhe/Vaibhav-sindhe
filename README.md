# 🛍️ Shopify Collection Demo – Featured Products with Infinite Scroll

## 📖 Project Overview

This repository contains a **demo implementation on a Shopify test store** that demonstrates how to pin featured products at the top of a collection page while still supporting infinite scroll, sorting, filtering, and pagination.

The objective of this project is to solve a common Shopify challenge:

> **Always display featured products at the top of a collection, even when products are loaded dynamically — without breaking Shopify’s native behavior.**

The solution works within Shopify’s Liquid constraints and uses JavaScript to handle cross-page ordering, infinite loading, and deduplication.

---

## 🔗 Repository & Branch Information

- **Repository:**  
  [https://github.com/vaibhavsindhe/Vaibhav-sindhe](https://github.com/vaibhavsindhe/Vaibhav-sindhe)

- **Branch Name:**  
  `feature/infinity-scroll`

- **Branch Link:**  
  [https://github.com/vaibhavsindhe/Vaibhav-sindhe/tree/feature/infinity-scroll](https://github.com/vaibhavsindhe/Vaibhav-sindhe/tree/feature/infinity-scroll)

---

## 🌐 Live Store Preview

You can preview the working demo on a Shopify test store using the link below:

- **Collection Preview:**  
  [Preview Link](https://vaibhav-sindhe-48-teststore.myshopify.com/collections/cycle)

- **Store Password:**  
  `vaibhavsindhe123`

This preview demonstrates the full functionality including featured pinning, infinite scroll, sorting, filtering, and deduplication.

---

## 🎯 Requirements Covered

This demo collection page satisfies all of the following requirements:

- The collection contains **100 total products**
- Exactly **15 products** are tagged as `featured`
- Featured products appear at **different positions across paginated pages**
- Products load via **infinite scroll**, 20 products per request
- **All 15 featured products are always pinned at the top** of the collection
- Remaining non-featured products appear afterward
- Shopify **sorting and filtering continue to work normally**
- Pagination **does not duplicate products**
- Handles cases where **featured products appear on later pages**

---

## ⭐ Featured Product Logic

On the **first load**, the page intentionally doesn’t show the grid immediately. It shows a loading state while JavaScript prepares the “featured first” ordering. Here’s what happens step by step:

- **Start in “loading” mode**  
   - As soon as the collection page loads, the script marks the grid container as “loading.”  
   - This hides the products and displays a loader.

- **Read the first page’s products**  
   - The script inspects the products already present in the HTML (page 1).  
   - For each product tile, it checks if the product is featured by looking for the **“Featured” badge** rendered by the theme.  
   - Any featured products found are added to an internal “featured set” so they can be tracked.

- **Fetch the rest of the collection pages (prefetch)**  
   - To ensure all featured products appear at the top immediately, the script follows Shopify’s pagination chain.  
   - It finds the “next page” link, fetches that page in the background, and scans the products for featured items.  
   - This repeats for subsequent pages up to a reasonable limit.  
   - Each featured product discovered is recorded using its handle to prevent duplicates.

- **Move all featured products to the top**  
   - Once all featured products are collected, the script inserts them at the very top of the current grid.  
   - It marks them internally as “already inserted,” so later infinite-scroll loads won’t add the same product again.

- **Keep the visible product count at 20**  
   - Inserting extra featured products could exceed the normal page size, so the script trims items from the bottom to maintain 20 visible products.

- **Print featured products**  
   - After insertion, the script prints the pinned featured products to the console, showing handle and visible title to match what the user sees.

- **Switch to “ready” mode**  
   - Finally, the script marks the container as “ready,” hiding the loader and revealing the product grid with featured products pinned at the top.

This sequence ensures that **on first load, featured products from all pages are collected, pinned, and displayed correctly** while maintaining the normal page count and preventing duplicates.

---

## 🔀 Separation of Featured vs Non-Featured Products

Each product rendered in the collection grid includes a **stable identifier**, allowing products to be tracked uniquely across pagination.

When subsequent pages are loaded via infinite scroll:

- Items containing the visible “Featured” badge that have not already been inserted are appended to the top if necessary.
- Non-featured products remain in their original relative order.
- This guarantees consistent ordering and prevents duplicates.

---

## ♾️ Infinite Scroll Behavior

Infinite scrolling is implemented using a dedicated pagination wrapper element.

The flow is:

- When the pagination element becomes visible in the viewport, the next page is requested.
- The returned page is parsed in memory.
- Newly loaded product items are appended to the existing grid.
- The pagination reference is replaced so scrolling continues seamlessly.

This creates a smooth, uninterrupted browsing experience.

---

## 🚫 Duplicate Product Prevention

Duplicates can occur when:

- Featured products are discovered early and pinned.
- The same products later appear again when their original page is reached.

To prevent this:

- All discovered featured products are tracked.
- Featured products already rendered in the grid are skipped.
- Once all featured products have been discovered, featured products from later pages are ignored entirely.

This guarantees that **each product appears only once** in the collection.

---

## 🔍 Sorting & Filtering Compatibility

Shopify’s built-in sorting and filtering update the collection grid dynamically using AJAX.

To maintain compatibility:

- A custom browser event signals when the product grid has been updated.
- Infinite scroll listens for this event and resets its internal state.
- When sorting or filters are applied:
  - Featured pinning is intentionally disabled.
  - Default Shopify behavior is preserved.
- When filters are cleared:
  - Featured pinning logic runs again.
  - Featured products return to the top of the collection.

Pagination always respects the current filtering and sorting parameters.

---

## ⚠️ Liquid Limitations & Solution Strategy

### Liquid Limitations

Shopify Liquid cannot reliably:

- Iterate over an entire large collection.
- Reorder products across paginated pages.
- Implement infinite scroll or advanced client-side behavior.

### Solution Strategy

**Liquid handles:**

- Rendering the current page of products.
- Displaying the Featured badge.
- Outputting pagination references.
- Providing stable DOM identifiers.

**JavaScript handles:**

- Fetching additional pages.
- Parsing returned HTML.
- Reordering and pinning featured products.
- Preventing duplicates.
- Synchronizing with sorting and filtering updates.

This separation ensures performance, reliability, and maintainability.

---

## 🧪 Demo Summary

- Featured products are always visible at the top of the collection.
- Infinite scrolling loads products smoothly.
- Sorting and filtering behave exactly as in a standard Shopify collection.
- No product duplication occurs.
- Late-arriving featured products are handled correctly.

---

## 🚀 Optional Enhancement

The system can easily support a configuration option to:

- Pin featured products **only on initial load**, or
- Pin featured products **even when filters are active**.

This can be enabled without major logic changes.

---

## 📦 Technology Stack

- Shopify Liquid
- Vanilla JavaScript
- Intersection Observer
- DOM parsing
- Custom browser events

---

## 🙌 Final Notes

This project demonstrates a **production-safe and scalable pattern** for implementing featured product pinning with infinite scroll on Shopify.

It avoids fragile Liquid workarounds and integrates cleanly with Shopify’s native UX, making it suitable for real-world storefronts.
