import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { CONTRACT_ADDRESS, USDC_ADDRESS, MONAD_TESTNET } from '../config/constants';
import EmailServiceABI from '../contracts/EmailService.json';
import USDCABI from '../contracts/USDC.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: BrowserProvider | null = null;
  private signer: any = null;

  async connect(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to use this application');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Try to switch to Monad Testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_TESTNET],
        });
      } else {
        throw switchError;
      }
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    return accounts[0];
  }

  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return await this.signer.getAddress();
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }
    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    return formatUnits(balance, 18);
  }

  async getUSDCBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }
    const address = await this.signer.getAddress();
    const usdcContract = new Contract(USDC_ADDRESS!, USDCABI.abi, this.signer);
    const balance = await usdcContract.balanceOf(address);
    return formatUnits(balance, 6); // USDC has 6 decimals
  }

  async purchaseMailbox(duration: number, paymentToken: 'USDC' | 'MON'): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const contract = new Contract(CONTRACT_ADDRESS!, EmailServiceABI.abi, this.signer);

    // Calculate price
    const pricePerHour = paymentToken === 'USDC' ? parseUnits('0.1', 6) : parseUnits('0.001', 18);
    const totalPrice = pricePerHour * BigInt(duration);

    let tx;
    if (paymentToken === 'USDC') {
      // Approve USDC first
      const usdcContract = new Contract(USDC_ADDRESS!, USDCABI.abi, this.signer);
      const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, totalPrice);
      await approveTx.wait();

      // Purchase with USDC
      tx = await contract.purchaseMailbox(duration, USDC_ADDRESS);
    } else {
      // Purchase with MON (native token)
      tx = await contract.purchaseMailbox(duration, '0x0000000000000000000000000000000000000000', {
        value: totalPrice,
      });
    }

    const receipt = await tx.wait();

    // Extract mailboxId from event
    const event = receipt.logs.find((log: any) => {
      try {
        return contract.interface.parseLog(log)?.name === 'EmailPurchased';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsedEvent = contract.interface.parseLog(event);
      return parsedEvent?.args.mailboxId;
    }

    throw new Error('Failed to get mailbox ID from transaction');
  }

  async getBuyerMailboxes(): Promise<string[]> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const contract = new Contract(CONTRACT_ADDRESS!, EmailServiceABI.abi, this.signer);
    const address = await this.signer.getAddress();

    return await contract.getBuyerMailboxes(address);
  }

  async getMailboxPrice(duration: number): Promise<{ usdc: string; mon: string }> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const contract = new Contract(CONTRACT_ADDRESS!, EmailServiceABI.abi, this.provider);
    const price = await contract.getMailboxPrice(duration);

    return {
      usdc: formatUnits(price, 6),
      mon: formatUnits(price, 18),
    };
  }

  isConnected(): boolean {
    return this.signer !== null;
  }
}

export const web3Service = new Web3Service();
