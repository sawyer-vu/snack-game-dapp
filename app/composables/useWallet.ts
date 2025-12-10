import { AppWallet, NETWORK_ID } from "@hydra-sdk/core";

export type WalletConfig = {
  mnemonic: string;
  network: (typeof NETWORK_ID)[keyof typeof NETWORK_ID];
};

export const useWalletConfig = () => {
  return useState<WalletConfig>("walletConfig", () => ({
    mnemonic: "",
    network: NETWORK_ID.PREPROD,
  }));
};

export const initWallet = (
  mnemonic: string,
  network: (typeof NETWORK_ID)[keyof typeof NETWORK_ID]
) => {
  const walletConfig = useWalletConfig();
  walletConfig.value = {
    mnemonic,
    network,
  };

  const wallet = new AppWallet({
    networkId: network,
    key: {
      type: "mnemonic",
      words: mnemonic.trim().split(" "),
    },
  });

  return wallet;
};
