import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coffe } from "../target/types/coffe";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Coffe as Program<Coffe>;
const owner = provider.wallet;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getCoffeeShopPda(): anchor.web3.PublicKey {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("coffee_shop"), owner.publicKey.toBuffer()],
    program.programId
  );
  return pda;
}

function getMenuItemPda(coffeeShopPda: anchor.web3.PublicKey, itemName: string): anchor.web3.PublicKey {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("menu_item"), coffeeShopPda.toBuffer(), Buffer.from(itemName)],
    program.programId
  );
  return pda;
}

function getOrderPda(coffeeShopPda: anchor.web3.PublicKey, orderNumber: anchor.BN): anchor.web3.PublicKey {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("order"), coffeeShopPda.toBuffer(), orderNumber.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  return pda;
}

// ─── COFFEE SHOP ────────────────────────────────────────────────────────────

export async function createCoffeeShop(shopName: string) {
  const coffeeShopPda = getCoffeeShopPda();

  const tx = await program.methods
    .createCoffeeShop(shopName)
    .accounts({
      coffeeShop: coffeeShopPda,
      owner: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any)
    .rpc();

  console.log("✅ Coffee shop created:", shopName);
  console.log("   PDA:", coffeeShopPda.toString());
  console.log("   Tx:", tx);
  return coffeeShopPda;
}

export async function getCoffeeShop() {
  const coffeeShopPda = getCoffeeShopPda();
  const shop = await program.account.coffeeShop.fetch(coffeeShopPda);

  console.log("☕ Coffee Shop:");
  console.log("   Name:", shop.name);
  console.log("   Owner:", shop.owner.toString());
  console.log("   Total Orders:", shop.totalOrders.toNumber());
  return shop;
}

// ─── MENU ITEMS ─────────────────────────────────────────────────────────────

export async function addMenuItem(itemName: string, price: number) {
  const coffeeShopPda = getCoffeeShopPda();
  const menuItemPda = getMenuItemPda(coffeeShopPda, itemName);

  const tx = await program.methods
    .addMenuItem(itemName, new anchor.BN(price))
    .accounts({
      coffeeShop: coffeeShopPda,
      menuItem: menuItemPda,
      owner: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any)
    .rpc();

  console.log("✅ Menu item added:", itemName, "@ price", price);
  console.log("   PDA:", menuItemPda.toString());
  console.log("   Tx:", tx);
  return menuItemPda;
}

export async function listMenuItems() {
  const coffeeShopPda = getCoffeeShopPda();
  const allItems = await program.account.menuItem.all([
    {
      memcmp: {
        offset: 8, // skip discriminator
        bytes: coffeeShopPda.toBase58(),
      },
    },
  ]);

  console.log("📋 Menu Items:");
  allItems.forEach((item) => {
    console.log(`   - ${item.account.name}`);
    console.log(`     Price: ${item.account.price.toNumber()}`);
    console.log(`     Available: ${item.account.available}`);
    console.log(`     PDA: ${item.publicKey.toString()}`);
  });

  return allItems;
}

export async function updateMenuItem(
  itemName: string,
  newPrice: number | null,
  newAvailable: boolean | null
) {
  const coffeeShopPda = getCoffeeShopPda();
  const menuItemPda = getMenuItemPda(coffeeShopPda, itemName);

  const tx = await program.methods
    .updateMenuItem(
      newPrice ? new anchor.BN(newPrice) : null,
      newAvailable
    )
    .accounts({
      coffeeShop: coffeeShopPda,
      menuItem: menuItemPda,
      owner: owner.publicKey,
    } as any)
    .rpc();

  console.log("✅ Menu item updated:", itemName);
  if (newPrice) console.log("   New price:", newPrice);
  if (newAvailable !== null) console.log("   Available:", newAvailable);
  console.log("   Tx:", tx);
}

export async function removeMenuItem(itemName: string) {
  const coffeeShopPda = getCoffeeShopPda();
  const menuItemPda = getMenuItemPda(coffeeShopPda, itemName);

  const tx = await program.methods
    .removeMenuItem(itemName)
    .accounts({
      coffeeShop: coffeeShopPda,
      menuItem: menuItemPda,
      owner: owner.publicKey,
    } as any)
    .rpc();

  console.log("🗑️  Menu item removed:", itemName);
  console.log("   Tx:", tx);
}

// ─── ORDERS ─────────────────────────────────────────────────────────────────

export async function placeOrder(
  customerKeypair: anchor.web3.Keypair,
  items: { menuItem: anchor.web3.PublicKey; price: number; quantity: number }[]
) {
  const coffeeShopPda = getCoffeeShopPda();
  const shopAccount = await program.account.coffeeShop.fetch(coffeeShopPda);
  const orderNumber = shopAccount.totalOrders;
  const orderPda = getOrderPda(coffeeShopPda, orderNumber);

  const orderItems = items.map((i) => ({
    shop: coffeeShopPda,
    menuItem: i.menuItem,
    price: new anchor.BN(i.price),
    quantity: i.quantity,
  }));

  const tx = await program.methods
    .placeOrder(orderItems)
    .accounts({
      coffeeShop: coffeeShopPda,
      order: orderPda,
      customer: customerKeypair.publicKey,
      owner: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    } as any)
    .signers([customerKeypair])
    .rpc();

  console.log("✅ Order placed! Order #", orderNumber.toNumber());
  console.log("   Order PDA:", orderPda.toString());
  console.log("   Tx:", tx);
  return orderPda;
}

export async function getOrder(orderNumber: number) {
  const coffeeShopPda = getCoffeeShopPda();
  const orderPda = getOrderPda(coffeeShopPda, new anchor.BN(orderNumber));
  const order = await program.account.order.fetch(orderPda);

  console.log(`📦 Order #${orderNumber}:`);
  console.log("   Customer:", order.customer.toString());
  console.log("   Shop:", order.shop.toString());
  console.log("   Items:", order.items.length);
  order.items.forEach((item: any, i: number) => {
    console.log(`     [${i}] qty: ${item.quantity} @ ${item.price.toNumber()}`);
  });

  return order;
}