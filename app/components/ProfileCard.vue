<script setup lang="ts">
const authStore = useAuthStore();

interface Props {
  infoGame: {
    score: number;
    rank: number;
    numberOfPlays: number;
  };
}

const props = defineProps<Props>();

function logout() {
  authStore.signOut();
}
</script>

<template>
  <div class="w-full p-5 border border-gray-700 bg-gray-800/80 rounded-xl">
    <div class="flex items-start justify-between w-full gap-2 mb-4">
      <div class="flex items-center flex-1 min-w-0 gap-3">
        <div
          class="flex items-center justify-center shrink-0 w-12 h-12 text-lg font-bold text-white bg-blue-600 rounded-full"
        >
          {{ authStore.wallet.name.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-white truncate">
            {{ authStore.wallet.name }}
          </h3>
          <p class="font-mono text-xs text-gray-400 truncate">
            {{ useWalletStore().account?.baseAddressBech32 }}
          </p>
        </div>
      </div>
      <button
        @click="logout"
        class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors flex-shrink-0"
      >
        Logout
      </button>
    </div>

    <!-- Stats Buttons -->
    <div class="grid grid-cols-3 gap-2">
      <div
        class="bg-blue-600/20 rounded-lg p-2.5 text-center border border-blue-600/40 flex flex-col  justify-between"
      >
        <div class="mb-1 text-xs font-medium text-blue-400">PLAY COUNTS</div>
        <div class="text-xl font-bold text-white">
          {{ infoGame.numberOfPlays }}
        </div>
      </div>
      <div
        class="bg-blue-600/20 rounded-lg p-2.5 text-center border border-blue-600/40 flex flex-col  justify-between"
      >
        <div class="mb-1 text-xs font-medium text-blue-400">HIGH SCORE</div>
        <div class="text-xl font-bold text-white">
          {{ infoGame.score }}
        </div>
      </div>
      <div
        class="bg-blue-600/20 rounded-lg p-2.5 text-center border border-blue-600/40 flex flex-col  justify-between"
      >
        <div class="mb-1 text-xs font-medium text-blue-400">TOP RANK</div>
        <div class="text-xl font-bold text-white">
          {{ infoGame.rank }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
