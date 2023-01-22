// miscellanous instructions used for Sandstorm hackathon
// can all be done without Anchor, but used to build Solana Pay transactions with Anchor instruction
use anchor_lang::prelude::*;

mod instructions;
use instructions::*;

declare_id!("5fqKSPzYfoRZw9c13o7y9yVZxoK5juJNTaSDEJgpKGAs");

#[program]
pub mod anchor_misc {
    use super::*;

    // create NFT, use as collection NFT
    pub fn create_nft(
        ctx: Context<CreateNft>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        instructions::create_nft_handler(ctx, uri, name, symbol)
    }

    // create NFT in collection
    pub fn create_nft_in_collection(
        ctx: Context<CreateNftInCollection>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        instructions::create_nft_in_collection_handler(ctx, uri, name, symbol)
    }

    // mint SFT as test in demo, replaced with NFT
    pub fn mint(ctx: Context<MintToken>) -> Result<()> {
        instructions::mint_handler(ctx)
    }

    // SPL token transfer, used to transfer USDC-dev token
    pub fn token_transfer(ctx: Context<TokenTransfer>, amount: u64) -> Result<()> {
        instructions::token_transfer_handler(ctx, amount)
    }

    // init PDA token account, used for program USDC-dev token account
    pub fn init(ctx: Context<Init>) -> Result<()> {
        instructions::init_handler(ctx)
    }

    // transfer USDC-dev token from PDA token account
    pub fn usdc_dev_transfer(ctx: Context<UsdcDevTransfer>) -> Result<()> {
        instructions::usdc_dev_transfer_handler(ctx)
    }
}
