class SolPayWay {
    constructor({ amount, receiver, successUrl, cancelUrl, startTime }) {
        
        this.amount = amount;
        this.receiver = receiver;
        this.successUrl = successUrl;
        this.cancelUrl = cancelUrl;
        this.startTime = startTime || Date.now();
        this.transactionSignature = null;
        this.trackingInterval = null;
        // this.network = "http://127.0.0.1:8899";
        // this.network = "https://api.devnet.solana.com";
        this.network = "https://spring-quick-surf.solana-devnet.quiknode.pro/016ff48f0f7c3f1520e515c01dca9a83ef528317";
        // this.network = "http://127.0.0.1:3001/proxy";

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
            alert('New wallet created successfully!');
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

            const { blockhash } = await this.getBlockhash();
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
