<script setup lang="ts">
import { useAuthStore } from "@/stores/auth.store";
import {
  AppWallet,
  NETWORK_ID,
  type Network,
  EmbeddedWallet,
} from "@hydra-sdk/core";

const selectedNetwork = ref<Network>("PREVIEW");
const mnemonic = ref("");
const loading = ref(false);
const error = ref("");
const authStore = useAuthStore();

const connectWallet = async () => {
  if (!mnemonic.value.trim()) {
    error.value = "Please enter a valid mnemonic phrase";
    return;
  }
  loading.value = true;
  authStore.signIn(mnemonic.value, NETWORK_ID[selectedNetwork.value]);
  loading.value = false;
};

const handleEternlConnect = async () => {
  if (window.cardano && window.cardano.eternl) {
    try {
      const walletApi = await window.cardano.eternl.enable();
      console.log("Wallet connected!", walletApi);
      return walletApi;
    } catch (err) {
      console.error("User rejected connection", err);
    }
  } else {
    console.error("Eternl wallet not installed");
  }
};

const handleDisconnect = () => {
  // disconnect();
  error.value = "";
};

const generateMnemonic = () => {
  mnemonic.value = EmbeddedWallet.generateMnemonic(256).join(" ");
};

const formatAddress = (address: string | null) => {
  if (!address) return "";
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
};
</script>

<template>
  <div class="min-h-screen p-6 flex items-center justify-center">
    <div class="w-full max-w-xl">
      <!-- Network Selector -->
      <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-4 mb-4">
        <h3 class="text-white font-medium">Network</h3>
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="selectedNetwork = 'PREVIEW'"
            :class="[
              'p-2 rounded-lg border-2 transition-all',
              selectedNetwork === 'PREVIEW'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500',
            ]"
          >
            <div class="text-white font-medium text-xs">Preview</div>
          </button>
          <button
            @click="selectedNetwork = 'PREPROD'"
            :class="[
              'p-2 rounded-lg border-2 transition-all',
              selectedNetwork === 'PREPROD'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500',
            ]"
          >
            <div class="text-white font-medium text-xs">Preprod</div>
          </button>
          <button
            @click="selectedNetwork = 'MAINNET'"
            :class="[
              'p-2 rounded-lg border-2 transition-all',
              selectedNetwork === 'MAINNET'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500',
            ]"
          >
            <div class="text-white font-medium text-xs">Mainnet</div>
          </button>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Mnemonic Input -->
        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-medium">Connect with Mnemonic</h3>

            <button
              @click="generateMnemonic"
              type="button"
              class="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Generate
            </button>
          </div>
          <!-- Security Warning -->
          <div
            class="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3 mb-4"
          >
            <p class="text-yellow-200 text-xs">
              <span class="font-medium">Security Notice:</span> Never share your
              mnemonic phrase with anyone.
            </p>
          </div>

          <div class="space-y-3">
            <textarea
              v-model="mnemonic"
              rows="3"
              placeholder="Enter your mnemonic phrase..."
              class="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none font-mono text-sm"
            />

            <button
              @click="connectWallet"
              :disabled="loading || !mnemonic.trim()"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {{ loading ? "Connecting..." : "Connect Wallet" }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-red-900/30 border border-red-600 rounded-lg p-3"
        >
          <p class="text-red-300 text-sm">{{ error }}</p>
        </div>

        <!-- Eternl Wallet -->
        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 class="text-white font-medium mb-3">Connect with Eternl</h3>
          <button
            @click="handleEternlConnect"
            :disabled="loading"
            class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition"
          >
            {{ loading ? "Connecting..." : "Connect Eternl" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.text-security-disc {
  -webkit-text-security: disc;
}
</style>
