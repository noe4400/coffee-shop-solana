import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coffe } from "../target/types/coffe";
import { expect } from "chai";

describe("coffe", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Coffe as Program<Coffe>;
  const owner = provider.wallet;

  const shopName = "Solana Cafe";
  const itemName = "Latte";
  const itemPrice = new anchor.BN(5);

  let coffeeShopPda: anchor.web3.PublicKey;
  let menuItemPda: anchor.web3.PublicKey;

  it("Creates a coffee shop", async () => {
    const owner = provider.wallet;

    [coffeeShopPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("coffee_shop"),
        owner.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Call program
    // construct the accounts object separately and widen its type so
    // TS doesn’t complain about the generated ResolvedAccounts union
    const accounts: any = {
      coffeeShop: coffeeShopPda,
      owner: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    };

    const tx =await program.methods
      .createCoffeeShop(shopName)
      .accounts(accounts)
      .rpc();
    
    console.log("Create shop tx:", tx);

    // Fetch account
    const coffeeShopAccount = await program.account.coffeeShop.fetch(
      coffeeShopPda
    );

    // Assertions
    expect(coffeeShopAccount.name).to.equal(shopName);
    expect(coffeeShopAccount.owner.toString()).to.equal(
      owner.publicKey.toString()
    );
    expect(coffeeShopAccount.totalOrders.toNumber()).to.equal(0);
  });

  it("Adds a menu item", async () => {
     [menuItemPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("menu_item"),
        coffeeShopPda.toBuffer(),
        Buffer.from(itemName),
      ],
      program.programId
    );
    const accounts: any = {
      coffeeShop: coffeeShopPda,
      owner: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    };

    const tx = await program.methods
      .addMenuItem(itemName, itemPrice)
      .accounts(accounts)
      .rpc();

    console.log("Add menu item tx:", tx);

    const menuItem = await program.account.menuItem.fetch(menuItemPda);

    expect(menuItem.name).to.equal(itemName);
    expect(menuItem.price.toNumber()).to.equal(5);
    expect(menuItem.available).to.equal(true);
    expect(menuItem.shop.toString()).to.equal(coffeeShopPda.toString());
  });


  it("Updates a menu item price", async () => {
    const newPrice = new anchor.BN(8);

    const accounts: any = {
      coffeeShop: coffeeShopPda,
      menuItem: menuItemPda,
      owner: owner.publicKey,
    };

    const tx = await program.methods
      .updateMenuItem(newPrice, null) // only updating price
      .accounts(accounts)
      .rpc();

    console.log("Update menu item (price) tx:", tx);

    const menuItem = await program.account.menuItem.fetch(menuItemPda);

    expect(menuItem.price.toNumber()).to.equal(8);
    expect(menuItem.available).to.equal(true);  // availability unchanged
    expect(menuItem.name).to.equal(itemName);   // name unchanged
  });
  
  it("Updates a menu item availability", async () => {
    const accounts: any = {
      coffeeShop: coffeeShopPda,
      menuItem: menuItemPda,
      owner: owner.publicKey,
    };

    const tx = await program.methods
      .updateMenuItem(null, false) // only toggling availability off
      .accounts(accounts)
      .rpc();

    console.log("Update menu item (availability) tx:", tx);

    const menuItem = await program.account.menuItem.fetch(menuItemPda);

    expect(menuItem.available).to.equal(false);
    expect(menuItem.price.toNumber()).to.equal(8); // price unchanged from previous test
  });

  it("Places an order", async () => {
  // Create a new customer wallet
  const customer = anchor.web3.Keypair.generate();

  // Airdrop SOL so the customer can pay transaction fees
  const signature = await provider.connection.requestAirdrop(
    customer.publicKey,
    1 * anchor.web3.LAMPORTS_PER_SOL
  );

  await provider.connection.confirmTransaction(signature);

  // Fetch current shop data to know order number
  const shopAccount = await program.account.coffeeShop.fetch(coffeeShopPda);
  const orderNumber = shopAccount.totalOrders;

  // Derive Order PDA
  const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("order"),
      coffeeShopPda.toBuffer(),
      orderNumber.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  const accounts: any = {
    coffeeShop: coffeeShopPda,
    order: orderPda,
    customer: customer.publicKey,
    owner: owner.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  };

  const tx = await program.methods
   .placeOrder([{ menuItem: menuItemPda, price: itemPrice, quantity: 2 }]) // ordering 2 lattes
    .accounts(accounts)
    .signers([customer])
    .rpc();

  console.log("Place order tx:", tx);

  // Fetch created order
  const orderAccount = await program.account.order.fetch(orderPda);

  expect(orderAccount.customer.toString()).to.equal(
    customer.publicKey.toString()
  );

  expect(orderAccount.shop.toString()).to.equal(
    coffeeShopPda.toString()
  );

  expect(orderAccount.items[0].quantity).to.equal(2);

  // Verify total orders increased
  const updatedShop = await program.account.coffeeShop.fetch(coffeeShopPda);
  expect(updatedShop.totalOrders.toNumber()).to.equal(1);
});

it("Removes a menu item", async () => {
    const accounts: any = {
        coffeeShop: coffeeShopPda,
        menuItem: menuItemPda,
        owner: owner.publicKey,
    };

    await program.methods
        .removeMenuItem(itemName)
        .accounts(accounts)
        .rpc();

    // Account should no longer exist
    try {
        await program.account.menuItem.fetch(menuItemPda);
        expect.fail("Account should have been closed");
    } catch (err) {
        expect((err as Error).message).to.include("Account does not exist");
    }
});

  });

  