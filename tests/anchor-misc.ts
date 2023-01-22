import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey"
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js"
import { AnchorMisc } from "../target/types/anchor_misc"
import * as spl from "@solana/spl-token"
import { expect } from "chai"
import { Metaplex } from "@metaplex-foundation/js"
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet"

const nft = {
  uri: "https://arweave.net/SMtY1dDmkVHuKQgWhioTnGdDziZSdAgAUZbDL8gWX3U",
  name: "SANDSTORM",
  symbol: "LAMPORTDAO",
}

describe("anchor-misc", () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const connection = anchor.getProvider().connection
  const wallet = anchor.workspace.AnchorMisc.provider.wallet

  const program = anchor.workspace.AnchorMisc as Program<AnchorMisc>
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  )

  // Used same PDA for everything for simplicity and testing
  const [auth] = findProgramAddressSync(
    [Buffer.from("auth")],
    program.programId
  )

  const metaplex = Metaplex.make(connection)

  const collectionNftMint = Keypair.generate()
  const nftMint = Keypair.generate()

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

  it("Create Collection NFT", async () => {
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: collectionNftMint.publicKey })
    const masterEditionPDA = await metaplex
      .nfts()
      .pdas()
      .masterEdition({ mint: collectionNftMint.publicKey })

    const tokenAccount = getAssociatedTokenAddressSync(
      collectionNftMint.publicKey,
      wallet.publicKey
    )

    const transactionSignature = await program.methods
      .createNft(nft.uri, nft.name, nft.symbol)
      .accounts({
        mint: collectionNftMint.publicKey,
        metadata: metadataPDA,
        masterEdition: masterEditionPDA,
        auth: auth,
        tokenAccount: tokenAccount,
        user: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([collectionNftMint])
      .rpc()

    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const account = await getAccount(connection, tokenAccount)
    expect(Number(account.amount)).to.equal(1)
  })

  it("Create NFT in Collection", async () => {
    const metadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: nftMint.publicKey })
    const masterEditionPDA = await metaplex
      .nfts()
      .pdas()
      .masterEdition({ mint: nftMint.publicKey })
    const collectionMetadataPDA = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: collectionNftMint.publicKey })
    const collectionMasterEditionPDA = await metaplex
      .nfts()
      .pdas()
      .masterEdition({ mint: collectionNftMint.publicKey })

    const tokenAccount = getAssociatedTokenAddressSync(
      nftMint.publicKey,
      wallet.publicKey
    )

    // Instruction requires more compute units
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 250_000,
    })

    const tx = await program.methods
      .createNftInCollection(nft.uri, nft.name, nft.symbol)
      .accounts({
        mint: nftMint.publicKey,
        metadata: metadataPDA,
        masterEdition: masterEditionPDA,
        collectionMint: collectionNftMint.publicKey,
        collectionMetadata: collectionMetadataPDA,
        collectionMasterEdition: collectionMasterEditionPDA,
        auth: auth,
        tokenAccount: tokenAccount,
        user: wallet.publicKey,
        payer: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([nftMint])
      .transaction()

    const transferTransaction = new Transaction().add(modifyComputeUnits, tx)

    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transferTransaction,
      [(wallet as NodeWallet).payer, nftMint]
    )
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const account = await getAccount(connection, tokenAccount)
    expect(Number(account.amount)).to.equal(1)
  })

  it("SPL token transfer", async () => {
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

  // // Only run once to create PDA token account
  // it("Create PDA USDC-dev token account", async () => {
  //   const mint = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")

  //   const [auth] = findProgramAddressSync(
  //     [Buffer.from("auth")],
  //     program.programId
  //   )

  //   console.log(auth)

  //   const tx = await program.methods
  //     .init()
  //     .accounts({
  //       mint: mint,
  //       tokenAccount: auth,
  //       auth: auth,
  //     })
  //     .rpc()

  //   const tokenAccount = await spl.getAccount(connection, auth)
  //   expect(Number(tokenAccount.amount)).to.equal(0)
  // })

  it("Transfer USDC-dev from PDA token account", async () => {
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
  })

  // // Unused
  // it("PDA mint SPL Token, `SFT`", async () => {
  //   const mint = new PublicKey("")
  //   const receipient = new PublicKey("")
  //   const tokenAddress = await spl.getAssociatedTokenAddress(mint, receipient)

  //   const tx = await program.methods
  //     .mint()
  //     .accounts({
  //       mint: mint,
  //       tokenAccount: tokenAddress,
  //       auth: auth,
  //       receipient: receipient,
  //     })
  //     .rpc()

  //   const tokenAccount = await spl.getAccount(connection, tokenAddress)
  //   expect(Number(tokenAccount.amount)).to.equal(1)
  // })
})
