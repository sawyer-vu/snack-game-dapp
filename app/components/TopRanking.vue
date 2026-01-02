<script setup lang="ts">
const props = defineProps<{ sortSnapshotDatum: any[] }>();
</script>

<template>
  <div class="p-5 border border-gray-700 bg-gray-800/80 rounded-xl">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Top ranking</h3>
      <span
        class="px-2 py-1 text-xs text-green-400 border rounded-full bg-green-600/20 border-green-600/40"
        >Live</span
      >
    </div>

    <!-- Top 3 -->
    <div class="grid grid-cols-3 gap-2 mb-4">
      <div
        v-for="(datum, index) in sortSnapshotDatum.slice(0, 3)"
        :key="index"
        class="text-center"
      >
        <div class="relative w-16 h-16 mx-auto mb-2">
          <div
            class="flex items-center justify-center w-full h-full border-4 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 border-yellow-500/30"
          >
            <span class="text-xs font-bold text-white">{{
              datum.name?.charAt(0)
            }}</span>
          </div>
          <div
            class="absolute flex items-center justify-center w-8 h-8 -translate-x-1/2 bg-gray-900 border-2 border-yellow-500 rounded-full -bottom-1 left-1/2"
          >
            <span class="text-xs font-bold text-yellow-400">{{
              index + 1
            }}</span>
          </div>
        </div>
        <p class="text-xs font-medium text-white truncate">
          {{ datum.name }}
        </p>
        <p class="text-xs text-gray-400">{{ datum.score }}</p>
      </div>
    </div>

    <!-- Rest of rankings (4-30 with scroll) -->
    <div
      class="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-1"
    >
      <div
        v-for="(datum, index) in sortSnapshotDatum.slice(3, 30)"
        :key="index"
        class="flex items-center justify-between p-2 transition-colors border border-gray-700 rounded-lg bg-gray-900/60 hover:border-gray-600"
      >
        <div class="flex items-center gap-3">
          <span class="w-6 text-sm font-medium text-gray-500">{{
            index + 4
          }}</span>
          <div
            class="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full"
          >
            <span class="text-xs font-bold text-white">{{
              datum.name?.charAt(0)
            }}</span>
          </div>
          <span class="text-sm text-white">{{ datum.name }}</span>
        </div>
        <span class="font-semibold text-white">{{ datum.score }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
