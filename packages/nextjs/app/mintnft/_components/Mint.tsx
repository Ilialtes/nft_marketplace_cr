"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

const selectedContractStorageKey = "scaffoldEth2.selectedContract";

export function MintNFT() {
  const {
    writeContractAsync: writeYourContractAsync,
    isSuccess,
    data: txData,
  } = useScaffoldWriteContract("NFTMarketplace");

  const contractsData = useAllContracts();
  const contractNames = useMemo(() => Object.keys(contractsData) as string[], [contractsData]);

  const [selectedContract, setSelectedContract] = useLocalStorage<string>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  const [recipient, setRecipient] = useState<string>("");
  const [tokenURI, setTokenURI] = useState<string>("");
  const [mintedTokenId] = useState<number | null>(null);

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [contractNames, selectedContract, setSelectedContract]);

  const mintNFT = async () => {
    try {
      if (!recipient || !tokenURI) {
        alert("Please enter recipient address and token URI.");
        return;
      }
      const txHash = await writeYourContractAsync({
        functionName: "mintItem",
        args: [recipient, tokenURI],
      });

      console.log("Transaction hash:", txHash);
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };

  useEffect(() => {
    if (isSuccess && txData) {
      console.log("Transaction successful:", txData);
      // Extract tokenId from the transaction receipt or logs (you might need to parse events here)
      console.log(txData);
      /*  const tokenId = txData?.logs?.[0]?.args?.tokenId; // Adjust if needed
      if (tokenId) {
        setMintedTokenId(parseInt(tokenId));
      } */
    }
  }, [isSuccess, txData]);

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

          {/* Form to enter minting details */}
          <div className="w-full max-w-lg flex flex-col gap-4">
            <input
              type="text"
              placeholder="Recipient Address"
              className="input input-bordered w-full"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            />
            <input
              type="text"
              placeholder="Token URI"
              className="input input-bordered w-full"
              value={tokenURI}
              onChange={e => setTokenURI(e.target.value)}
            />
            <button onClick={mintNFT} className="btn btn-primary w-full" disabled={false}>
              {"Minting..."}
            </button>
          </div>
          {mintedTokenId !== null && <p className="mt-4 text-green-500">Minted NFT Token ID: {mintedTokenId}</p>}
        </>
      )}
    </div>
  );
}
