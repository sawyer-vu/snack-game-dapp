import { type AppWallet, type Account, type UTxOObject } from "@hydra-sdk/core";
import { TxBuilder } from "@hydra-sdk/transaction";

export const useWalletStore = defineStore("wallet", () => {
  const wallet = ref<AppWallet | null>(null);
  const account = ref<Account | null>(null);
  const snapshotUtxo = ref<any>();
  const utxos = ref<UTxOObject[]>([]);

  const setWallet = (appWallet: AppWallet) => {
    wallet.value = appWallet;
  };

  const setAccount = (acc: Account) => {
    account.value = acc;
  };

  const fetchAddressUtxos = async () => {
    if (!wallet.value) return;

    const utxoResult = getUtxos(
      snapshotUtxo.value,
      account.value?.baseAddressBech32!
    );

    console.log("Found UTxO for current address:", utxoResult);

    if (utxoResult.length === 0) {
      buildTx();
    }
  };

  const buildTx = async () => {
    if (!wallet.value || !account.value) return;
    console.log("Building transaction...");
    // Example logic to build a transaction
    const txBuilder = new TxBuilder({
      isHydra: true,
    });

    const utxoParticipant = getUtxos(
      snapshotUtxo.value,
      "addr_test1qrnp9693dzwgyl947v8sm9j7c5dpfcm3j7h2jqpp2vze068m2tj5pxcfzr5zvjemqlmu2kvac6t7ruvc4m9kg9324ntqv0e30n"
    );

    const txOutputs = [
      {
        address: account.value?.baseAddressBech32,
        amount: [
          {
            unit: "lovelace",
            quantity: "1000000",
          },
        ],
      },
    ];

    const txInputs = [
      {
        input: {
          outputIndex: 312312,
          txHash: "",
        },
        output: {
          address: account.value?.baseAddressBech32,
          amount: [
            {
              unit: "lovelace",
              quantity: "1000000",
            },
          ],
        },
      },
    ];

    console.log("UTxOs for building transaction:", utxoParticipant);
  };

  const getUtxos = (snapshotUtxo: any, address: string) => {
    return Object.values(snapshotUtxo).filter(
      (utxo: any) => utxo.address === address
    );
  };

  const reset = () => {
    wallet.value = null;
    account.value = null;
    snapshotUtxo.value = [];
  };

  return {
    wallet,
    account,
    snapshotUtxo,
    setWallet,
    setAccount,
    fetchAddressUtxos,
    reset,
  };
});
