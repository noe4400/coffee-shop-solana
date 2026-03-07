import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { expect } from "chai";
import { Coffe } from "../target/types/coffe";


describe("coffe", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Coffe as Program<Coffe>;

  it("Creates a coffee shop", async () => {
    const owner = provider.wallet;

    const shopName = "Solana Cafe";

    // Derive CoffeeShop PDA
    const [coffeeShopPda] = anchor.web3.PublicKey.findProgramAddressSync(
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

    await program.methods
      .createCoffeeShop(shopName)
      .accounts(accounts)
      .rpc();

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
});