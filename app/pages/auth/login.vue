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
    <div class="w-full max-w-2xl">
      <h1 class="text-3xl font-bold text-white mb-8 text-center">
        Cardano Wallet
      </h1>

      <!-- Connected State -->
      <div
        v-if="false"
        class="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-white font-medium">Connected</span>
          </div>
          <button
            @click="handleDisconnect"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Disconnect
          </button>
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Provider:</span>
            <span class="text-white font-mono capitalize">
              <!-- {{ walletState.provider }} -->
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Network:</span>
            <span class="text-white font-mono">{{ selectedNetwork }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Address:</span>
            <span class="text-white font-mono text-xs">
              <!-- {{formatAddress(walletState.address)}} -->
            </span>
          </div>
        </div>
      </div>

      <!-- Connection Options -->
      <div v-else class="space-y-6">
        <!-- Network Selector -->
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label class="block text-white font-medium mb-3">
            Select Network
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="(network, key) in NETWORK_ID"
              :key="network"
              @click="selectedNetwork = key"
              :class="[
                'p-4 rounded-lg border-2 transition-all',
                selectedNetwork === key
                  ? 'border-opacity-100 bg-opacity-10'
                  : 'border-gray-600 hover:border-gray-500',
              ]"
            >
              <div class="text-white font-medium">{{ key }}</div>
              <div class="text-gray-400 text-xs mt-1">Network {{ key }}</div>
            </button>
          </div>
        </div>

        <!-- Eternl Wallet -->
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div class="flex items-center gap-3 mb-4">
            <Icon name="mdi:wallet" size="24" class="text-purple-400" />
            <h3 class="text-white font-medium text-lg">Connect with Eternl</h3>
          </div>
          <p class="text-gray-400 text-sm mb-4">
            Connect your Eternl browser extension wallet
          </p>
          <button
            @click="handleEternlConnect"
            :disabled="loading"
            class="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            {{ loading ? "Connecting..." : "Connect Eternl" }}
          </button>
        </div>

        <!-- Mnemonic Input -->
        <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 mb-4">
              <Icon
                name="material-symbols:key"
                size="24"
                class="text-blue-400"
              />
              <h3 class="text-white font-medium text-lg">
                Import with Mnemonic
              </h3>
            </div>

            <button
              @click="generateMnemonic"
              type="button"
              class="text-gray-400 hover:text-white transition"
            >
              Generate
            </button>
          </div>
          <p class="text-gray-400 text-sm mb-4">
            Enter your 12, 15, or 24-word recovery phrase
          </p>

          <div class="space-y-4">
            <div>
              <div class="relative">
                <textarea
                  v-model="mnemonic"
                  rows="3"
                  placeholder="Enter your mnemonic phrase..."
                  class="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none font-mono text-sm"
                />
              </div>
            </div>

            <button
              @click="connectWallet"
              :disabled="loading || !mnemonic.trim()"
              class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
            >
              {{ loading ? "Connecting..." : "Import Wallet" }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-red-900/30 border border-red-600 rounded-lg p-4"
        >
          <div class="flex items-center gap-2">
            <Icon
              name="material-symbols:error"
              size="20"
              class="text-red-400"
            />
            <p class="text-red-300 text-sm">{{ error }}</p>
          </div>
        </div>

        <!-- Security Warning -->
        <div
          class="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4"
        >
          <div class="flex items-start gap-2">
            <Icon
              name="material-symbols:warning"
              size="20"
              class="text-yellow-400 mt-0.5"
            />
            <div class="text-yellow-200 text-xs">
              <p class="font-medium mb-1">Security Notice</p>
              <p>
                Never share your mnemonic phrase with anyone. This demo stores
                keys in browser memory only. For production, use hardware
                wallets or secure key management.
              </p>
            </div>
          </div>
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
