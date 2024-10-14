## NFT Marketplace

https://nextjs-sigma-flame-32.vercel.app/mintnft


### Contrato Verificado
https://sepolia.etherscan.io/address/0x5B215a8358BeF67cF7ac4DE8BeB21599bB0b096E

### Participantes:
- https://github.com/Ilialtes - Josue Perez Valverde
- https://github.com/shuncko - Alfredo Li Avila
- https://github.com/jsandinoDev - Josue Sandino Jaen




![376085850-fc720470-f3f4-4115-bda9-4d7d78e61b5a](https://github.com/user-attachments/assets/8fb4d750-68a2-49d8-94ea-47a7690a7ad7)

------------------------------------------------------------------------

⚙️ Construido usando Scaffold-ETH 2 (NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript).

## Requerimientos

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Ejecucion del proyecto

1. Instale las dependencias del proyecto:

```
cd nft_marketplace_cr
yarn install
```

2. Ejecute una red local en una terminal:

```
yarn chain
```

Puede configurar la red deseada en `packages/hardhat/hardhat.config.ts`.

3. En una segunda terminal puede deployar el contrato:

```
yarn deploy
```

4. En una tercera terminal inicie la app de Next:

```
yarn start
```

## Ejecucion de pruebas de unidad

1. Ejecute lo siguiente en una terminal en el directorio del proyecto:

```
npm run test 
```
