import { AptosAccount, AptosClient, TxnBuilderTypes, BCS, HexString } from "aptos";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";

async function main() {
    try {
        // Initialize Aptos client
        const client = new AptosClient(NODE_URL);

        // Create or load account
        let account: AptosAccount;
        const privateKeyPath = path.join(__dirname, "../.aptos/dev.key");

        if (fs.existsSync(privateKeyPath)) {
            const privateKey = fs.readFileSync(privateKeyPath).toString().trim();
            account = new AptosAccount(HexString.ensure(privateKey).toUint8Array());
        } else {
            account = new AptosAccount();
            // Save private key
            fs.mkdirSync(path.join(__dirname, "../.aptos"), { recursive: true });
            fs.writeFileSync(privateKeyPath, account.toPrivateKeyObject().privateKeyHex);
        }

        console.log(`Using account address: ${account.address()}`);

        // Fund account if needed
        const accountBalance = await client.getAccountBalance(account.address());
        if (accountBalance.toNumber() < 5000) {
            console.log("Funding account...");
            const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
            await faucetClient.fundAccount(account.address(), 100_000_000);
        }

        // Compile and publish the module
        console.log("Publishing module...");
        const packagePath = path.join(__dirname, "../contracts");
        
        const { moduleHex } = await client.publishPackage(
            account,
            {
                moduleName: "registry",
                packageName: "product_registry",
                initFunction: "init_registry",
            },
            packagePath
        );

        console.log("Module published successfully!");
        console.log(`Module hex: ${moduleHex}`);

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main();
