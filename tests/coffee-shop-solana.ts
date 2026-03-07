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

  });