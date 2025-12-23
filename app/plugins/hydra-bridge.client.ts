import { HydraBridge } from "@hydra-sdk/bridge";

const hydraBridge = ref<HydraBridge | null>(null);

export default defineNuxtPlugin(async () => {
  const initConnectHydraBridge = async () => {
    hydraBridge.value = new HydraBridge({
      url: useRuntimeConfig().public.wssEndpoint,
      verbose: true,
    });
    
    await hydraBridge.value.connect();
    await hydraBridge.value.querySnapshotUtxo();
    console.log(
      "Hydra Bridge connected:",
      hydraBridge.value,
      hydraBridge.value.connected()
    );
  };

  await initConnectHydraBridge();
  return {
    provide: {
      bridge: hydraBridge.value,
    },
  };
});
