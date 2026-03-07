use anchor_lang::prelude::*;

declare_id!("8QNsjr6drj8ptAAmrZybaubn2U91xRY93taqobuU43G8");

#[program]
pub mod coffee_shop_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
