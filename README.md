# ShopEase — Task 4 E-Commerce Storefront

A responsive e-commerce storefront built with **HTML, CSS, and vanilla JavaScript** for the Datheon Task 4 brief.

## Features

- Fetches product data from FakeStoreAPI
- Product cards with images, names, prices, categories, ratings, and rating counts
- Search by product name, description, or category
- Category dropdown and quick-filter chips
- Sorting by featured order, price, rating, and name
- Slide-out shopping cart with item-count badge
- Add/remove products and increase/decrease quantities
- Automatic subtotal, shipping, and grand-total calculations
- Free shipping for subtotals of $100 or more
- Cart saved in `localStorage` so it remains after refresh
- Demo checkout modal with required name/email fields and order confirmation
- Loading, error/retry, and no-results states
- Responsive layout for mobile, tablet, and desktop
- Basic HTML escaping for API-sourced text

## Project files

```text
task4_ecommerce_project/
├── index.html
├── styles.css
├── script.js
└── README.md
```

## How to run in VS Code

1. Download and extract the ZIP file.
2. Open the `task4_ecommerce_project` folder in VS Code.
3. Install the **Live Server** extension if you do not already have it.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Make sure you have an internet connection because products are loaded from FakeStoreAPI and Google Fonts.

You can also serve the folder with Python from a terminal:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

> Do not just double-click the HTML if the browser blocks requests. Use Live Server or a local HTTP server.

## API

The project uses:

- Product catalogue: `https://fakestoreapi.com/products`

## How to test

1. Wait for product cards to load.
2. Search for `jacket` or another word.
3. Select a category using either the chips or dropdown.
4. Change sorting.
5. Press the `+` button on any product.
6. Open the bag and adjust quantities or remove items.
7. Confirm that subtotal, shipping, and total update.
8. Add enough items to reach $100 to see free shipping.
9. Select **Continue to checkout**, enter a name and email, and place a demo order.
10. Refresh before checkout to verify that the cart is saved.

## Important

This is a front-end learning/demo project. Checkout does **not** charge a payment method, create a real order, or send an email. A production store would need a secure backend, inventory and order storage, authentication, and a payment provider.
