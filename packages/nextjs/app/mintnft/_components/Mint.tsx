"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

const ipfsToUrl = (ipfsUri: string) => {
  return ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
};

const tokenURIs = [
  "ipfs://QmSwdtyDNALkn7Pa2g13yQeq49wZgJGNgCyZnXA9SovBRK",
  "ipfs://QmZUgk8A1Tc2WdTdQabk9DMo1XRNgq9P4vYHGVctmyqStj",
  "ipfs://QmaBqamxUUKPXg8BSqkyYnNuUKedu1zv5c2JQM1k22UeTK",
  "ipfs://QmedZpxnrHTSCxtgSGW52Mnhjw7fFn49oHweB4DF6ByraX",
  "ipfs://QmUc9eYruNK1aQM4UYf3ygj4dAAGTWgx3EQQp9UGgfYsky",
  "ipfs://QmfEoND3HcG24KU5DAKppajXKhihb4rwGeGxJXgAFT5bnS",
  "ipfs://QmQctmoLMjj9mhYaKcC4qCFVCcRXSBuX78CG5UsuJGQmAc",
  "ipfs://QmTW25nSb3szVEgaLL8pnd6piLLAWPL9owLDRhxqkc6eMi",
  "ipfs://QmfD7KLUM4Yc5NRTWpJN7QtQ5xN6SmQCcQAL65oEp4Uxnu",
  "ipfs://QmPjyh3zcXoJmeN72V3bawAH9yAxUC8SHuM5GQmxkyLQLL",
  "ipfs://QmXEGTfr5hhEZ5oRaSLrWxPhpjmj9RSBxUW1gjMbdSkTML",
];

const selectedContractStorageKey = "scaffoldEth2.selectedContract";

export function MintNFT() {
  const { address, isConnected } = useAccount();

  const {
    writeContractAsync: writeYourContractAsync,
    isSuccess,
    data: txData,
  } = useScaffoldWriteContract("NFTMarketplace");

  const { data: ownedURIs } = useScaffoldReadContract({
    contractName: "NFTMarketplace",
    functionName: "getOwnedTokenURIs",
    args: [address],
  });

  const contractsData = useAllContracts();
  const contractNames = useMemo(() => Object.keys(contractsData) as string[], [contractsData]);

  const [selectedContract, setSelectedContract] = useLocalStorage<string>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  const [minting, setMinting] = useState<boolean>(false);
  const [mintedTokenId] = useState<number | null>(null);

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [contractNames, selectedContract, setSelectedContract]);

  const getRandomURI = () => {
    const randomIndex = Math.floor(Math.random() * tokenURIs.length);
    return tokenURIs[randomIndex];
  };

  const mintNFT = async () => {
    try {
      setMinting(true);
      const tokenURI = getRandomURI();
      const txHash = await writeYourContractAsync({
        functionName: "mintItem",
        args: [tokenURI],
      });

      console.log("Transaction hash:", txHash);
    } catch (error) {
      console.error("Error minting NFT:", error);
    } finally {
      setMinting(false);
    }
  };

  useEffect(() => {
    if (isSuccess && txData) {
      console.log("Transaction successful:", txData);
    }
  }, [isSuccess, txData]);

  const handleImageError = (event: any) => {
    event.target.src = "/images/placeholder.png";
  };

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      <h1 className="text-xl font-bold mb-4">Mint Your NFT</h1>

      {contractNames.length === 0 ? (
        <p className="text-3xl mt-14">No contracts found!</p>
      ) : (
        <>
          {contractNames.length > 1 && (
            <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
              {contractNames.map(contractName => (
                <button
                  className={`btn btn-secondary btn-sm font-light hover:border-transparent ${
                    contractName === selectedContract
                      ? "bg-base-300 hover:bg-base-300 no-animation"
                      : "bg-base-100 hover:bg-secondary"
                  }`}
                  key={contractName}
                  onClick={() => setSelectedContract(contractName)}
                >
                  {contractName}
                </button>
              ))}
            </div>
          )}

          <div className="w-full max-w-lg flex flex-col gap-4">
            <button onClick={mintNFT} className="btn btn-primary w-full" disabled={minting}>
              {minting ? "Minting..." : "Mint a Random NFT"}
            </button>
          </div>

          {mintedTokenId !== null && <p className="mt-4 text-green-500">Minted NFT Token ID: {mintedTokenId}</p>}

          <div className="mt-8 w-full max-w-lg">
            <h2 className="text-lg font-bold">Your Owned NFTs:</h2>
            {ownedURIs && ownedURIs.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {ownedURIs.map((uri: string, index: number) => (
                  <div key={index} className="p-2 bg-gray-100 rounded-lg">
                    <img
                      src={ipfsToUrl(uri)}
                      alt={`NFT ${index}`}
                      className="w-full h-48 object-cover rounded-md"
                      onError={handleImageError}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>{isConnected ? "No NFTs owned yet." : "Please connect your wallet."}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
