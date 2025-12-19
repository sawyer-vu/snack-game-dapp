import { ProviderUtils } from "@hydra-sdk/core";

export const getBlockfrostProvider = (
  network: "mainnet" | "preview" | "preprod" = "preprod"
) => {
  const config = useRuntimeConfig().public;

  return new ProviderUtils.BlockfrostProvider({
    apiKey: config.blockfrostApiKey,
    network: network,
  });
};
