// transfer SPL token from PDA token account to user token account
// used to setup mobile wallet in Sandstorm hackathon with USDC-dev token
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct UsdcDevTransfer<'info> {
    /// CHECK: mint authority PDA
    #[account(
        seeds = ["auth".as_bytes().as_ref()],
        bump,
    )]
    pub auth: UncheckedAccount<'info>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = auth
    )]
    pub from_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub to_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// transfer SPL token from PDA token account to user token account
pub fn usdc_dev_transfer_handler(ctx: Context<UsdcDevTransfer>) -> Result<()> {
    let seeds = &["auth".as_bytes(), &[*ctx.bumps.get("auth").unwrap()]];
    let signer = [&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.from_token_account.to_account_info(),
            to: ctx.accounts.to_token_account.to_account_info(),
            authority: ctx.accounts.auth.to_account_info(),
        },
        &signer,
    );

    token::transfer(cpi_ctx, 100_000_000)?;
    Ok(())
}
