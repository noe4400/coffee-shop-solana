# ☕ Coffee Shop — Solana Program

A Solana on-chain program built with Anchor that manages a coffee shop: create a shop, manage a menu, and place orders with real SOL payments.

---

## What it does

- Create a coffee shop owned by a wallet
- Add, update, and remove menu items
- Place orders with on-chain SOL payment from customer to shop owner

---

## Option 1 — Run Locally

### Prerequisites

Install all dependencies following the official Solana guide:
- https://solana.com/docs/intro/installation
- https://solana.com/docs/intro/installation/dependencies

You will need:
- Rust
- Solana CLI
- Anchor CLI
- Node.js + Yarn

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd coffee-shop-solana

# Install dependencies
yarn install

# Generate a local wallet if you don't have one
solana-keygen new --outfile ~/.config/solana/id.json
```

### Run tests

```bash
# Terminal 1 — start local validator
solana-test-validator --reset

# Terminal 2 — build, deploy and test
anchor build
anchor deploy
anchor test --skip-local-validator
```

### Run the client

```bash
# Terminal 1 — start local validator (if not already running)
solana-test-validator --reset

# Terminal 2 — build and deploy
anchor build
anchor deploy

# Terminal 2 — run the client
anchor run client
```

The client will walk through all operations: creating the shop, adding menu items, placing an order, updating and removing items.

---

## Option 2 — Solana Playground (no installation needed)

If you don't want to install anything locally, you can run this program directly in the browser using [Solana Playground](https://beta.solpg.io).

> You do **not** need the test file (`tests/coffee-shop-solana.ts`) or the client (`client/`) for this option.
> Playground has its own built-in test UI that lets you call instructions directly from the browser.

### Steps

1. Go to https://beta.solpg.io
2. Click **"Create a new project"**
3. Select **Anchor (Rust)**
4. Replace the contents of `lib.rs` with the code from `programs/coffe/src/lib.rs` in this repo
5. Click **Build** (top toolbar)
6. Click **Deploy** — Playground will handle the wallet and devnet SOL automatically
7. Use the **Test UI** on the left panel to call instructions:
   - `create_coffee_shop` — enter a shop name
   - `add_menu_item` — enter name and price in lamports (e.g. `5000000` = 0.005 SOL)
   - `place_order` — enter item details and quantity
   - `update_menu_item` — update price or availability
   - `remove_menu_item` — close the account and reclaim rent

> Playground runs on **devnet** by default and auto-funds your wallet — no setup required.

---

## Project Structure

```
coffee-shop-solana/
├── programs/
│   └── coffee-shop-solana/
│       └── src/
│           └── lib.rs        # On-chain program
├── tests/
│   └── coffee-shop-solana.ts              # Automated tests
├── client/
│   ├── client.ts             # Reusable client functions
│   └── index.ts              # Client runner script
├── Anchor.toml               # Anchor config
├── package.json
└── tsconfig.json
```

---

## Prices

This program stores prices in **lamports** (the smallest unit of SOL).

| SOL | Lamports |
|-----|----------|
| 1 SOL | 1,000,000,000 |
| 0.05 SOL | 50,000,000 |
| 0.005 SOL | 5,000,000 |

When calling instructions, always pass prices as lamports. The client helpers in `client/client.ts` handle the conversion for you.

---

## Program ID

```
8QNsjr6drj8ptAAmrZybaubn2U91xRY93taqobuU43G8
```

---

## Resetting local state

If you get "account already exists" errors when re-running locally:

```bash
solana-test-validator --reset
anchor deploy
```

This wipes the local ledger and starts fresh.

📱 Mobile Client

This Solana program is consumed by a React Native mobile application that allows users to browse the coffee shop menu and place orders directly from their phone using a Phantom wallet.

Mobile repository:

👉 https://github.com/noe4400/coffee-shop-mobile

What the mobile app does

The mobile application acts as the client for this on-chain program and provides the user interface for customers.

Features include:
	•	Retrieve coffee shop menu items from the Solana program
	•	Connect a Phantom wallet
	•	Display available items and prices
	•	Create purchase transactions
	•	Request transaction approval inside Phantom
	•	Submit the signed transaction to Solana

To learn more about the mobile client and how it interacts with the Solana program, check out the README in the mobile repository linked above.

![Mobile App Screenshot](assets/wallet-example.gif)