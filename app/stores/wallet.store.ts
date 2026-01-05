import { AppWallet, type Account } from "@hydra-sdk/core";

export const useWalletStore = defineStore("wallet", () => {
  const wallet = ref<AppWallet | null>(null);
  const account = ref<Account | null>(null);

  const setWallet = (appWallet: AppWallet) => {
    wallet.value = appWallet;
  };

  const setAccount = (acc: Account) => {
    account.value = acc;
  };

  const reset = () => {
    wallet.value = null;
    account.value = null;
  };

  return {
    wallet,
    account,
    setWallet,
    setAccount,
    reset,
  };
});
