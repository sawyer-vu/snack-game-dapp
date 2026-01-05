<script setup lang="ts">
import { formatRelativeTime } from "~/utils/date-format";

const hydraStore = useHydraStore();
const now = ref(Date.now());

const { pause, resume } = useIntervalFn(() => {
  now.value = Date.now();
}, 5000);

const sortedSnapshots = computed(() => {
  now.value;

  const snapshots = [...hydraStore.inlineDatum];

  return snapshots.sort((a, b) => {
    if (!a.createdAt && b.createdAt) return 1;
    if (a.createdAt && !b.createdAt) return -1;
    if (!a.createdAt && !b.createdAt) return 0;

    // sort by createdAt descending
    return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
  });
});
</script>

<template>
  <div class="hidden lg:block lg:col-span-3">
    <div
      class="sticky p-5 border border-gray-700 bg-gray-800/80 rounded-xl top-4"
    >
      <h3 class="mb-4 text-lg font-semibold text-white">Realtime history</h3>

      <div
        class="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
      >
        <div
          v-for="(tx, i) in sortedSnapshots.slice(0, 20)"
          :key="i"
          class="p-3 transition-colors border border-gray-700 rounded-lg bg-gray-900/60 hover:border-blue-600/50 group space-y-2"
        >
          <div class="flex items-center justify-between">
            <span
              class="flex-1 font-mono text-xs text-gray-300 truncate transition-colors group-hover:text-blue-400"
            >
              {{ tx.paymentKeyHex }}
            </span>
          </div>
          <div class="grid grid-cols-5 gap-2 text-xs">
            <div class="col-span-4">
              <div class="text-gray-500">Player</div>
              <div class="font-medium text-white">{{ tx.name }}</div>
            </div>
            <div class="text-center">
              <div class="text-gray-500">Point</div>
              <div class="font-medium text-white">{{ tx.score }}</div>
            </div>
          </div>
          <div class="font-medium text-xs text-sky-600" v-if="tx.createdAt">
            {{ formatRelativeTime(tx.createdAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
