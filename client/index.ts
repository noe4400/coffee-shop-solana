import * as anchor from "@coral-xyz/anchor";
import {
  createCoffeeShop,
  getCoffeeShop,
  addMenuItem,
  listMenuItems,
  updateMenuItem,
  removeMenuItem,
  placeOrder,
  getOrder,
} from "./client";

async function main() {
  console.log("\n Starting Coffee Shop Client Test\n");

  try {
    // ── 1. CREATE SHOP ───────────────────────────────────────────────
    console.log("━━━ CREATE SHOP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await createCoffeeShop("Solana Cafe");

    // ── 2. READ SHOP ─────────────────────────────────────────────────
    console.log("\n━━━ READ SHOP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await getCoffeeShop();

    // ── 3. ADD MENU ITEMS ────────────────────────────────────────────
    console.log("\n━━━ ADD MENU ITEMS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const lattePda = await addMenuItem("Latte", 5);
    await addMenuItem("Espresso", 3);
    await addMenuItem("Cappuccino", 6);
    await addMenuItem("Mocha", 7);
    await addMenuItem("Americano", 4);

    // ── 4. LIST MENU ITEMS ───────────────────────────────────────────
    console.log("\n━━━ LIST MENU ITEMS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await listMenuItems();

    // ── 5. UPDATE MENU ITEM ──────────────────────────────────────────
    console.log("\n━━━ UPDATE MENU ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await updateMenuItem("Latte", 8, null);        // price only
    await updateMenuItem("Espresso", null, false); // availability only
    await updateMenuItem("Cappuccino", 10, true);  // both at once

    console.log("\n📋 Menu after updates:");
    await listMenuItems();

    // ── 6. PLACE ORDER ───────────────────────────────────────────────
    console.log("\n━━━ PLACE ORDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const provider = anchor.AnchorProvider.env();
    const customer = anchor.web3.Keypair.generate();

    // Airdrop SOL to customer
    const sig = await provider.connection.requestAirdrop(
      customer.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
    console.log("💰 Customer funded:", customer.publicKey.toString());

    const orderPda = await placeOrder(customer, [
      { menuItem: lattePda, price: 8, quantity: 2 },
    ]);

    // ── 7. READ ORDER ────────────────────────────────────────────────
    console.log("\n━━━ READ ORDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await getOrder(0);

    // ── 8. REMOVE MENU ITEM ──────────────────────────────────────────
    console.log("\n━━━ REMOVE MENU ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await removeMenuItem("Espresso");

    console.log("\n📋 Menu after removal:");
    await listMenuItems();

    console.log("\n✅ All operations completed successfully!\n");

  } catch (err) {
    console.error("\n❌ Error:", err);
    process.exit(1);
  }
}

main();