<script setup lang="ts">
import { useAuthStore } from "@/stores/auth.store";
import { TxBuilder } from "@hydra-sdk/transaction";
import { CardanoWASM } from "@hydra-sdk/cardano-wasm";
import { DatumUtils, ParserUtils, Resolver } from "@hydra-sdk/core";

const walletStore = useWalletStore();
const { $bridge } = useNuxtApp();
const headStore = useHeadStore();
const playerStore = usePlayerName();
const playerName = useState<string>("playerName");
const infoGamePlayer = reactive<{
  score: number;
  rank: number;
  numberOfPlays: number;
}>({
  score: 0,
  rank: 0,
  numberOfPlays: 0,
});

const sortSnapshotDatum = computed(() => {
  const ownerMap = new Map();
  headStore.inlineDatum.forEach((fields) => {

    // if(fields[0] === walletStore.account?.paymentKeyHex) {
    //   console.log("Found player datum fields:", fields);
    //   infoGamePlayer.numberOfPlays = infoGamePlayer.numberOfPlays + 1
    // }

    const owner = fields[0]; // owner address/hash
    const score = fields[2]; // score value

    const existingFields = ownerMap.get(owner);

    // If owner doesn't exist or current score is higher, update
    if (!existingFields || score > existingFields[2]) {
      ownerMap.set(owner, fields);
    }
  });

  const result = Array.from(ownerMap.values());

  const playerFields = result.find(
    (fields) => fields[0] === walletStore.account?.paymentKeyHex
  );

  if (playerFields) {
    infoGamePlayer.score = playerFields[2];
    infoGamePlayer.rank =
      result.filter((fields) => fields[2] > playerFields[2]).length + 1;
  } else {
    infoGamePlayer.score = 0;
    infoGamePlayer.rank = result.length + 1;
  }

  return result.sort((a, b) => {
    const scoreA = a[2];
    const scoreB = b[2];
    return scoreB - scoreA; // Descending order
  });
});
// ============================================================================
// CONSTANTS
// ============================================================================
const GRID_SIZE = 16;
const INITIAL_SPEED = 5;
const MAX_SPEED = 10;
const SPEED_INCREMENT_INTERVAL = 10;

const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const KEYS = {
  UP: ["ArrowUp", "w", "W"],
  DOWN: ["ArrowDown", "s", "S"],
  LEFT: ["ArrowLeft", "a", "A"],
  RIGHT: ["ArrowRight", "d", "D"],
  SPACE: " ",
};

// ============================================================================
// STORES & COMPOSABLES
// ============================================================================
const authStore = useAuthStore();

// ============================================================================
// STATE - UI
// ============================================================================
const isMenuOpen = ref(false);
const isFirstRender = ref(true);

// ============================================================================
// STATE - Canvas & Game Configuration
// ============================================================================
const canvas = ref<HTMLCanvasElement | null>(null);
const gridGameRef = useTemplateRef<HTMLDivElement>("gridGameRef");

const width = computed(() => gridGameRef.value?.clientWidth || 400);
const height = computed(() => gridGameRef.value?.clientWidth || 400);
const tileSize = () => Math.floor(width.value / GRID_SIZE);

// ============================================================================
// STATE - Game Logic
// ============================================================================
const gridSize = ref(GRID_SIZE);
const speed = ref(INITIAL_SPEED);
const score = ref(0);
const gameOver = ref(false);

const snake = ref<Array<{ x: number; y: number }>>([]);
const dir = ref(DIRECTION.RIGHT);
const nextDir = ref(DIRECTION.RIGHT);
let lastDir = DIRECTION.RIGHT;

const food = ref<{ x: number; y: number } | null>(null);

let animationFrame = 0;
let accumulator = 0;
let lastTime = 0;

// ============================================================================
// STATE - Stats & Leaderboard
// ============================================================================
const playCount = ref(27);
const highScore = ref(15);
const topRank = ref(70);

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function randPos() {
  return {
    x: Math.floor(Math.random() * gridSize.value),
    y: Math.floor(Math.random() * gridSize.value),
  };
}

function isSnakeColliding(pos: { x: number; y: number }) {
  return snake.value.some((s) => s.x === pos.x && s.y === pos.y);
}

// ============================================================================
// GAME LOGIC - Core Functions
// ============================================================================
function spawnFood() {
  let pos = randPos();
  while (isSnakeColliding(pos)) {
    pos = randPos();
  }
  food.value = pos;
}

