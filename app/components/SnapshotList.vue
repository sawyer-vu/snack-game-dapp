<script setup lang="ts">
const transactions = ref([
  {
    hash: "043525dec502...e64aeb2adc73",
    player: 388,
    avgSize: "335 B",
    total: "89.51K",
  },
  {
    hash: "h893d196e29d...a988dee590ff",
    player: 388,
    avgSize: "335 B",
    total: "89.51K",
  },
  {
    hash: "b09d558bafa1...7e486ed9bc4c",
    player: 388,
    avgSize: "335 B",
    total: "89.51K",
  },
  {
    hash: "fffdf6fd6b25...99b9265497Ba",
    player: 388,
    avgSize: "335 B",
    total: "89.51K",
  },
  {
    hash: "24c1ceb88983...e183db16ab14",
    player: 388,
    avgSize: "335 B",
    total: "89.51K",
  },
]);
</script>

<template>
  <!-- Transaction List -->
  <div class="hidden lg:block lg:col-span-3">
    <div
      class="sticky p-5 border border-gray-700 bg-gray-800/80 rounded-xl top-4"
    >
      <h3 class="mb-4 text-lg font-semibold text-white">Realtime snapshot</h3>

      <div
        class="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
      >
        <div
          v-for="(tx, i) in transactions"
          :key="i"
          class="p-3 transition-colors border border-gray-700 rounded-lg bg-gray-900/60 hover:border-blue-600/50 group"
        >
          <div class="flex items-center justify-between mb-2">
            <span
              class="flex-1 font-mono text-xs text-gray-300 truncate transition-colors group-hover:text-blue-400"
            >
              {{ tx.hash }}
            </span>
            <Icon
              name="mdi:eye"
              size="16"
              class="ml-2 text-gray-500 transition-colors group-hover:text-blue-400"
            />
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div class="text-gray-500">Player</div>
              <div class="font-medium text-white">{{ tx.player }}</div>
            </div>
            <div>
              <div class="text-gray-500">Size</div>
              <div class="font-medium text-white">{{ tx.avgSize }}</div>
            </div>
            <div>
              <div class="text-gray-500">Total</div>
              <div class="font-medium text-white">{{ tx.total }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
