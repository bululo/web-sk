'use client';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  useAccount,
  useBalance,
  useContractRead,
  useContract,
  useContractWrite,
  useExplorer,
  useWaitForTransaction,
} from "@starknet-react/core";
import contractAbiERC20 from "../abis/abi_ER20.json";
import { useState, useMemo } from 'react';
import { useEffect } from 'react';

const WalletBar = dynamic(() => import('../components/WalletBar'), { ssr: false })
const Page: React.FC = () => {
  // Step 2 --> Read your balance -- Start
  const { address: userAddress } = useAccount();
  const { isLoading: balanceIsLoading, isError: balanceIsError, error: balanceError, data: balanceData } = useBalance({
    address: userAddress,
    watch: false
  });

  // Step 3 --> Read from a contract -- Start
  // Sepolia
  const contractAddress = "0x03b2fea05c3d9e73305c47fd2b66c0090f2af06b147c30ffa05490f7a001b5b4";
  const ac2 = "0x029a0ce01cb77bf9fd5cb3537e2753bbc4a9bbc1eda573294943bc2af5ff7b61";
  // Get Total Supply
  const { data: readTotalSupply, refetch: supplyRefetch, isError: supplyIsError, isLoading: supplyIsLoading, error: supplyError } = useContractRead({
    functionName: "total_supply",
    args: [],
    abi: contractAbiERC20,
    address: contractAddress,
    watch: false,
  });
  // Get Account Balance
  const { data: readData, refetch: dataRefetch, isError: readIsError, isLoading: readIsLoading, error: readError } = useContractRead({
    functionName: "balance_of",
    args: [userAddress ? userAddress : "0x0"],
    abi: contractAbiERC20,
    address: contractAddress,
    watch: false,
  });

  // Step 4 --> Write to a contract -- Start
  const [amount, setAmount] = useState(0);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted with amount ", amount);
    // TO DO: Implement Starknet logic here
    writeAsync();
  };
  const { contract } = useContract({
    abi: contractAbiERC20,
    address: contractAddress,
  });
  const calls = useMemo(() => {
    if (!userAddress || !contract) return [];
    return contract.populateTransaction["mint"]!(userAddress, {
      low: (amount ? amount : 0),
      high: 0
    });
  }, [contract, userAddress, amount]);
  const {
    writeAsync,
    data: writeData,
    isPending: writeIsPending,
  } = useContractWrite({
    calls,
  });
  const explorer = useExplorer();
  const { isLoading: waitIsLoading, isError: waitIsError, error: waitError, data: waitData } = useWaitForTransaction({ hash: writeData?.transaction_hash, watch: true })
  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex items-center space-x-2">
      <div className="animate-spin">
        <svg className="h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
  const buttonContent = () => {
    if (writeIsPending) {
      return <LoadingState message="Send..." />;
    }

    if (waitIsLoading) {
      return <LoadingState message="Waiting for confirmation..." />;
    }

    if (waitData && waitData.status === "REJECTED") {
      return <LoadingState message="Transaction rejected..." />;
    }

    if (waitData) {
      return "Transaction confirmed";
    }

    return "Send";
  };
  // Step 4 --> Write to a contract -- End

  // Step 5 --> Transfer -- Start
  const [amountTransfer, setAmountTransfer] = useState(0);
  const [recipient, setRecipient] = useState("");

  const handleSubmitTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted with amount ", amountTransfer, " to recipient ", recipient);
    // TO DO: Implement Starknet logic here
    // transfer (recipient, amount) -> bool
    transferAsync();
  };
  const transferCalls = useMemo(() => {
    if (!userAddress || !contract || !recipient) return [];
    return [
      {
        contractAddress: contract.address,
        entrypoint: "transfer",
        calldata: [
          recipient,
          {
            low: amountTransfer,
            high: 0
          }
        ]
      }
    ];
  }, [contract, userAddress, recipient, amountTransfer]);

  const {
    writeAsync: transferAsync,
    data: transferData,
    isPending: transferIsPending,
  } = useContractWrite({
    calls: transferCalls,
  });
  const { isLoading: transferWaitIsLoading, isError: transferWaitIsError, error: transferWaitError, data: transferWaitData } = useWaitForTransaction({ hash: transferData?.transaction_hash, watch: true })

  const buttonContentTransfer = () => {
    if (transferIsPending) {
      return <LoadingState message="Transfer..." />;
    }

    if (transferWaitIsLoading) {
      return <LoadingState message="Waiting for confirmation..." />;
    }

    if (transferWaitData && transferWaitData.status === "REJECTED") {
      return <LoadingState message="Transfer rejected..." />;
    }

    if (transferWaitData) {
      return "Transfer confirmed";
    }

    return "Transfer";
  };
  // Step 5 --> Transfer -- End

  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <Head>
        <title>Frontend Workshop</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=VT323&display=swap" />
      </Head>
      <div className="flex flex-row mb-4">
        <WalletBar />
      </div>

      {/* Read your balance */}
      {!balanceIsLoading && !balanceIsError && (
        <div
          className={`p-4 w-full max-w-md m-4 border border`} style={{ borderColor: 'rgb(0, 255, 0)' }}
        >
          <h3 className="text-2xl font-bold mb-2">account information</h3>
          <p>{"full address: " + userAddress}</p>
          <p>balance: {Number(balanceData?.formatted).toFixed(4)} {balanceData?.symbol}</p>
          <p>balance: {readData?.toString()} BCS</p>
          <div className="flex justify-center pt-4">
          <button
            onClick={() => dataRefetch()}
            className={`border border-black font-regular py-2 px-4 bg-black hover:bg-green-900`}
          >
            Refresh
          </button>
        </div>
          
        </div>
      )}

      {/* Read contract */}
      <div
        className={`p-4 w-full max-w-md m-4 border border`} style={{ borderColor: 'rgb(0, 255, 0)' }}
      >
        <h3 className="text-2xl font-bold mb-2">read contract</h3>

        <p>total supply: {readTotalSupply?.toString()}</p>
        <div className="flex justify-center pt-4">
          <button
            onClick={() => supplyRefetch()}
            className={`border border-black font-regular py-2 px-4 bg-black hover:bg-green-900`}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Write to contract */}
      <form onSubmit={handleSubmit} className="p-4 w-full max-w-md m-4 border" style={{ borderColor: 'rgb(0, 255, 0)' }}>
        <h3 className="text-2xl font-bold mb-2">mint</h3>
        <label
          htmlFor="amount"
          className=""
        >
          amount:
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.valueAsNumber)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-red-300 black-border-p bg-black"
        />
        {writeData?.transaction_hash && (
          <a
            href={explorer.transaction(writeData?.transaction_hash)}
            target="_blank"
            className="hover:text-green-700 underline"
            rel="noreferrer">Check TX on {explorer.name}</a>
        )}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className={`border border-black font-regular py-2 px-4 ${userAddress ? "bg-black hover:bg-green-900" : "bg-red-900"} `}
            disabled={!userAddress}
          >
            {buttonContent()}
          </button>
        </div>
      </form>
      {/* Step 4 --> Write to a contract -- End */}
      {/* Step 5 --> Transfer -- Start */}
      <form onSubmit={handleSubmitTransfer} className="p-4 w-full max-w-md m-4 border" style={{ borderColor: 'rgb(0, 255, 0)' }}>
        <h3 className="text-2xl font-bold mb-2">transfer</h3>
        <label htmlFor="recipient" className="">recipient:</label>
        <input
          type="text"
          id="recipient"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-red-300 black-border-p bg-black"
        />
        <label htmlFor="amountTransfer" className="">amount:</label>
        <input
          type="number"
          id="amountTransfer"
          value={amountTransfer}
          onChange={(event) => setAmountTransfer(event.target.valueAsNumber)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-red-300 black-border-p bg-black"
        />
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className={`border border-black font-regular py-2 px-4 ${userAddress ? "bg-black hover:bg-green-900" : "bg-red-900"} `}
            disabled={!userAddress}
          >
            {buttonContentTransfer()}
          </button>
        </div>
      </form>
      {/* Step 5 --> Transfer -- End */}

      <footer>
      <p>
        <a href="https://github.com/bululo" target="_blank" rel="noopener noreferrer" className="hover:underline">
          github/bululo
        </a>
      </p>
    </footer>
    </div>
  );
};

export default Page;