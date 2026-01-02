import {
  AppWallet,
  DatumUtils,
  EmbeddedWallet,
  NETWORK_ID,
  Resolver,
  type Account,
} from "@hydra-sdk/core";
import { TxBuilder } from "@hydra-sdk/transaction";

export const useWalletStore = defineStore("wallet", () => {
  const wallet = ref<AppWallet | null>(null);
  const account = ref<Account | null>(null);
  const snapshotUtxo = ref<any>();
  const config = useRuntimeConfig().public;
  const authStore = useAuthStore();

  const setWallet = (appWallet: AppWallet) => {
    wallet.value = appWallet;
  };

  const setAccount = (acc: Account) => {
    account.value = acc;
  };

  const reset = () => {
    wallet.value = null;
    account.value = null;
    snapshotUtxo.value = [];
  };

  const buildFirstTx = async () => {
    const { $bridge } = useNuxtApp();
    if (wallet.value && account.value) {
      console.log("Hydra Bridge connected:", $bridge?.connected());
      if (!$bridge?.connected()) {
        console.error("Hydra Bridge is not available");
        return;
      }

      const scriptUtxos = await $bridge.queryAddressUTxO(
        useRuntimeConfig().public.scriptAddress
      );

      //check named UTxO for player
      const scriptUtxoPlayer = scriptUtxos.find((utxo: any) => {
        const datumJson = utxo.output.inlineDatum
          ? JSON.parse(utxo.output.inlineDatum.to_json())
          : null;
        return (
          datumJson && datumJson.fields[0] === `${account.value!.paymentKeyHex}`
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

      if (
        inlineDatumJson &&
        inlineDatumJson.fields[1] &&
        !authStore.wallet.name
      ) {
        console.log(
          "Setting player name from datum:",
          inlineDatumJson.fields[1]
        );
        authStore.wallet.name = inlineDatumJson.fields[1];
      }

      //end logic set player name

      console.log("Script UTxO for player:", inlineDatumJson);

      const snapshotUtxoArray = $bridge?.snapshotUtxoArray();

      console.log("Total snapshot UTxOs:", snapshotUtxoArray);

      const utxos = snapshotUtxoArray.filter(
        (utxo) => utxo.output.address === account.value?.baseAddressBech32
      );

      const utxoParticipant = snapshotUtxoArray.filter(
        (utxo) => utxo.output.address === config.addressReward
      );

      const txOutputs = {
        address: account.value?.baseAddressBech32,
        amount: [
          {
            unit: "lovelace",
            quantity: "10000000",
          },
        ],
      };

      if (utxos.length === 0) {
        const txBuilder = new TxBuilder({
          isHydra: true,
        });

        txBuilder.setInputs(utxoParticipant);
        txBuilder.addOutput(txOutputs);
        txBuilder.setChangeAddress(config.addressReward as string);

        const tx = await txBuilder.complete();
        const cborHex = tx.to_hex();
        const txId = Resolver.resolveTxHash(tx.to_hex());
        console.log(
          EmbeddedWallet.privateKeyHexToBech32(
            "482899b0bde6155e917fb1765ac4ca941169687af4d0f22bb5d92065980aad5640c880562eacb379e3c8cea35f053a69cfbcce5829d3889de6366c18530e2aa5d272bc26e900457b4cad91a0da19d65088f6c96af1a9cc19907aba8befeb2cd4"
          )
        );
        const walletParticipant = new AppWallet({
          key: {
            type: "root",
            bech32: EmbeddedWallet.privateKeyHexToBech32(
              "482899b0bde6155e917fb1765ac4ca941169687af4d0f22bb5d92065980aad5640c880562eacb379e3c8cea35f053a69cfbcce5829d3889de6366c18530e2aa5d272bc26e900457b4cad91a0da19d65088f6c96af1a9cc19907aba8befeb2cd4"
            ),
          },
          networkId: NETWORK_ID.PREVIEW,
        });
        const signedCborHex = await walletParticipant.signTx(cborHex);

        console.log("Submitting tx to Hydra Bridge:", signedCborHex);

        const result = await $bridge.submitTxSync(
          {
            type: "Witnessed Tx ConwayEra",
            description: "Ledger Cddl Format",
            cborHex: signedCborHex,
            txId: txId,
          },
          { timeout: 30000 }
        );

        console.log("Transaction result:", result);
      }
    }
  };

  return {
    wallet,
    account,
    snapshotUtxo,
    setWallet,
    setAccount,
    reset,
    buildFirstTx,
  };
});