function initializeSnake() {
  const mid = Math.floor(gridSize.value / 2);
  snake.value = [
    { x: mid - 1, y: mid },
    { x: mid, y: mid },
    { x: mid + 1, y: mid },
  ];
}

function resetGame() {
  score.value = 0;
  speed.value = INITIAL_SPEED;
  gameOver.value = false;
  snake.value = [];
  dir.value = DIRECTION.RIGHT;
  nextDir.value = DIRECTION.RIGHT;
  lastDir = DIRECTION.RIGHT;

  initializeSnake();
  spawnFood();
}

function startGame() {
  resetGame();
  isFirstRender.value = false;
  playCount.value++;
  cancelAnimationFrame(animationFrame);
  lastTime = performance.now();
  accumulator = 0;
  animationFrame = requestAnimationFrame(loop);
}

function endGame() {
  gameOver.value = true;
  if (score.value > highScore.value) {
    highScore.value = score.value;
  }
  cancelAnimationFrame(animationFrame);
}

function update() {
  dir.value = { ...nextDir.value };

  const lastSegment = snake.value[snake.value.length - 1];
  if (!lastSegment) return;

  const head = {
    x: (lastSegment.x + dir.value.x + gridSize.value) % gridSize.value,
    y: (lastSegment.y + dir.value.y + gridSize.value) % gridSize.value,
  };

  if (isSnakeColliding(head)) {
    endGame();
    return;
  }

  snake.value.push(head);

  if (food.value && head.x === food.value.x && head.y === food.value.y) {
    score.value += 1;

    if (
      score.value % SPEED_INCREMENT_INTERVAL === 0 &&
      speed.value < MAX_SPEED
    ) {
      speed.value += 1;
    }

    spawnFood();
  } else {
    snake.value.shift();
  }

  lastDir = { ...dir.value };
}

function loop(time: number) {
  const ctx = canvas.value?.getContext("2d");
  if (!ctx) return;

  const fps = Math.max(1, speed.value * 2);
  const interval = 1000 / fps;
  const delta = time - lastTime;
  lastTime = time;
  accumulator += delta;

  if (accumulator >= interval) {
    update();
    accumulator -= interval;
    render(ctx);
  }

  if (!gameOver.value) {
    animationFrame = requestAnimationFrame(loop);
  }
}

// ============================================================================
// RENDERING
// ============================================================================
async function render(ctx: CanvasRenderingContext2D) {
  await nextTick();

  // Clear canvas
  ctx.clearRect(0, 0, width.value, height.value);

  // Background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width.value, height.value);

  const t = tileSize();

  // Draw grid
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridSize.value; i++) {
    const x = i * t;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height.value);
    ctx.stroke();

    const y = i * t;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width.value, y);
    ctx.stroke();
  }

  // Draw food
  if (food.value) {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.value.x * t + 2, food.value.y * t + 2, t - 4, t - 4);
  }

  // Draw snake
  for (let i = 0; i < snake.value.length; i++) {
    const seg = snake.value[i];
    if (!seg) continue;

    ctx.fillStyle = i === snake.value.length - 1 ? "#10b981" : "#22c55e";
    ctx.fillRect(seg.x * t + 1, seg.y * t + 1, t - 2, t - 2);
  }
}

// ============================================================================
// INPUT HANDLERS
// ============================================================================
function changeDirection(direction: "up" | "down" | "left" | "right") {
  if (gameOver.value) return;

  const mapping: Record<string, { x: number; y: number }> = {
    up: DIRECTION.UP,
    down: DIRECTION.DOWN,
    left: DIRECTION.LEFT,
    right: DIRECTION.RIGHT,
  };

  const nd = mapping[direction];
  if (!nd) return;

  // Prevent reverse direction
  if (nd.x === -dir.value.x && nd.y === -dir.value.y) return;

  nextDir.value = nd;
}

function onKey(e: KeyboardEvent) {
  if (playerStore.isDialogOpen.value) return;

  const k = e.key;

  if (KEYS.UP.includes(k)) {
    e.preventDefault();
    changeDirection("up");
  } else if (KEYS.DOWN.includes(k)) {
    e.preventDefault();
    changeDirection("down");
  } else if (KEYS.LEFT.includes(k)) {
    e.preventDefault();
    changeDirection("left");
  } else if (KEYS.RIGHT.includes(k)) {
    e.preventDefault();
    changeDirection("right");
  } else if (k === KEYS.SPACE) {
    e.preventDefault();
    if (!gameOver.value && !isFirstRender.value) return;
    startGame();
  }
}

