import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey"
import { Keypair, PublicKey } from "@solana/web3.js"
import { AnchorMisc } from "../target/types/anchor_misc"
import * as spl from "@solana/spl-token"
import { expect } from "chai"

describe("anchor-misc", () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const connection = anchor.getProvider().connection
  const wallet = anchor.workspace.AnchorMisc.provider.wallet

  const program = anchor.workspace.AnchorMisc as Program<AnchorMisc>

  const receiver = anchor.web3.Keypair.generate()
  let senderTokenAccount: anchor.web3.PublicKey
  let receiverTokenAccount: anchor.web3.PublicKey
  let mint: anchor.web3.PublicKey

  before(async () => {
    mint = await spl.createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      3
    )

    senderTokenAccount = await spl.createAccount(
      connection,
      wallet.payer,
      mint,
      wallet.publicKey
    )

    receiverTokenAccount = await spl.getAssociatedTokenAddress(
      mint,
      receiver.publicKey
    )

    await spl.mintTo(
      connection,
      wallet.payer,
      mint,
      senderTokenAccount,
      wallet.payer,
      100_000
    )
  })

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .tokenTransfer(new anchor.BN(10))
      .accounts({
        receiver: receiver.publicKey,
        fromTokenAccount: senderTokenAccount,
        toTokenAccount: receiverTokenAccount,
        mint: mint,
      })
      .rpc()

    const tokenAccount = await spl.getAccount(connection, receiverTokenAccount)
    expect(Number(tokenAccount.amount)).to.equal(10)
  })

  it("Is initialized!", async () => {
    const mint = new PublicKey("")
    const receipient = new PublicKey("")
    const tokenAddress = await spl.getAssociatedTokenAddress(mint, receipient)

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

    const tokenAccount = await spl.getAccount(connection, tokenAddress)
    expect(Number(tokenAccount.amount)).to.equal(1)
  })

  it("Is initialized!", async () => {
    const mint = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")

    const [auth] = findProgramAddressSync(
      [Buffer.from("auth")],
      program.programId
    )

    console.log(auth)

    const tx = await program.methods
      .init()
      .accounts({
        mint: mint,
        tokenAccount: auth,
        auth: auth,
      })
      .rpc()

    const tokenAccount = await spl.getAccount(connection, auth)
    expect(Number(tokenAccount.amount)).to.equal(0)
  })

  it("Is initialized!", async () => {
    const mint = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")

    const tokenAddress = await spl.getAssociatedTokenAddress(
      mint,
      wallet.publicKey
    )

    const [auth] = findProgramAddressSync(
      [Buffer.from("auth")],
      program.programId
    )

    const tx = await program.methods
      .usdcDevTransfer()
      .accounts({
        auth: auth,
        fromTokenAccount: auth,
        toTokenAccount: tokenAddress,
        mint: mint,
      })
      .rpc()

    const tokenAccount = await spl.getAccount(connection, auth)
    console.log(tokenAccount.amount)
  })
})
