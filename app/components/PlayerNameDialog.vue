<script setup lang="ts">
const { isDialogOpen, setPlayerName, closeDialog } = usePlayerName();

const inputName = ref("");
const errorMessage = ref("");

const handleSubmit = () => {
  const trimmedName = inputName.value.trim();

  if (!trimmedName) {
    errorMessage.value = "Please enter your name";
    return;
  }

  if (trimmedName.length < 2) {
    errorMessage.value = "Name must be at least 2 characters";
    return;
  }

  if (trimmedName.length > 20) {
    errorMessage.value = "Name must be less than 20 characters";
    return;
  }

  setPlayerName(trimmedName);
  closeDialog();
  errorMessage.value = "";
  inputName.value = "";
};

const handleInput = () => {
  if (errorMessage.value) {
    errorMessage.value = "";
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isDialogOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @click.self="() => {}"
    >
      <Transition
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-300"
        enter-from-class="opacity-0 scale-95"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isDialogOpen"
          class="bg-gray-900 border-2 border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4"
        >
          <div class="text-center mb-6">
            <div
              class="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4"
            >
              <Icon name="mdi:account" size="32" class="text-blue-400" />
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">
              Welcome to Snake Game!
            </h2>
            <p class="text-gray-400 text-sm">
              Enter your name to start playing
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label
                for="player-name"
                class="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Name
              </label>
              <input
                id="player-name"
                v-model="inputName"
                type="text"
                placeholder="Enter your name"
                maxlength="20"
                autocomplete="off"
                class="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                @input="handleInput"
              />
              <Transition
                enter-active-class="transition-all duration-200"
                leave-active-class="transition-all duration-200"
                enter-from-class="opacity-0 -translate-y-1"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <p
                  v-if="errorMessage"
                  class="mt-2 text-sm text-red-400 flex items-center gap-1"
                >
                  <Icon name="mdi:alert-circle" size="16" />
                  {{ errorMessage }}
                </p>
              </Transition>
            </div>

            <button
              type="submit"
              class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Start Playing
            </button>
          </form>

          <p class="mt-4 text-center text-xs text-gray-500">
            Your name will be displayed on the leaderboard
          </p>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