// ============================================================================
// UI HANDLERS
// ============================================================================
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function navigateToRanking() {
  navigateTo("/top-ranking");
  isMenuOpen.value = false;
}

function logout() {
  authStore.signOut();
  navigateTo("/auth/login");
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================
onMounted(() => {
  const cvs = canvas.value!;
  const dpr = window.devicePixelRatio || 1;

  cvs.width = width.value * dpr;
  cvs.height = height.value * dpr;
  cvs.style.width = width.value + "px";
  cvs.style.height = height.value + "px";

  const ctx = cvs.getContext("2d")!;
  ctx.scale(dpr, dpr);

  resetGame();
  render(ctx);

  window.addEventListener("keydown", onKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  cancelAnimationFrame(animationFrame);
});

watch(gridSize, () => {
  const ctx = canvas.value?.getContext("2d");
  if (ctx) render(ctx);
});

watch(
  () => gameOver.value,
  async (newVal) => {
    if (newVal) {
      try {
        if (!$bridge?.connected()) {
          console.error("Hydra Bridge is not available");
          return;
        }
        if (!walletStore.account || !walletStore.wallet) {
          console.error("Wallet account is not available");
          return;
        }
        const addressUtxos = await $bridge.queryAddressUTxO(
          walletStore.account!.baseAddressBech32
        );
        const scriptUtxos = await $bridge.queryAddressUTxO(
          useRuntimeConfig().public.scriptAddress
        );
        const scriptUtxoPlayer = scriptUtxos.find((utxo: any) => {
          const datumJson = utxo.output.inlineDatum
            ? JSON.parse(utxo.output.inlineDatum.to_json())
            : null;
          return (
            datumJson &&
            datumJson.fields[0] === `${walletStore.account!.paymentKeyHex}`
          );
        });

        const txBuilder = new TxBuilder({
          isHydra: true,
          params: {
            minFeeA: 0,
            minFeeB: 0,
          },
        });

        const inlineDatum = DatumUtils.mkConstr(0, [
          DatumUtils.mkBytes(
            ParserUtils.stringToHex(walletStore.account!.paymentKeyHex)
          ), // owner luôn từ wallet (hex→bytes)
          DatumUtils.mkBytes(ParserUtils.stringToHex(playerName.value)),
          DatumUtils.mkInt(score.value),
          DatumUtils.mkInt(1),
        ]);

        if (!scriptUtxoPlayer) {
          txBuilder.setInputs(addressUtxos);
          txBuilder.addOutput({
            address: useRuntimeConfig().public.scriptAddress,
            amount: [
              {
                unit: "lovelace",
                quantity: "5000000",
              },
            ],
          });
          txBuilder
            .txOutInlineDatumValue(inlineDatum)
            .changeAddress(walletStore.account!.baseAddressBech32)
            .setFee("0");

          const tx = await txBuilder.complete();
          const cborHex = tx.to_hex();
          const signedCborHex = await walletStore.wallet?.signTx(cborHex);
          const txId = Resolver.resolveTxHash(tx.to_hex());

          const result = await $bridge.submitTxSync(
            {
              type: "Witnessed Tx ConwayEra",
              description: "Ledger Cddl Format",
              cborHex: signedCborHex,
              txId: txId,
            },
            { timeout: 30000 }
          );

          if (result.isConfirmed && result.isValid) {
            headStore.inlineDatum.push([
              walletStore.account!.paymentKeyHex,
              playerName.value,
              score.value,
              1,
            ]);
          }

          console.log("Transaction result:", result);
        } else {
          const redeemer = CardanoWASM.Redeemer.new(
            CardanoWASM.RedeemerTag.new_spend(),
            CardanoWASM.BigNum.from_str("0"),
            DatumUtils.mkConstr(0, [DatumUtils.mkInt(score.value)]),
            CardanoWASM.ExUnits.new(
              CardanoWASM.BigNum.from_str("100000"), // Mem
              CardanoWASM.BigNum.from_str("10000000") // Steps
            )
          );

          const datumJson = JSON.parse(
            inlineDatum.to_json(DatumUtils.DatumSchema.Basic)
          );
          console.log("New datum JSON for updated score:", addressUtxos);
          txBuilder
            .setInputs(addressUtxos) // add some regular input to cover fees
            // specify script UTxO to unlock
            .txIn(
              scriptUtxoPlayer.input.txHash,
              scriptUtxoPlayer.input.outputIndex,
              scriptUtxoPlayer.output.amount, //
              scriptUtxoPlayer.output.address
            )
            .txInInlineDatum(scriptUtxoPlayer.output.inlineDatum!)
            .txInScript(useRuntimeConfig().public.txScript)
            .txInCollateral(
              // specify collateral UTxO
              addressUtxos[0]!.input.txHash,
              addressUtxos[0]!.input.outputIndex,
              addressUtxos[0]!.output.amount, //
              addressUtxos[0]!.output.address
            )
            .addOutput({
              address: useRuntimeConfig().public.scriptAddress,
              amount: [
                {
                  unit: "lovelace",
                  quantity: "5000000",
                },
              ],
            })

            .txInRedeemerValue(redeemer)
            .txOutInlineDatumValue(
              DatumUtils.mkConstr(0, [
                DatumUtils.mkBytes(
                  ParserUtils.stringToHex(walletStore.account!.paymentKeyHex)
                ), // owner luôn từ wallet (hex→bytes)
                DatumUtils.mkBytes(ParserUtils.stringToHex(playerName.value)),
                DatumUtils.mkInt(score.value),
                DatumUtils.mkInt(parseInt(datumJson.fields[3]) + 1),
              ])
            )
            .setFee("0");

          const tx = await txBuilder.complete();
          const cborHex = tx.to_hex();
          const signedCborHex = await walletStore.wallet?.signTx(cborHex);
          const txId = Resolver.resolveTxHash(tx.to_hex());
          const result = await $bridge.submitTxSync(
            {
              type: "Witnessed Tx ConwayEra",
              description: "Ledger Cddl Format",
              cborHex: signedCborHex,
              txId: txId,
            },
            { timeout: 30000 }
          );
          console.log("Transaction result:", result);
          if (result.isConfirmed && result.isValid) {
            headStore.inlineDatum.push([
              walletStore.account!.paymentKeyHex,
              playerName.value,
              score.value,
              parseInt(datumJson.fields[3]) + 1,
            ]);
          }
        }
      } catch (error) {
        console.error("Error connecting to Hydra Bridge at game over:", error);
      }
    }
  }
);
</script>

<template>
  <div class="min-h-screen bg-slate-900 relative">
    <!-- Hamburger Button (Mobile only) -->
    <button
      @click="toggleMenu"
      class="fixed flex items-center top-4 left-4 z-50 lg:hidden bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 text-white hover:bg-gray-700 transition-colors shadow-lg"
    >
      <Icon v-if="!isMenuOpen" name="mdi:menu" size="24" />
      <Icon v-else name="mdi:close" size="24" />
    </button>

    <!-- Mobile Sheet Menu -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMenuOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="toggleMenu"
      ></div>
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300"
      leave-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="isMenuOpen"
        class="fixed right-0 top-0 h-full w-[60%] max-w-sm bg-gray-900 border-l border-gray-700 z-50 lg:hidden overflow-y-auto"
      >
        <div class="p-6 space-y-6">
          <!-- User Info in Menu -->
          <div class="border-b border-gray-700 pb-4">
            <div class="flex items-center gap-3 mb-3 min-w-0">
              <div
                class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              >
                {{ usePlayerName().playerName.value.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-white font-semibold truncate">
                  {{ usePlayerName().playerName.value }}
                </h3>
                <p class="text-gray-400 text-xs font-mono truncate">
                  {{ useWalletStore().account?.baseAddressBech32 }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                class="bg-blue-600/20 rounded-lg p-2 text-center border border-blue-600/40"
              >
                <div class="text-blue-400 text-xs mb-1">PLAYS</div>
                <div class="text-white font-bold">{{ infoGamePlayer.numberOfPlays }}</div>
              </div>
              <div
                class="bg-blue-600/20 rounded-lg p-2 text-center border border-blue-600/40"
              >
                <div class="text-blue-400 text-xs mb-1">HIGH</div>
                <div class="text-white font-bold">
                  {{ infoGamePlayer.score }}
                </div>
              </div>
              <div
                class="bg-blue-600/20 rounded-lg p-2 text-center border border-blue-600/40"
              >
                <div class="text-blue-400 text-xs mb-1">RANK</div>
                <div class="text-white font-bold">
                  {{ infoGamePlayer.rank }}
                </div>
              </div>
            </div>
          </div>

          <!-- Menu Options -->
          <nav class="space-y-2">
            <button
              @click="navigateToRanking"
              class="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <Icon name="mdi:trophy" size="20" class="text-yellow-400" />
              <span class="text-white font-medium">Top Ranking</span>
            </button>
            <button
              @click="logout"
              class="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-left"
            >
              <Icon name="mdi:logout" size="20" class="text-white" />
              <span class="text-white font-medium">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </Transition>

    <div class="flex items-center min-h-screen">
      <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mx-10">
        <!-- Left Panel - User Info & Rankings (Hidden on mobile) -->
        <div class="hidden lg:block lg:col-span-3 space-y-4">
          <!-- User Profile Card -->
          <div
            class="bg-gray-800/80 rounded-xl p-5 border border-gray-700 w-full"
          >
            <div class="flex items-start justify-between mb-4 w-full gap-2">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div
                  class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                >
                  {{ usePlayerName().playerName.value.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold truncate">
                    {{ usePlayerName().playerName.value }}
                  </h3>
                  <p class="text-gray-400 text-xs font-mono truncate">
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
                class="bg-blue-600/20 rounded-lg p-2.5 text-center border border-blue-600/40"
              >
                <div class="text-blue-400 text-xs font-medium mb-1">
                  PLAY COUNTS
                </div>
                <div class="text-white text-xl font-bold">{{ infoGamePlayer.numberOfPlays }}</div>
              </div>
              <div
                class="bg-blue-600/20 rounded-lg p-2.5 text-center border border-blue-600/40"
              >
                <div class="text-blue-400 text-xs font-medium mb-1">
                  HIGH SCORE
                </div>
                <div class="text-white text-xl font-bold">
                  {{ infoGamePlayer.score }}
                </div>
              </div>
              <div
                class="bg-blue-600/20 rounded-lg p-2.5 text-center border border-blue-600/40"
              >
                <div class="text-blue-400 text-xs font-medium mb-1">
                  TOP RANK
                </div>
                <div class="text-white text-xl font-bold">
                  {{ infoGamePlayer.rank }}
                </div>
              </div>
            </div>
          </div>

          <!-- Top Ranking -->
          <div class="bg-gray-800/80 rounded-xl p-5 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-white font-semibold text-lg">Top ranking</h3>
              <span
                class="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/40"
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
                <div class="relative mx-auto w-16 h-16 mb-2">
                  <div
                    class="w-full h-full rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-yellow-500/30"
                  >
                    <span class="text-white font-bold text-xs">{{
                      datum[1].charAt(0)
                    }}</span>
                  </div>
                  <div
                    class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-900 border-2 border-yellow-500 flex items-center justify-center"
                  >
                    <span class="text-yellow-400 text-xs font-bold">{{
                      index + 1
                    }}</span>
                  </div>
                </div>
                <p class="text-white text-xs font-medium truncate">
                  {{ datum[1] }}
                </p>
                <p class="text-gray-400 text-xs">{{ datum[2] }}</p>
              </div>
            </div>

            <!-- Rest of rankings (4-30 with scroll) -->
            <div
              class="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-1"
            >
              <div
                v-for="(datum, index) in sortSnapshotDatum.slice(3, 30)"
                :key="index"
                class="flex items-center justify-between p-2 bg-gray-900/60 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="text-gray-500 text-sm font-medium w-6">{{
                    index + 4
                  }}</span>
                  <div
                    class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"
                  >
                    <span class="text-white text-xs font-bold">{{
                      datum[1].charAt(0)
                    }}</span>
                  </div>
                  <span class="text-white text-sm">{{ datum[1] }}</span>
                </div>
                <span class="text-white font-semibold">{{ datum[2] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Panel - Game -->
        <div class="lg:col-span-6 flex flex-col items-center justify-center">
          <!-- <h1 class="text-white text-3xl font-bold mb-6">Score: {{ score }}</h1> -->

          <div
            ref="gridGameRef"
            class="w-full max-w-[500px] aspect-square relative rounded-xl overflow-hidden bg-gray-900 border-2 border-gray-700 shadow-xl"
          >
            <canvas
              ref="canvas"
              :width="width"
              :height="height"
              class="w-full h-full block"
            ></canvas>

            <div
              v-if="gameOver || isFirstRender"
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white backdrop-blur-sm"
            >
              <h2 class="text-3xl font-bold mb-2">
                {{ isFirstRender ? "TAP TO PLAY" : "Game Over" }}
              </h2>
              <p v-show="!isFirstRender" class="mb-6 text-xl">
                Score: {{ score }}
              </p>
              <button
                @click="startGame"
                class="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg border-4 border-orange-700 transition-colors text-lg"
              >
                {{ isFirstRender ? "START" : "PLAY AGAIN" }}
              </button>
            </div>
          </div>

          <!-- Mobile controls -->
          <div
            class="flex flex-col items-center justify-center lg:hidden gap-3 mt-6"
          >
            <button
              @touchstart.prevent="changeDirection('up')"
              @click="changeDirection('up')"
              class="bg-slate-800 border-2 border-slate-600 text-slate-200 rounded-xl min-w-[70px] min-h-[70px] flex items-center justify-center transition-all active:scale-95 active:bg-slate-950 active:border-green-500 hover:bg-slate-700 hover:border-slate-500 select-none"
            >
              <Icon
                size="20"
                name="material-symbols:arrow-upward-alt-rounded"
              />
            </button>
            <div class="flex items-center gap-8">
              <button
                @touchstart.prevent="changeDirection('left')"
                @click="changeDirection('left')"
                class="bg-slate-800 border-2 border-slate-600 text-slate-200 rounded-xl min-w-[70px] min-h-[70px] flex items-center justify-center transition-all active:scale-95 active:bg-slate-950 active:border-green-500 hover:bg-slate-700 hover:border-slate-500 select-none"
              >
                <Icon
                  size="20"
                  name="material-symbols:arrow-left-alt-rounded"
                />
              </button>
              <div class="min-w-[70px] min-h-[70px]" />
              <button
                @touchstart.prevent="changeDirection('right')"
                @click="changeDirection('right')"
                class="bg-slate-800 border-2 border-slate-600 text-slate-200 rounded-xl min-w-[70px] min-h-[70px] flex items-center justify-center transition-all active:scale-95 active:bg-slate-950 active:border-green-500 hover:bg-slate-700 hover:border-slate-500 select-none"
              >
                <Icon
                  size="20"
                  name="material-symbols:arrow-right-alt-rounded"
                />
              </button>
            </div>
            <button
              @touchstart.prevent="changeDirection('down')"
              @click="changeDirection('down')"
              class="bg-slate-800 border-2 border-slate-600 text-slate-200 rounded-xl min-w-[70px] min-h-[70px] flex items-center justify-center transition-all active:scale-95 active:bg-slate-950 active:border-green-500 hover:bg-slate-700 hover:border-slate-500 select-none"
            >
              <Icon
                size="20"
                name="material-symbols:arrow-downward-alt-rounded"
              />
            </button>
          </div>
        </div>

        <!-- Right Panel - Transactions (Hidden < 1024px) -->
        <div class="hidden lg:block lg:col-span-3">
          <div
            class="bg-gray-800/80 rounded-xl p-5 border border-gray-700 sticky top-4"
          >
            <h3 class="text-white font-semibold text-lg mb-4">
              Realtime transactions
            </h3>

            <!-- Stats Header -->
            <div
              class="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-900/60 rounded-lg border border-gray-700"
            >
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Player</div>
                <div class="text-white font-bold">388</div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Avg Tx Size</div>
                <div class="text-white font-bold">335 B</div>
              </div>
              <div class="text-center">
                <div class="text-gray-400 text-xs mb-1">Total TX</div>
                <div class="text-white font-bold">89.51K</div>
              </div>
            </div>

            <!-- Transaction List -->
            <div
              class="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
            >
              <div
                v-for="(tx, i) in transactions"
                :key="i"
                class="p-3 bg-gray-900/60 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-colors group"
              >
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="text-gray-300 text-xs font-mono truncate flex-1 group-hover:text-blue-400 transition-colors"
                  >
                    {{ tx.hash }}
                  </span>
                  <Icon
                    name="mdi:eye"
                    size="16"
                    class="text-gray-500 group-hover:text-blue-400 transition-colors ml-2"
                  />
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div class="text-gray-500">Player</div>
                    <div class="text-white font-medium">{{ tx.player }}</div>
                  </div>
                  <div>
                    <div class="text-gray-500">Size</div>
                    <div class="text-white font-medium">{{ tx.avgSize }}</div>
                  </div>
                  <div>
                    <div class="text-gray-500">Total</div>
                    <div class="text-white font-medium">{{ tx.total }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
