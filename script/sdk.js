class SolPayWay {
    constructor({ amount, receiver, successUrl, cancelUrl, network, startTime,  }) {
        
        this.amount = amount;
        this.receiver = receiver;
        this.successUrl = successUrl;
        this.cancelUrl = cancelUrl;
        this.startTime = startTime || Date.now();
        this.transactionSignature = null;
        this.transactionId = null;
        this.trackingInterval = null;
        // this.network = "http://127.0.0.1:8899";
        // this.network = "https://api.devnet.solana.com";
        // this.network = "https://spring-quick-surf.solana-devnet.quiknode.pro/016ff48f0f7c3f1520e515c01dca9a83ef528317";
        // this.network = "http://127.0.0.1:3001/proxy";

        // Map network names to their RPC endpoints
        this.networkRpcMap = {
            devnet: "https://api.devnet.solana.com",
            mainnet: "https://api.mainnet-beta.solana.com",
            sonictestnet: "https://sonic-testnet.rpc.com", // Replace with actual Sonic testnet RPC
            sonicmainnet: "https://sonic-mainnet.rpc.com", // Replace with actual Sonic mainnet RPC
            localhost: "http://127.0.0.1:8899",
            custom: "https://spring-quick-surf.solana-devnet.quiknode.pro/016ff48f0f7c3f1520e515c01dca9a83ef528317"
        };

        // Validate and set the network RPC
        if (!this.networkRpcMap[network]) {
            // Check if the network is a valid URL
            try {
                new URL(network); // Throws an error if the network is not a valid URL
                this.network = network; // Use the provided URL as the RPC endpoint
            } catch {
                throw new Error(`Unsupported network: ${network}. Supported networks: ${Object.keys(this.networkRpcMap).join(', ')}`);
            }
        } else {
            this.network = this.networkRpcMap[network]; // Use the mapped RPC endpoint
        }

        // Validate and set the network RPC
        // if (!this.networkRpcMap[network]) {
        //     throw new Error(`Unsupported network: ${network}. Supported networks: ${Object.keys(this.networkRpcMap).join(', ')}`);
        // }
        // this.network = this.networkRpcMap[network];

        this.keypair = this.loadOrCreateWallet();
        this.connection = new solanaWeb3.Connection(this.network);
        this.initUI();
    }

    loadOrCreateWallet() {
        const privateKey = localStorage.getItem('solana_private_key');
        if (privateKey) {
            return solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)));
        } else {
            const keypair = solanaWeb3.Keypair.generate();
            localStorage.setItem('solana_private_key', JSON.stringify(Array.from(keypair.secretKey)));
            alert('New Payment wallet created successfully!');
            return keypair;
        }
    }

    getWalletBalance = async () =>  {
        try {
            const balance = await this.connection.getBalance(this.keypair.publicKey);
            return balance / solanaWeb3.LAMPORTS_PER_SOL;
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            return 0;
        }
    }


    /* async getWalletBalance(){
        try {
            const balance = await this.connection.getBalance(this.keypair.publicKey);
            return balance / solanaWeb3.LAMPORTS_PER_SOL;
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            return 0;
        }
    } */

    initUI() {
        const container = document.createElement("div");
        container.id = "wallet-info";
        container.style.display = "none";
        container.innerHTML = `
            <div class="wallet-container">
                <h2>Your Wallet</h2>
                <p><strong>Address:</strong> <span id="wallet-address">${this.keypair.publicKey.toBase58()}</span></p>
                <p><strong>Balance:</strong> <span id="wallet-balance">Loading...</span> SOL</p>
                <button id="download-wallet">Download Wallet</button>
            </div>
            <div id="transaction-progress" class="progress-container" style="display:none;">
                <div class="spinner"></div>
                <p>Processing transaction...</p>
            </div>
        `;
        document.body.prepend(container);
        
        document.getElementById("download-wallet").onclick = () => this.downloadWallet();
        this.updateWalletBalance();
    }

    async updateWalletBalance() {
        const balance = await this.getWalletBalance();
        document.getElementById("wallet-balance").textContent = balance;
    }

    downloadWallet() {
        const blob = new Blob([JSON.stringify(Array.from(this.keypair.secretKey))], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "solana_wallet.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    createButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.error("Button ID not found");
            return;
        }
        button.textContent = "Pay with SolPayWay";
        button.onclick = async () => {
            document.getElementById("wallet-info").style.display = "block";
            const balance = await this.getWalletBalance();
            if (balance >= this.amount) {
                this.initiateTransaction();
            } else {
                alert(`Insufficient balance! Your balance: ${balance} SOL`);
            }
        };
    }

    payWithSolPayWay = async () =>  {
        document.getElementById("payment-overlay").style.display = "none";
        document.getElementById("wallet-info").style.display = "block";
        
        const balance = await this.getWalletBalance();
        // await this.getWalletBalance();
        if (balance >= this.amount) {
            this.initiateTransaction();
        } else {
            alert(`Insufficient balance! Your balance: ${balance} SOL`);
        }
    }

