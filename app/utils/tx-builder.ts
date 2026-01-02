import { Resolver } from "@hydra-sdk/core";
import { TxBuilder } from "@hydra-sdk/transaction";

interface BuildTxParams {
  inputs: any;
  outputs: any;
  changeAddress?: any;
  txIn?: any;
  scriptAddress?: any;
  collateral?: any;
  redeemer?: any;
  txOutInlineDatum?: any;
  walletSign?: any;
  script?: any;
}

export const buildTx = async (params: BuildTxParams) => {
  const { $bridge } = useNuxtApp();
  if (!$bridge) {
    console.error("Bridge not found");
    return;
  }
  const walletStore = useWalletStore();
  const txBuilder = new TxBuilder({
    isHydra: true,
    params: {
      minFeeA: 0,
      minFeeB: 0,
    },
  });

  if (params.inputs) {
    txBuilder.setInputs(params.inputs);
  }

  if (params.txIn) {
    txBuilder
      .txIn(
        params.txIn.input.txHash,
        params.txIn.input.outputIndex,
        params.txIn.output.amount, //
        params.txIn.output.address
      )
      .txInInlineDatum(params.txIn.output.inlineDatum!);
  }

  if (params.script) {
    txBuilder.txInScript(params.script);
  }
  if (params.collateral) {
    txBuilder.txInCollateral(
      params.collateral.input.txHash,
      params.collateral.input.outputIndex,
      params.collateral.output.amount,
      params.collateral.output.address
    );
  }
  if (params.outputs) {
    txBuilder.addOutput(params.outputs);
  }
  if (params.redeemer) {
    txBuilder.txInRedeemerValue(params.redeemer);
  }
  if (params.txOutInlineDatum) {
    txBuilder.txOutInlineDatumValue(params.txOutInlineDatum);
  }
  if (params.changeAddress) {
    txBuilder.setChangeAddress(params.changeAddress);
  }

  txBuilder.setFee("0");

  const tx = await txBuilder.complete();
  const cborHex = tx.to_hex();
  let signedCborHex;
  if (params.walletSign) {
    signedCborHex = await params.walletSign(cborHex);
  } else {
    signedCborHex = await walletStore.wallet?.signTx(cborHex);
  }
  const txId = Resolver.resolveTxHash(tx.to_hex());
  if (!signedCborHex) {
    console.error("Signed cbor hex not found");
    return;
  }
  const txResult = await $bridge.submitTxSync(
    {
      type: "Witnessed Tx ConwayEra",
      description: "Ledger Cddl Format",
      cborHex: signedCborHex,
      txId: txId,
    },
    { timeout: 30000 }
  );
  console.log("Transaction result:", txResult);
  return {
    result: txResult.result,
    txId: txResult.txId,
    isValid: txResult.isValid,
    isConfirmed: txResult.isConfirmed,
  };
};
