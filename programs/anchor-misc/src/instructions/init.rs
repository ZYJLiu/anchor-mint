use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = auth,
        seeds = ["auth".as_bytes().as_ref()],
        bump,
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: PDA
    #[account(
        seeds = ["auth".as_bytes().as_ref()],
        bump,
    )]
    pub auth: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn init_handler(ctx: Context<Init>) -> Result<()> {
    Ok(())
}
