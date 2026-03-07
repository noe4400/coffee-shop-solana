use anchor_lang::prelude::*;
declare_id!("8QNsjr6drj8ptAAmrZybaubn2U91xRY93taqobuU43G8");

#[program] 
pub mod coffe{
    use super::*;

    pub fn create_coffee_shop() -> Result<()> {
        Ok(())
    }

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