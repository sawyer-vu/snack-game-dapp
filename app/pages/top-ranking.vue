<script setup lang="ts">
interface Player {
  rank: number;
  name: string;
  score: number;
  avatar: string;
}

// Mock data for rankings - Extended for scroll demonstration
const topPlayers = ref<Player[]>([
  { rank: 1, name: "hephy", score: 135, avatar: "H" },
  { rank: 2, name: "Jimmy lee", score: 100, avatar: "J" },
  { rank: 3, name: "Mumen Rider", score: 130, avatar: "M" },
  { rank: 4, name: "Jame", score: 85, avatar: "J" },
  { rank: 5, name: "bora", score: 79, avatar: "B" },
  { rank: 6, name: "Nicolas Cerny", score: 75, avatar: "NC" },
  { rank: 7, name: "sasa", score: 68, avatar: "S" },
  { rank: 8, name: "Jery", score: 62, avatar: "JR" },
  { rank: 9, name: "Alex", score: 58, avatar: "A" },
  { rank: 10, name: "Maria", score: 55, avatar: "M" },
  { rank: 11, name: "Peter", score: 52, avatar: "P" },
  { rank: 12, name: "Sofia", score: 48, avatar: "S" },
  { rank: 13, name: "David", score: 45, avatar: "D" },
  { rank: 14, name: "Emma", score: 42, avatar: "E" },
  { rank: 15, name: "Lucas", score: 40, avatar: "L" },
]);

const top3 = computed(() => topPlayers.value.slice(0, 3));
const restPlayers = computed(() => topPlayers.value.slice(3));

function goBack() {
  navigateTo("/");
}
</script>

<template>
  <div
    class="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-8"
  >
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div
        class="flex items-center justify-between mb-6 sticky top-0 bg-slate-950/80 backdrop-blur-lg z-10 py-4 -mx-4 px-4 rounded-xl border-b border-gray-800/50"
      >
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="w-11 h-11 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 rounded-xl transition-all hover:scale-105 border border-gray-700 shadow-lg"
          >
            <Icon name="mdi:arrow-left" size="24" class="text-white" />
          </button>
          <div>
            <h1 class="text-white text-2xl font-bold flex items-center gap-2">
              <Icon name="mdi:trophy" size="28" class="text-yellow-400" />
              Top Ranking
            </h1>
            <p class="text-gray-400 text-sm">{{ topPlayers.length }} players</p>
          </div>
        </div>
        <span
          class="px-3 py-1.5 bg-green-600/20 text-green-400 text-sm rounded-full border border-green-600/40 flex items-center gap-2 shadow-lg shadow-green-500/20"
        >
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      <!-- Top 3 Players Podium -->
      <div
        class="mb-8 bg-linear-to-b from-gray-800/40 to-transparent rounded-2xl p-6 border border-gray-700/50"
      >
        <div class="grid grid-cols-3 gap-4">
          <!-- 2nd Place -->
          <div class="text-center pt-12">
            <div class="relative mx-auto w-20 h-20 mb-3">
              <div
                class="w-full h-full rounded-full bg-linear-to-br from-gray-300 via-gray-400 to-gray-500 flex items-center justify-center border-4 border-gray-400/50 shadow-xl shadow-gray-400/30"
              >
                <span class="text-gray-900 font-bold text-xl">{{
                  top3[1]?.avatar
                }}</span>
              </div>
              <div
                class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-gray-900 border-3 border-gray-400 flex items-center justify-center shadow-lg"
              >
                <Icon name="mdi:medal" size="18" class="text-gray-300" />
              </div>
            </div>
            <p class="text-white text-sm font-semibold mb-1 truncate px-1">
              {{ top3[1]?.name }}
            </p>
            <p class="text-gray-300 text-lg font-bold">
              {{ top3[1]?.score }}
            </p>
          </div>

          <!-- 1st Place (Taller) -->
          <div class="text-center">
            <div class="relative mx-auto w-28 h-28 mb-3">
              <div
                class="w-full h-full rounded-full bg-linear-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-500/60 shadow-2xl shadow-yellow-500/50 animate-pulse"
              >
                <span class="text-gray-900 font-bold text-2xl">{{
                  top3[0]?.avatar
                }}</span>
              </div>
              <div
                class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gray-900 border-4 border-yellow-500 flex items-center justify-center shadow-xl shadow-yellow-500/40"
              >
                <Icon name="mdi:crown" size="24" class="text-yellow-400" />
              </div>
            </div>
            <p class="text-white text-base font-bold mb-1 truncate px-1">
              {{ top3[0]?.name }}
            </p>
            <p class="text-yellow-400 text-2xl font-bold">
              {{ top3[0]?.score }}
            </p>
          </div>

          <!-- 3rd Place -->
          <div class="text-center pt-12">
            <div class="relative mx-auto w-20 h-20 mb-3">
              <div
                class="w-full h-full rounded-full bg-linear-to-br from-orange-400 via-orange-500 to-orange-700 flex items-center justify-center border-4 border-orange-600/50 shadow-xl shadow-orange-500/30"
              >
                <span class="text-white font-bold text-xl">{{
                  top3[2]?.avatar
                }}</span>
              </div>
              <div
                class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-gray-900 border-3 border-orange-600 flex items-center justify-center shadow-lg"
              >
                <Icon name="mdi:medal" size="18" class="text-orange-400" />
              </div>
            </div>
            <p class="text-white text-sm font-semibold mb-1 truncate px-1">
              {{ top3[2]?.name }}
            </p>
            <p class="text-orange-300 text-lg font-bold">
              {{ top3[2]?.score }}
            </p>
          </div>
        </div>
      </div>

      <!-- Rest of Rankings with Scroll -->
      <div
        class="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2"
      >
        <div
          v-for="player in restPlayers"
          :key="player.rank"
          class="group flex items-center justify-between p-4 bg-gray-800/60 hover:bg-gray-800 rounded-xl border border-gray-700/50 hover:border-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02]"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 text-center">
              <span
                class="text-gray-400 group-hover:text-blue-400 text-lg font-bold transition-colors"
                >{{ player.rank }}</span
              >
            </div>
            <div
              class="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-blue-400/30 shadow-lg group-hover:scale-110 transition-transform"
            >
              <span class="text-white text-sm font-bold">{{
                player.avatar
              }}</span>
            </div>
            <div>
              <span class="text-white text-base font-medium block">{{
                player.name
              }}</span>
              <span class="text-gray-500 text-xs">Rank #{{ player.rank }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="text-white text-xl font-bold group-hover:text-blue-400 transition-colors"
              >{{ player.score }}</span
            >
            <Icon
              name="mdi:chevron-right"
              size="20"
              class="text-gray-600 group-hover:text-blue-400 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Fade Gradient -->
      <div
        class="fixed bottom-0 left-0 right-0 h-24 bg-linear-to-t from-slate-950 to-transparent pointer-events-none"
      ></div>
    </div>
  </div>
</template>
