import {
  AppWallet,
  DatumUtils,
  EmbeddedWallet,
  NETWORK_ID,
} from "@hydra-sdk/core";
import { buildTx } from "@/utils/tx-builder";
interface DatumData {
  paymentKeyHex: string;
  name: string;
  score: number;
  numberOfPlays: number;
}
export const useHydraStore = defineStore("hydra-store", () => {
  const inlineDatum = ref<DatumData[]>([]);
  const walletStore = useWalletStore();
  const authStore = useAuthStore();
  const config = useRuntimeConfig().public;

  const buildFirstTx = async () => {
    const { $bridge } = useNuxtApp();

    if (walletStore.wallet && walletStore.account) {
      if (!$bridge?.connected()) {
        console.error("Hydra Bridge is not available");
        return;
      }

      // get script UTxO
      const scriptUtxos = await $bridge.queryAddressUTxO(
        useRuntimeConfig().public.scriptAddress
      );

      //check named UTxO for player
      const scriptUtxoPlayer = scriptUtxos.find((utxo: any) => {
        const datumJson = utxo.output.inlineDatum
          ? JSON.parse(utxo.output.inlineDatum.to_json())
          : null;
        return (
          datumJson &&
          datumJson.fields[0] === `${walletStore.account!.paymentKeyHex}`
        );
      });

      const inlineDatumJson = scriptUtxoPlayer?.output.inlineDatum
        ? JSON.parse(
            scriptUtxoPlayer.output.inlineDatum.to_json(
              DatumUtils.DatumSchema.Basic
            )
          )
        : null;
      console.log("Inline Datum Parse at game over:", inlineDatumJson);

      // set player name on datum
      if (inlineDatumJson && inlineDatumJson.fields[1]) {
        authStore.wallet.name = inlineDatumJson.fields[1];
      }

      //get all UTxO for player
      const snapshotUtxoArray = $bridge?.snapshotUtxoArray();

      // find all UTxO for player
      const utxos = snapshotUtxoArray.filter(
        (utxo) => utxo.output.address === walletStore.account?.baseAddressBech32
      );

      // find all UTxO for participant (reward address)
      const utxoParticipant = snapshotUtxoArray.filter(
        (utxo) => utxo.output.address === config.addressReward
      );

      // reward to player 10 ADA
      const txOutputs = {
        address: walletStore.account?.baseAddressBech32,
        amount: [
          {
            unit: "lovelace",
            quantity: "10000000",
          },
        ],
      };

      // if player has no UTxO, create a new UTxO
      if (utxos.length === 0) {
        const walletParticipant = new AppWallet({
          key: {
            type: "root",
            bech32: EmbeddedWallet.privateKeyHexToBech32(
              config.privateKeyHexReward as string
            ),
          },
          networkId: NETWORK_ID.PREVIEW,
        });

        const tx = await buildTx({
          inputs: utxoParticipant,
          outputs: txOutputs,
          changeAddress: config.addressReward,
          walletSign: walletParticipant,
        });

        console.log("Transaction result:", tx);
      }
    }
  };

  const queryInlineDatum = async () => {
    const { $bridge } = useNuxtApp();
    if (!$bridge?.connected()) {
      console.error("Hydra Bridge is not available");
      return;
    }

    try {
      // Query latest snapshot
      await $bridge.querySnapshotUtxo();
      const arraySnapshotUtxo = await $bridge.snapshotUtxoArray();

      // Map UTxOs to get datum fields
      inlineDatum.value = arraySnapshotUtxo
        .map((utxo) => {
          if (utxo.output.inlineDatum) {
            const inlineDatumJson = utxo.output.inlineDatum.to_json(
              DatumUtils.DatumSchema.Basic
            );
            const inlineDatumFields = JSON.parse(inlineDatumJson).fields;

            return {
              paymentKeyHex: inlineDatumFields[0],
              name: inlineDatumFields[1],
              score: inlineDatumFields[2],
              numberOfPlays: inlineDatumFields[3],
            };
          }
        })
        .filter(Boolean) as DatumData[];

      console.log("Refreshed inline datum:", inlineDatum.value);
    } catch (error) {
      console.error("Error refreshing inline datum:", error);
    }
  };

  return {
    inlineDatum,
    buildFirstTx,
    queryInlineDatum,
  };
});
