# Pace deployment

1. In Remix create `Pace.sol` and paste `contracts/Pace.sol`.
2. Compile with Solidity `0.8.24`, optimizer enabled with 200 runs.
3. Choose Injected Provider, switch to Base Mainnet (`8453`), and deploy with no arguments.
4. Put the deployed address in `deployedAddress` inside `src/config/contract.ts`.
5. Add the Base App meta tag inside `<head>` in `index.html`.
6. Add the Builder Code to `BUILDER_CODE` in `src/config/wagmi.ts`.

Netlify: build `npm run build`, publish `dist`, Node `20`.
