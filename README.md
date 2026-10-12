# ElizaOS AutoSanctions Plugin 🛡️

The official [AutoSanctions](https://autosanctions.com) plugin for ElizaOS. 

This plugin gives your autonomous crypto agents the ability to check the US Treasury OFAC sanctions list before executing trades or transferring funds. 

Because traditional KYC/AML APIs require fiat subscriptions (which breaks agent autonomy), this plugin uses the 402 Tollbooth architecture. The agent pays a 0.05 USDC toll on the Base network to instantly query the database.

## Installation

```bash
npm install eliza-plugin-autosanctions
```

## Usage

Simply add the plugin to your Eliza character or agent configuration. It automatically registers the `VERIFY_ENTITY_SANCTIONS` action.

```typescript
import { autosanctionsPlugin } from "eliza-plugin-autosanctions";

export const myTradingAgent = {
  name: "DeFi-Trader-Bot",
  plugins: [
    autosanctionsPlugin
  ],
  settings: {
    secrets: {
      AGENT_WALLET_KEY: "0x..." // Your agent's Base wallet private key
    }
  }
};
```

## How it Works
1. The agent's wallet sends 0.05 USDC to the master vault on Base.
2. The agent passes the `transaction_hash` and `entity_name` to the API.
3. The API validates the on-chain event (preventing replay attacks).
4. The API queries the OFAC database and returns the result to the agent context.

## License
MIT
