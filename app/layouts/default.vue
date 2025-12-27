<script setup lang="ts">
import {
  AppWallet,
  EmbeddedWallet,
  NETWORK_ID,
  Resolver,
} from "@hydra-sdk/core";
import { TxBuilder } from "@hydra-sdk/transaction";

const authStore = useAuthStore();
const walletStore = useWalletStore();
const router = useRouter();
const { $bridge } = useNuxtApp();

const address = computed(() => authStore.wallet?.accounts?.[0]?.address);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/auth/login");
  } else {
    // if (!walletStore.wallet) {
    //   const wallet = new AppWallet({
    //     key: {
    //       type: "root",
    //       bech32: EmbeddedWallet.privateKeyHexToBech32(
    //         authStore.wallet.secrets.rootKeyHex
    //       ),
    //     },
    //     networkId: NETWORK_ID.PREVIEW,
    //   });
    //   walletStore.setWallet(wallet);
    //   const account = walletStore.wallet!.getAccount(0, 0);
    //   walletStore.setAccount(account);

    //   if(!$bridge?.connected()) {
    //     console.error("Hydra Bridge is not available");
    //     return;
    //   }

    //   const snapshotUtxoArray =  $bridge?.snapshotUtxoArray();

    //   console.log("Total snapshot UTxOs:", snapshotUtxoArray);

    //   const utxos = snapshotUtxoArray.filter(
    //     (utxo) => utxo.output.address === account.baseAddressBech32
    //   );

    //   const utxoParticipant = snapshotUtxoArray.filter(
    //     (utxo) =>
    //       utxo.output.address ===
    //       "addr_test1qpa0x5artsphmepgda29cz6pw23cx2e9l33d2k8hawr8wd2aqznlwwyz6r78qj3l9tm29cc8pnk3vv82crtrg7surqaqqu5n36"
    //   );

    //   const txOutputs = {
    //     address: account?.baseAddressBech32,
    //     amount: [
    //       {
    //         unit: "lovelace",
    //         quantity: "10000000",
    //       },
    //     ],
    //   };

    //   if (utxos.length === 0) {
    //     const txBuilder = new TxBuilder({
    //       isHydra: true,
    //     });

    //     txBuilder.setInputs(utxoParticipant);
    //     txBuilder.addOutput(txOutputs);
    //     txBuilder.setChangeAddress(
    //       "addr_test1qpa0x5artsphmepgda29cz6pw23cx2e9l33d2k8hawr8wd2aqznlwwyz6r78qj3l9tm29cc8pnk3vv82crtrg7surqaqqu5n36"
    //     );

    //     const tx = await txBuilder.complete();
    //     const cborHex = tx.to_hex();
    //     const txId = Resolver.resolveTxHash(tx.to_hex());

    //     const walletParticipant = new AppWallet({
    //       key: {
    //         type: "root",
    //         bech32: EmbeddedWallet.privateKeyHexToBech32(
    //           "482899b0bde6155e917fb1765ac4ca941169687af4d0f22bb5d92065980aad5640c880562eacb379e3c8cea35f053a69cfbcce5829d3889de6366c18530e2aa5d272bc26e900457b4cad91a0da19d65088f6c96af1a9cc19907aba8befeb2cd4"
    //         ),
    //       },
    //       networkId: NETWORK_ID.PREVIEW,
    //     });
    //     const signedCborHex = await walletParticipant.signTx(cborHex);

    //     console.log("Submitting tx to Hydra Bridge:", signedCborHex);

    //     const result = await $bridge.submitTxSync(
    //       {
    //         type: "Witnessed Tx ConwayEra",
    //         description: "Ledger Cddl Format",
    //         cborHex: signedCborHex,
    //         txId: txId,
    //       },
    //       { timeout: 30000 }
    //     );

    //     console.log("Transaction result:", result);
    //   }
    // }

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
    await walletStore.buildFirstTx();
  }
});
</script>

<template>
  <div class="bg-[#121212] min-h-svh">
    <slot />
    <PlayerNameDialog />
  </div>
</template>

<style lang="scss" scoped></style>
