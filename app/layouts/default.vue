<script setup lang="ts">
import { AppWallet, EmbeddedWallet, NETWORK_ID } from "@hydra-sdk/core";

const authStore = useAuthStore();
const walletStore = useWalletStore();
const router = useRouter();
const { $ws } = useNuxtApp();

const address = computed(() => authStore.wallet?.accounts?.[0]?.address);

onBeforeMount(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth/login");
  } else {
    if (!walletStore.wallet) {
      walletStore.setWallet(
        new AppWallet({
          key: {
            type: "root",
            bech32: EmbeddedWallet.privateKeyHexToBech32(
              authStore.wallet.secrets.rootKeyHex
            ),
          },
          networkId: NETWORK_ID.PREVIEW,
        })
      );
      const account = walletStore.wallet!.getAccount(0, 0);
      walletStore.setAccount(account);
      // await walletStore.fetchAddressUtxos(account.baseAddressBech32);
    }
  }
});
</script>

<template>
  <div class="bg-[#121212] min-h-svh">
    <slot />
  </div>
</template>

<style lang="scss" scoped></style>
