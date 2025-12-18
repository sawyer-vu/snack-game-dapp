import { AppWallet, EmbeddedWallet, NETWORK_ID } from "@hydra-sdk/core";

type WalletRepository = {
  secrets: {
    /**
     * Raw hex string of the root key
     */
    rootKeyHex: string;
    /**
     * password
     */
    secretKey: string;
  };
  accounts: {
    name: string;
    address: string;
    /**
     * Derivation path used to generate the account
     * m/1852'/1815'/accountIndex'/0/keyIndex
     * @example
     * ['1852H', '1815H', '0H', '0', '0']
     */
    derivationPath: string[];
  }[];
};

export const useAuthStore = defineStore("auth", () => {
  const wallet = useLocalStorage<WalletRepository>(
    "wallet",
    {
      secrets: {
        rootKeyHex: "",
        secretKey: "",
      },
      accounts: [],
    },
    {
      flush: "sync",
      serializer: {
        read: (v: string) => JSON.parse(v) as WalletRepository,
        write: (v: WalletRepository) => JSON.stringify(v),
      },
    }
  );

  const isAuthenticated = computed(() => !!wallet.value.secrets.rootKeyHex);

  const signIn = (
    mnemonic: string,
    network: (typeof NETWORK_ID)[keyof typeof NETWORK_ID]
  ) => {
    const rootKeyHex = EmbeddedWallet.mnemonicToPrivateKeyHex(
      mnemonic.trim().split(" "),
      ""
    );

    console.log(
      "Root Key Hex:",
      EmbeddedWallet.privateKeyHexToBech32(rootKeyHex)
    );

    const walletInstance = new AppWallet({
      networkId: network,
      key: {
        type: "root",
        bech32: EmbeddedWallet.privateKeyHexToBech32(rootKeyHex),
      },
    });

    const account = walletInstance.getAccount(0, 0);
    console.log("Account Base Address:", account.baseAddressBech32);

    wallet.value = {
      secrets: {
        rootKeyHex,
        secretKey: "",
      },
      accounts: [
        {
          name: "Main",
          address: account.baseAddressBech32,
          derivationPath: ["1852H", "1815H", "0H", "0", "0"],
        },
      ],
    };

    navigateTo("/");
  };

  function signOut() {
    wallet.value.secrets.rootKeyHex = "";
    wallet.value.secrets.secretKey = "";
    wallet.value.accounts = [];
  }

  return {
    wallet,
    isAuthenticated,
    signIn,
  };
});
