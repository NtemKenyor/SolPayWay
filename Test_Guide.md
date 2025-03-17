# Testing Guide for SolPayWay

## Overview
SolPayWay simplifies testing by allowing users to switch between different networks using URL parameters. The default network is **Mainnet**, but users can switch to **Testnet (Devnet)** or even a **local server** for testing purposes. Additionally, SolPayWay supports the **Sonic SVM**, with plans to load more SVMs in the future.

---

## Testing Different Networks

### 1. **Mainnet (Default)**
By default, the project loads on the **Mainnet**.

- **Localhost:**  
  ```
  http://localhost/solpayway/
  ```
- **Live Server:**  
  ```
  https://roynek.com/solpayway/
  ```

### 2. **Testnet (Devnet)**
To test on the **Testnet**, add the `network=devnet` parameter to the URL.

- **Localhost:**  
  ```
  http://localhost/solpayway/?network=devnet
  ```
- **Live Server:**  
  ```
  https://roynek.com/solpayway/?network=devnet
  ```

### 3. **Local Server with Testnet**
For testing on a **local server** while connected to the **Testnet**, use the `server=local` parameter.

- **Localhost:**  
  ```
  http://localhost/solpayway/?network=devnet&server=local
  ```

---

## How to Test
1. **Ensure you have a wallet connected** (or create one using the in-built wallet generator).
2. **Check the UI behavior and functionalities**, such as:
   - Wallet creation and loading
   - Balance retrieval
   - Transaction execution
3. **Switch between networks using the appropriate URLs** to verify that data loads correctly for each environment.
4. **Test Edge Cases**:
   - Try refreshing after switching networks
   - Test on different browsers and devices
   - Simulate slow network conditions

---

## Additional Notes
- If you encounter errors, check the console (`F12` → Console Tab) for logs.
- The network parameter must be correctly formatted (`devnet`, `mainnet`).
- The local server must be properly set up to serve the files.

---

## Resources for Testing
- Get **Testnet SOL** from the Sonic SVM Faucet: [Sonic SVM Faucet](https://faucet.sonic.game/#/)
- Get **test card details** for transactions:
  - [Flutterwave Test Cards](https://developer.flutterwave.com/v2.0/docs/test-cards)
  - [Stripe Test Cards](https://docs.stripe.com/testing) (Use future expiration dates)

For further debugging, reach out to the project maintainers.

Happy Testing! 🚀

