<script setup lang="ts">
import { AppWallet, EmbeddedWallet, NETWORK_ID } from "@hydra-sdk/core";
import { HydraBridge } from "@hydra-sdk/bridge";

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
      await walletStore.fetchAddressUtxos();
    }
  }
});

onMounted(async () => {
  // const bridge = new HydraBridge({
  //   url: useRuntimeConfig().public.wssEndpoint,
  //   // verbose: true,
  // });
  // console.log("Connecting to Hydra Bridge...", bridge);
  // await bridge.connect();
  // const utxoSnapshot = await bridge.querySnapshotUtxo();

  // console.log("Snapshot UTxO from Hydra Bridge:", utxoSnapshot);
});
</script>

<template>
  <div class="bg-[#121212] min-h-svh">
    <slot />
  </div>
</template>

<style lang="scss" scoped></style>
