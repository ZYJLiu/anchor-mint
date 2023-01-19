import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey"
import { PublicKey } from "@solana/web3.js"
import { Mint } from "../target/types/mint"
import { getAssociatedTokenAddress } from "@solana/spl-token"

describe("mint", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Mint as Program<Mint>

  it("Is initialized!", async () => {
    const mint = new PublicKey("")
    const receipient = new PublicKey("")
    const tokenAddress = await getAssociatedTokenAddress(mint, receipient)

    const [auth] = findProgramAddressSync(
      [Buffer.from("auth")],
      program.programId
    )

    const tx = await program.methods
      .mint()
      .accounts({
        mint: mint,
        tokenAccount: tokenAddress,
        auth: auth,
        receipient: receipient,
      })
      .rpc()
    console.log("Your transaction signature", tx)
  })
})
