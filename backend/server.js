// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
const axios = require('axios'); // Import axios
// const { handlePayout } = require('./payhandle');


const app = express();
const PORT = 3000;
// app.use(cors());

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
// console.log(FLUTTERWAVE_SECRET_KEY);
// Load server's private key from environment variable
// const serverPrivateKeyPem = process.env.SERVER_PRIVATE_KEY;
// const serverPublicKeyPem = process.env.SERVER_PUBLIC_KEY;
let dNetwork = process.env.NODE_ENV;
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // API key from .env file


// DeepSeek API endpoint
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // Replace with actual DeepSeek API URL

// console.log(DEEPSEEK_API_KEY);


let MAIN_DIR = "/SolPayWay/backend";

app.use(cors());
app.use(express.json());


// Define RPC endpoints for each network
const NETWORK_RPC_ENDPOINTS = {
    mainnet: [
        'https://rpc.mainnet-alpha.sonic.game',
        'https://api.mainnet-alpha.sonic.game', // Primary
        'https://sonic.helius-rpc.com/', // Backup 1
        // 'https://ssc-dao.genesysgo.net', // Backup 2
    ],
    main: [
        'https://rpc.mainnet-alpha.sonic.game',
        'https://api.mainnet-alpha.sonic.game', // Primary
        'https://sonic.helius-rpc.com/', // Backup 1
        // 'https://ssc-dao.genesysgo.net', // Backup 2
    ],
    devnet: [
        // 'https://spring-quick-surf.solana-devnet.quiknode.pro/016ff48f0f7c3f1520e515c01dca9a83ef528317', // Backup 1
        // 'https://api.devnet.solana.com', // Primary
        'https://api.testnet.sonic.game/',
    ],
    // development: ['https://api.devnet.solana.com',],
    // dev: ['https://api.devnet.solana.com',],
    development: ['https://api.testnet.sonic.game/',],
    dev: ['https://api.testnet.sonic.game/',],
    localnet: [
        'http://127.0.0.1:8899', // Primary (local node)
    ],
};


// Function to get the first available RPC endpoint for a given network
async function getAvailableRpcEndpoint(network) {
    const endpoints = NETWORK_RPC_ENDPOINTS[network] || [];
    return endpoints[0]
    // for (const url of endpoints) {
    //     try {
    //         const connection = new Connection(url, 'confirmed');
    //         // Test the connection by fetching the latest block height
    //         await connection.getBlockHeight();
    //         return url; // Return the first reachable endpoint
    //     } catch (error) {
    //         console.warn(`RPC endpoint ${url} is unreachable:`, error);
    //     }
    // }
    // throw new Error(`No reachable RPC endpoints found for network: ${network}`);
}



// Serve "Hello World" at /sonic_universe/client/sonic_planet/api/
app.get(MAIN_DIR+'/', (req, res) => {
    res.send('Entrace Point - Hello world');
});

app.get(MAIN_DIR+"/api/metadata", async (req, res) => {
    const network_pref = req.query.network; // Extract the network parameter
    console.log("Received network:", network_pref);

    // set the preferred network from users-endpayoutHandlerpayoutHandler
    if(network_pref != null){
        dNetwork = network_pref;
    }

    // Get the first available RPC endpoint for the specified network
    const rpcUrl = await getAvailableRpcEndpoint(dNetwork);
    // const connection = new Connection(rpcUrl, 'confirmed');

    const metadata = await fetchMetadataForAccounts(rpcUrl, dNetwork);
    res.json(metadata);
});


// Verify payment route
app.get(MAIN_DIR+'/verify-payment/:transaction_id', async (req, res) => {
    const { transaction_id } = req.params;
    const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;

    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` }
        });

        if (response.data.status === 'success') {
            return res.status(200).json({ message: 'Payment verified successfully!', data: response.data.data });
        } else {
            return res.status(400).json({ message: 'Payment verification failed.' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error connecting to Flutterwave.' });
    }
});


// Payout endpoint
/* app.get(MAIN_DIR+'/api/payout', async (req, res) => {
    const { wallet_address, sol_amount, usdt_paid, payment_type, network, s_network, r_network, transaction_signature, transaction_id } = req.query;

    // Validate required parameters
    if (!wallet_address || !payment_type) {
        return res.status(400).json({ error: 'Missing required parameters: wallet_address and payment_type' });
    }

    try {
        const result = await handlePayout(wallet_address, sol_amount, usdt_paid, payment_type, network, s_network, r_network, transaction_signature, transaction_id);
        return res.json(result);
    } catch (error) {
        console.error('Error processing payout:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }

}); */


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
