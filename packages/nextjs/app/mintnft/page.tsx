import { MintNFT } from "./_components/Mint";
import type { NextPage } from "next";

const Mint: NextPage = () => {
  return (
    <>
      <MintNFT />
      <footer className="w-full py-4 mt-10 bg-gray-800 text-white text-center">
        <p>&copy; {new Date().getFullYear()} Scaffold-ETH. All rights reserved.</p>
        <p>Built with 💻 and ☕ by the Scaffold-ETH community.</p>
      </footer>
    </>
  );
};

export default Mint;
