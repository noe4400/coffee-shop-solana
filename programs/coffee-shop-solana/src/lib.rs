use anchor_lang::prelude::*;
declare_id!("8QNsjr6drj8ptAAmrZybaubn2U91xRY93taqobuU43G8");

#[program] 
pub mod coffe{
    use super::*;

  pub fn create_coffee_shop(
    ctx: Context<CreateCoffeeShop>,
    name: String,
) -> Result<()> {
     let owner_id = ctx.accounts.owner.key(); 
     let total_orders: u64 = 0;

     ctx.accounts.coffee_shop.set_inner(CoffeeShop {
        owner: owner_id,
        name,
        total_orders,
    });

    Ok(())
}

pub fn add_menu_item(
    context: Context<AddMenuItem>,
    name: String,
    price: u64,
) -> Result<()> {

    let owner = context.accounts.owner.key();
    let coffee_shop = &context.accounts.coffee_shop;

    // Verify the caller is the shop owner
    require!(
        coffee_shop.owner == owner,
        CoffeeError::Unauthorized
    );

    // Save the menu item
    context.accounts.menu_item.set_inner(MenuItem {
        shop: coffee_shop.key(),
        name,
        price,
        available: true,
    });

    Ok(())
}


}

#[error_code]
pub enum CoffeeError {
    #[msg("You are not the owner of this coffee shop")]
    Unauthorized,
}

#[account]

#[derive(InitSpace)] 
pub struct CoffeeShop {
    pub owner: Pubkey,
     #[max_len(60)]
    pub name: String,
    pub total_orders: u64,
}

#[account]
#[derive(InitSpace)] 
pub struct MenuItem {
    pub shop: Pubkey,
    #[max_len(30)]
    pub name: String,
    pub price: u64,
    pub available: bool,
}

#[account]
#[derive(InitSpace)] 
pub struct Order {
    pub shop: Pubkey,
    pub customer: Pubkey,
    #[max_len(5)] // Assuming a maximum of 5 items per order
    pub items: Vec<OrderItem>,
    pub total_price: u64,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct OrderItem {
    pub menu_item: Pubkey,
    pub price: u64,
    #[max_len(3)] // Assuming a maximum quantity of 3 for any item
    pub quantity: u8,
}

#[derive(Accounts)]
pub struct CreateCoffeeShop<'info> {

    #[account(
        init,
        payer = owner,
        space = 8 + CoffeeShop::INIT_SPACE,
        seeds = [b"coffee_shop", owner.key().as_ref()],
        bump
    )]
    pub coffee_shop: Account<'info, CoffeeShop>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct AddMenuItem<'info> {

    #[account(
        mut,
        seeds = [b"coffee_shop", owner.key().as_ref()],
        bump
    )]
    pub coffee_shop: Account<'info, CoffeeShop>,

    #[account(
        init,
        payer = owner,
        space = 8 + MenuItem::INIT_SPACE,
        seeds = [
            b"menu_item",
            coffee_shop.key().as_ref(),
            name.as_bytes()
        ],
        bump
    )]
    pub menu_item: Account<'info, MenuItem>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}