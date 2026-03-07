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

pub fn place_order(
    context: Context<PlaceOrder>,
    items: Vec<OrderItem>,
) -> Result<()> {

    let coffee_shop = &mut context.accounts.coffee_shop;
    let order = &mut context.accounts.order;
    let customer = context.accounts.customer.key();

    // Calculate total price
    let mut total_price: u64 = 0;

    for item in items.iter() {
        let item_total = item.price.checked_mul(item.quantity as u64)
            .ok_or(CoffeeError::ArithmeticOverflow)?;
        total_price = total_price.checked_add(item_total)
            .ok_or(CoffeeError::ArithmeticOverflow)?;
    }

    // Get blockchain timestamp
    let clock = Clock::get()?;
    let timestamp = clock.unix_timestamp;

    // Save order data
    order.set_inner(Order {
        shop: coffee_shop.key(),
        customer,
        items,
        total_price,
        timestamp,
    });

    // Increment shop order counter
    coffee_shop.total_orders = coffee_shop.total_orders.checked_add(1)
        .ok_or(CoffeeError::ArithmeticOverflow)?;

    Ok(())
}


}

#[error_code]
pub enum CoffeeError {
    #[msg("You are not the owner of this coffee shop")]
    Unauthorized,
    #[msg("Arithmetic overflow detected")]
    ArithmeticOverflow,
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


#[derive(Accounts)]
pub struct PlaceOrder<'info> {

    #[account(
        mut,
        seeds = [b"coffee_shop", coffee_shop.owner.as_ref()],
        bump
    )]
    pub coffee_shop: Account<'info, CoffeeShop>,

    #[account(
        init,
        payer = customer,
        space = 8 + Order::INIT_SPACE,
        seeds = [
            b"order",
            coffee_shop.key().as_ref(),
            &coffee_shop.total_orders.to_le_bytes()
        ],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub customer: Signer<'info>,

    pub system_program: Program<'info, System>,
}