/* 
    async payWithPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            alert("Phantom Wallet not detected. Please install it.");
            return;
        }

        try {
            const provider = window.solana;
            const response = await provider.connect();
            console.log("Connected with:", response.publicKey.toString());

            // const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("devnet"));
            const publicKey = response.publicKey;

            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver), // Change to your receiver address
                    lamports: 0.01 * solanaWeb3.LAMPORTS_PER_SOL, // Sending 0.01 SOL
                })
            );

            const { blockhash } = await this.getBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await provider.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

            console.log("Transaction Signature:", signature);
            alert(`Transaction sent! Signature: ${signature}`);

            // Track transaction
            this.transactionSignature = signature;
            this.trackTransaction();

        } catch (error) {
            console.error("Phantom Transaction Failed:", error);
            alert("Transaction failed. See console for details.");
        }
    }

    async payWithSolflare() {
        if (!window.solflare || !window.solflare.isSolflare) {
            alert("Solflare Wallet not detected. Please install it.");
            return;
        }

        try {
            const provider = window.solflare;
            await provider.connect();

            if (!provider.publicKey) {
                throw new Error("Failed to connect to Solflare");
            }

            console.log("Connected with:", provider.publicKey.toString());

            const blockhash = this.getBlockhash();
            console.log("Using blockhash:", blockhash);
        
        
            // Set blockhash and fee payer
            // transaction.recentBlockhash = blockhash;
            // transaction.feePayer = this.keypair.publicKey;

            // const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("devnet"));
            const connection = new solanaWeb3.Connection(this.network);
            const publicKey = provider.publicKey;

            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver), // Change to your receiver address
                    lamports: 0.01 * solanaWeb3.LAMPORTS_PER_SOL, // Sending 0.01 SOL
                })
            );

            // const { blockhash } = await this.getBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await provider.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            console.log("Transaction Signature:", signature);
            alert(`Transaction sent! Signature: ${signature}`);

            // Track transaction
            this.transactionSignature = signature;
            this.trackTransaction();

        } catch (error) {
            console.error("Solflare Transaction Failed:", error);
            alert("Transaction failed. See console for details.");
        }
    }
    
     */

    async payWithPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            alert("Phantom Wallet not detected. Please install it.");
            return;
        }
    
        try {
            const provider = window.solana;
            const response = await provider.connect();
            console.log("Connected with:", response.publicKey.toString());
    
            const publicKey = response.publicKey;
    
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver), // Change to your receiver address
                    lamports: 0.01 * solanaWeb3.LAMPORTS_PER_SOL, // Sending 0.01 SOL
                })
            );
    
            const { blockhash } = await this.connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
    
            const signedTransaction = await provider.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
    
            console.log("Transaction Signature:", signature);
            alert(`Transaction sent! Signature: ${signature}`);
    
            // Track transaction
            this.transactionSignature = signature;
            this.trackTransaction();
    
        } catch (error) {
            console.error("Phantom Transaction Failed:", error);
            alert("Transaction failed. See console for details.");
        } finally {
            document.getElementById("payment-overlay").style.display = "none";
            // document.getElementById("wallet-info").style.display = "block";
        }
    }
    
    async payWithSolflare() {
        if (!window.solflare || !window.solflare.isSolflare) {
            alert("Solflare Wallet not detected. Please install it.");
            return;
        }
    
        try {
            const provider = window.solflare;
            await provider.connect();
    
            if (!provider.publicKey) {
                throw new Error("Failed to connect to Solflare");
            }
    
            console.log("Connected with:", provider.publicKey.toString());
    
            const { blockhash } = await this.connection.getRecentBlockhash();
            console.log("Using blockhash:", blockhash);
    
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: provider.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver), // Change to your receiver address
                    lamports: 0.01 * solanaWeb3.LAMPORTS_PER_SOL, // Sending 0.01 SOL
                })
            );
    
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = provider.publicKey;
    
            const signedTransaction = await provider.signTransaction(transaction);
            const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
    
            console.log("Transaction Signature:", signature);
            alert(`Transaction sent! Signature: ${signature}`);
    
            // Track transaction
            this.transactionSignature = signature;
            this.trackTransaction();
    
        } catch (error) {
            console.error("Solflare Transaction Failed:", error);
            alert("Transaction failed. See console for details.");
        } finally {
            document.getElementById("payment-overlay").style.display = "none";
            // document.getElementById("wallet-info").style.display = "block";
        }
    }

    showPaymentOptions() {
        const self = this;

        const overlay = document.createElement("div");
        overlay.id = "payment-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0, 0, 0, 0.85)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";
    
        const title = document.createElement("h2");
        title.innerText = "Choose Payment Method";
        title.style.color = "#ffffff";
        title.style.marginBottom = "20px";
    
        const buttons = [
            { text: "Pay with SolPayWay", color: "#FF9800", action: async () => self.payWithSolPayWay() },
            { text: "Pay with Solflare", color: "#2196F3", action: async () => self.payWithSolflare() },
            { text: "Pay with Phantom", color: "#9C27B0", action: async () => self.payWithPhantom() },
            { text: "Pay with Card", color: "#4CAF50", action: async () => alert("Card Payment selected") }
        ];
    
        buttons.forEach(({ text, color, action }) => {
            const button = document.createElement("button");
            button.innerText = text;
            button.style.background = color;
            button.style.color = "#fff";
            button.style.border = "none";
            button.style.padding = "15px 20px";
            button.style.margin = "10px";
            button.style.borderRadius = "5px";
            button.style.cursor = "pointer";
            button.style.fontSize = "18px";
            button.style.width = "250px";
            button.onclick = action;
            overlay.appendChild(button);
        });
    
        const closeButton = document.createElement("button");
        closeButton.innerText = "Close";
        closeButton.style.background = "#ff4444";
        closeButton.style.color = "#fff";
        closeButton.style.padding = "10px 20px";
        closeButton.style.marginTop = "20px";
        closeButton.style.border = "none";
        closeButton.style.cursor = "pointer";
        closeButton.style.borderRadius = "5px";
        closeButton.style.fontSize = "16px";
        closeButton.onclick = () => document.body.removeChild(overlay);
    
        overlay.appendChild(title);
        overlay.appendChild(closeButton);
        document.body.appendChild(overlay);
    }
    
    


    async getBlockhash() {
        const response = await fetch(this.network , {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getLatestBlockhash",
                params: [{ commitment: "processed" }],
            }),
        });
    
        const data = await response.json();
        return data.result.value.blockhash;
    }
    
    async initiateTransaction() {

        /* try {
            const provider = window.solana;
            if (!provider) throw new Error("Phantom wallet not found!");
    
            const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");
    
            const fromPubkey = provider.publicKey;
            const toPubkey = new solanaWeb3.PublicKey("TARGET_WALLET_ADDRESS_HERE");
    
            // 🔥 Manually get the blockhash
            const blockhash = await getBlockhash();
            console.log("Using blockhash:", blockhash);

            console.log("Sender Public Key:", this.keypair?.publicKey?.toBase58());
            console.log("Receiver Public Key:", this.receiver);
    
            // 🔥 Create the transaction manually
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: this.keypair.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver),
                    lamports: 0.01 * solanaWeb3.LAMPORTS_PER_SOL,
                })
            );
    
            // 🔥 Set the manually fetched blockhash
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromPubkey;
    
            // Request Phantom to sign the transaction
            const signedTransaction = await provider.signTransaction(transaction);
    
            // Send the signed transaction
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            console.log("Transaction sent! Signature:", signature);
    
            // Confirm transaction
            await connection.confirmTransaction(signature, "confirmed");
            console.log("Transaction confirmed!");
        } catch (error) {
            console.error("Transaction failed:", error);
        } */
        
        try {
            document.getElementById("transaction-progress").style.display = "block";
            console.log("Creating and sending transaction...");
        
            // Connect to Solana
            // const connection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");
            // const connection = new solanaWeb3.Connection("https://spring-quick-surf.solana-devnet.quiknode.pro/016ff48f0f7c3f1520e515c01dca9a83ef528317", "confirmed");
            const connection = new solanaWeb3.Connection(this.network, "confirmed");
        
            // Fetch the latest blockhash
            // const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            // 🔥 Manually get the blockhash
            const blockhash = this.getBlockhash();
            console.log("Using blockhash:", blockhash);
        
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: this.keypair.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver),
                    lamports: this.amount * solanaWeb3.LAMPORTS_PER_SOL,
                })
            );
        
            // Set blockhash and fee payer
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.keypair.publicKey;
        
            // Sign and send the transaction
            const signature = await solanaWeb3.sendAndConfirmTransaction(
                connection,
                transaction,
                [this.keypair] // Make sure this keypair is correct
            );
        
            this.transactionSignature = signature;
            this.trackTransaction();
        } catch (error) {
            console.error("Transaction failed:", error);
            // window.location.href = this.cancelUrl;
        } finally {
            document.getElementById("transaction-progress").style.display = "none";
        }
        
        
        /* try {
            document.getElementById("transaction-progress").style.display = "block";
            console.log("Creating and sending transaction...");
        
            
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: this.keypair.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(this.receiver),
                    lamports: this.amount * solanaWeb3.LAMPORTS_PER_SOL,
                })
            );
            
            const signature = await solanaWeb3.sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.keypair]
            );
            
            this.transactionSignature = signature;
            this.trackTransaction();
        } catch (error) {
            console.error("Transaction failed:", error);
            // window.location.href = this.cancelUrl;
        } finally {
            document.getElementById("transaction-progress").style.display = "none";
        } */
    }

    // SERVER_URL
    // const SERVER_URL = "http://127.0.0.1:5000"; // Change this URL when needed
    // '${SERVER_URL}/verify-payment/'

    loadPaymentForm( SERVER_URL , amount = null, currency = 'USD') {
        // Create the HTML structure
        const paymentFormHTML = `
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .payment-container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .payment-container h2 {
                    margin-bottom: 10px;
                }
                .payment-container button {
                    background-color: #f5a623;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .payment-container button:hover {
                    background-color: #d4881e;
                }
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    justify-content: center;
                    align-items: center;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 300px;
                    text-align: center;
                }
                .modal-content input {
                    width: 90%;
                    margin: 10px 0;
                    padding: 8px;
                }
                .modal-content button {
                    background-color: #28a745;
                    color: white;
                    border: none;
                    padding: 10px;
                    width: 100%;
                    cursor: pointer;
                }
            </style>
            <div class="payment-container">
                <h2>${amount ? `Pay $${amount}` : 'Enter Payment Amount'}</h2>
                ${amount ? '' : '<input type="number" id="amount" placeholder="Enter amount" min="1" required>'}
                <p>Click the button below to pay securely.</p>
                <button id="payButton">Pay Now</button>
            </div>
            <div class="modal" id="userModal">
                <div class="modal-content">
                    <h3>Enter Your Email</h3>
                    <input type="email" id="email" placeholder="Enter your email">
                    <button id="submitDetails">Continue to Payment</button>
                </div>
            </div>
        `;
    
        // Inject the HTML into the body
        document.body.innerHTML = paymentFormHTML;
    
        // Load Flutterwave script dynamically
        const flutterwaveScript = document.createElement('script');
        flutterwaveScript.src = 'https://checkout.flutterwave.com/v3.js';
        document.head.appendChild(flutterwaveScript);
    
        // Add event listeners
        document.getElementById('payButton').addEventListener('click', function () {
            const amountInput = document.getElementById('amount');
            if (amountInput && !amountInput.value) {
                alert('Please enter a valid amount.');
                return;
            }
            document.getElementById('userModal').style.display = 'flex';
        });
    
        document.getElementById('submitDetails').addEventListener('click', function () {
            const email = document.getElementById('email').value;
            // var amount = document.getElementById('amount') ? document.getElementById('amount').value : '${amount}';
            var amount = document.getElementById('amount') ? document.getElementById('amount').value : '${amount}';
    
            if (!email) {
                alert('Email is required.');
                return;
            }
    
            document.getElementById('userModal').style.display = 'none';
    
            FlutterwaveCheckout({
                public_key: 'FLWPUBK_TEST-7909b193be2429cae121b42c7cbcdb4f-X',
                tx_ref: 'tx-' + Date.now(),
                amount: amount,
                currency: currency,
                payment_options: 'card, ussd, banktransfer',
                customer: { email },
                customizations: {
                    title: 'My Website Payment',
                    description: 'Payment for services',
                    logo: 'https://via.placeholder.com/150',
                },
                callback: function (data) {
                    alert('Payment successful! Transaction Reference: ' + data.transaction_id);
                    fetch('${SERVER_URL}' + data.transaction_id, { method: 'GET' })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! Status: ${response.status}`);
                            }
                            return response.json().catch(() => {
                                throw new Error('Invalid JSON response from server');
                            });
                        })
                        .then(result => {
                            alert(result.message || 'Payment verification successful!');
                        })
                        .catch(error => {
                            console.error('Error verifying payment:', error);
                            alert('An error occurred while verifying payment. Please try again.');
                        });
                },
                onclose: function () {
                    alert('Transaction closed. No payment was made.');
                },
            });
        });
    }
    
    // Example usage
    // loadPaymentForm(); // For user-entered amount
    // loadPaymentForm(50); // For fixed amount

    /* trackTransaction() {
        if (!this.transactionSignature) return;
        
        let attempts = 0;
        this.trackingInterval = setInterval(async () => {
            attempts++;
            try {
                const status = await this.connection.getSignatureStatus(this.transactionSignature);
                if (status && status.value && status.value.confirmationStatus === "finalized") {
                    clearInterval(this.trackingInterval);
                    alert("Transaction confirmed!");
                    window.location.href = this.successUrl;
                }
            } catch (error) {
                console.error("Error tracking transaction:", error);
            }

            if (attempts >= 10) {
                clearInterval(this.trackingInterval);
                alert("Transaction tracking timed out.");
                window.location.href = this.cancelUrl;
            }
        }, 3000);
    } */

    trackTransaction() {
        if (!this.transactionSignature) return;
        
        let attempts = 0;
        const progressDiv = document.createElement("div");
        progressDiv.id = "transaction-status";
        progressDiv.innerHTML = `<p>Transaction is being confirmed...</p><p id='confirmations'>Confirmations: 0</p>`;
        document.body.prepend(progressDiv);

        this.trackingInterval = setInterval(async () => {
            attempts++;
            try {
                const status = await this.connection.getSignatureStatus(this.transactionSignature);
                if (status && status.value) {
                    document.getElementById('confirmations').textContent = `Confirmations: ${status.value.confirmations || 0}`;
                    if (status.value.confirmationStatus === "finalized") {
                        clearInterval(this.trackingInterval);
                        alert("Transaction confirmed!");
                        progressDiv.innerHTML = "<p>Transaction finalized successfully!</p>";
                        setTimeout(() => progressDiv.remove(), 5000);
                        window.location.href = this.successUrl;
                    }
                }
            } catch (error) {
                console.error("Error tracking transaction:", error);
            }

            if (attempts >= 10) {
                clearInterval(this.trackingInterval);
                alert("Transaction tracking timed out.");
                progressDiv.innerHTML = "<p>Transaction failed or took too long.</p>";
                setTimeout(() => progressDiv.remove(), 5000);
                window.location.href = this.cancelUrl;
            }
        }, 5000);
    }
}

/* Add basic styling */
const style = document.createElement("style");
style.innerHTML = `
    .wallet-container {
        background: #222;
        color: #fff;
        padding: 20px;
        border-radius: 10px;
        max-width: 400px;
        text-align: center;
        margin: 20px auto;
        box-shadow: 0 4px 8px rgba(255, 255, 255, 0.2);
    }
    .wallet-container h2 {
        margin-bottom: 10px;
    }
    .wallet-container p {
        margin: 5px 0;
    }
    #download-wallet {
        background: #ff9900;
        color: #000;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
    }
    .progress-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 20px;
    }
    .spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid #ff9900;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
