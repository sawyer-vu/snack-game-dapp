import {
  type AppWallet,
  DEFAULT_PROTOCOL_PARAMETERS,
  type Account,
  type UTxO,
  type UTxOObject,
} from "@hydra-sdk/core";

export const useWalletStore = defineStore("wallet", () => {
  const wallet = ref<AppWallet | null>(null);
  const account = ref<Account | null>(null);
  const utxos = ref<UTxOObject[]>([]);
  const { $ws } = useNuxtApp();

  const setWallet = (appWallet: AppWallet) => {
    wallet.value = appWallet;
  };

  const setAccount = (acc: Account) => {
    account.value = acc;
  };

  const fetchAddressUtxos = async (address: string) => {
    if (!wallet.value) return;

    const requestId = Date.now();

    // Đăng ký handler trước khi send
    const unsubscribe = $ws.on("message", (data) => {
      // Kiểm tra đúng response cho request này
      if (data.id === requestId) {
        console.log("UTXO response:", data);

        if (data.result) {
          // Xử lý kết quả
          const utxos = data.result;
          console.log("UTXOs:", utxos);
        }

        if (data.error) {
          console.error("Error:", data.error);
        }

        // Hủy đăng ký sau khi nhận được response
        unsubscribe();
      }
    });

    // Gửi request
    await $ws.send(
      "message",
      {
        jsonrpc: "2.0",
        method: "queryLedgerState/utxo",
        params: {
          addresses: [address],
        },
        id: requestId,
      },
      { waitForConnection: true }
    );
  };

  const reset = () => {
    wallet.value = null;
    account.value = null;
    utxos.value = [];
  };

  return {
    wallet,
    account,
    utxos,
    setWallet,
    setAccount,
    fetchAddressUtxos,
    reset,
  };
});
