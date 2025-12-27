export const useHeadStore = defineStore("head-store", () => {
  const inlineDatum = ref<any[]>([]);

  return {
    inlineDatum,
  };
});
