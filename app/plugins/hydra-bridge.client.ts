import { useHydraStore } from "../stores/hydra.store";
import { HydraBridge } from "@hydra-sdk/bridge";

declare module "#app" {
  interface NuxtApp {
    $bridge: HydraBridge | null;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $bridge: HydraBridge | null;
  }
}

const hydraBridge = ref<HydraBridge | null>(null);

export default defineNuxtPlugin(async (nuxtApp) => {
  const initConnectHydraBridge = async () => {
    hydraBridge.value = new HydraBridge({
      url: useRuntimeConfig().public.wssEndpoint,
      verbose: true,
    });

    await hydraBridge.value.connect();
  };

  await initConnectHydraBridge();

  hydraBridge.value?.events.on("onMessage", async (payload) => {
    if (payload.tag === "SnapshotConfirmed") {
      console.log("SnapshotConfirmed received, updating store...", payload);
      await hydraStore.queryInlineDatum();
    }
  });

  // Provide bridge first, then query
  nuxtApp.provide("bridge", hydraBridge.value);

  const hydraStore = useHydraStore();
  await hydraStore.queryInlineDatum();
});
