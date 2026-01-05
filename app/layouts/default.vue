<script setup lang="ts">
import { AppWallet, EmbeddedWallet, NETWORK_ID } from "@hydra-sdk/core";

const authStore = useAuthStore();
const walletStore = useWalletStore();
const hydraStore = useHydraStore();
const router = useRouter();

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth/login");
  } else {
    const walletInstance = new AppWallet({
      key: {
        type: "root",
        bech32: EmbeddedWallet.privateKeyHexToBech32(
          authStore.wallet.secrets.rootKeyHex
        ),
      },
      networkId: NETWORK_ID.PREVIEW,
    });
    walletStore.setWallet(walletInstance);
    const account = walletInstance!.getAccount(0, 0);
    walletStore.setAccount(account);
    await hydraStore.buildFirstTx();
  }
});
</script>

<template>
  <div class="bg-[#121212] min-h-svh">
    <slot />
  </div>
</template>

<style lang="scss" scoped></style>
