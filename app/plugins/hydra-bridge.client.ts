import { useHeadStore } from "./../stores/head.store";
import { HydraBridge } from "@hydra-sdk/bridge";
import { DatumUtils } from "@hydra-sdk/core";

const hydraBridge = ref<HydraBridge | null>(null);

export default defineNuxtPlugin(async () => {
  const initConnectHydraBridge = async () => {
    hydraBridge.value = new HydraBridge({
      url: useRuntimeConfig().public.wssEndpoint,
      verbose: true,
    });

    await hydraBridge.value.connect();
    const headStore = useHeadStore();
    await hydraBridge.value.querySnapshotUtxo();
    const arraySnapshotUtxo = await hydraBridge.value.snapshotUtxoArray();

    // Map UTxOs to get datum fields
    headStore.inlineDatum = arraySnapshotUtxo
      .map((utxo) => {
        if (utxo.output.inlineDatum) {
          const inlineDatumJson = utxo.output.inlineDatum.to_json(
            DatumUtils.DatumSchema.Basic
          );
          return JSON.parse(inlineDatumJson).fields;
        }
      })
      .filter(Boolean);

    hydraBridge.value.events.on("onMessage", (payload) => {
      // console.log("Hydra Bridge Message:", payload);
    });
  };

  await initConnectHydraBridge();
  return {
    provide: {
      bridge: hydraBridge.value,
    },
  };
});
