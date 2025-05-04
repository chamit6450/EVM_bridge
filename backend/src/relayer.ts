import { ethers } from "ethers";
import { bridgeABI } from "./bridgeABI";
import { tokenABI } from "./tokenABI";
import * as dotenv from "dotenv";
dotenv.config();

const sourceRPC = process.env.SOURCE_RPC!;
const targetRPC = process.env.TARGET_RPC!;
const privateKey = process.env.PRIVATE_KEY!;
const bridgeAddressSource = process.env.SOURCE_BRIDGE!;
const bridgeAddressTarget = process.env.TARGET_BRIDGE!;
const tokenAddress = process.env.TOKEN_ADDRESS!;

async function main() {
  const sourceProvider = new ethers.JsonRpcProvider(sourceRPC);
  const targetProvider = new ethers.JsonRpcProvider(targetRPC);
  const wallet = new ethers.Wallet(privateKey, targetProvider);

  const bridgeSource = new ethers.Contract(bridgeAddressSource, bridgeABI, sourceProvider);
  const bridgeTarget = new ethers.Contract(bridgeAddressTarget, bridgeABI, wallet);
  const tokenTarget = new ethers.Contract(tokenAddress, tokenABI, wallet);

  console.log("Listening for burn events...");

  bridgeSource.on("Burn", async (user: string, amount: bigint) => {
    console.log(`Burn detected: ${user} burned ${amount.toString()} tokens`);

    const tx1 = await bridgeTarget.burnedOnOppositeChain(user, amount);
    await tx1.wait();
    console.log("updated pendingBalance on target chain");

    const tx2 = await bridgeTarget.mint(tokenTarget.address, amount);
    await tx2.wait();
    console.log("Minted on target chain");
  });
}

main().catch(console.error);
