import { Keypair } from "@gorbagana/web3.js";
import bs58 from "bs58";

const keypair = Keypair.generate();
console.log(keypair);
console.log("public key: ", keypair.publicKey.toString());
console.log("private key: ", bs58.encode(keypair.secretKey));
