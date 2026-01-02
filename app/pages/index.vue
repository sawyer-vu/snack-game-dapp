<script setup lang="ts">
import { useAuthStore } from "@/stores/auth.store";
import { TxBuilder } from "@hydra-sdk/transaction";
import { CardanoWASM } from "@hydra-sdk/cardano-wasm";
import { DatumUtils, ParserUtils, Resolver } from "@hydra-sdk/core";
import ProfileCard from "@/components/ProfileCard.vue";
import SnapshotList from "~/components/SnapshotList.vue";
import TopRanking from "~/components/TopRanking.vue";
import { useHydraStore } from "~/stores/hydra.store";
import { buildTx } from "~/utils/tx-builder";

const walletStore = useWalletStore();
const { $bridge } = useNuxtApp();
const hydraStore = useHydraStore();
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
  hydraStore.inlineDatum.forEach((fields) => {
    // if(fields[0] === walletStore.account?.paymentKeyHex) {
    //   console.log("Found player datum fields:", fields);
    //   infoGamePlayer.numberOfPlays = infoGamePlayer.numberOfPlays + 1
    // }

    const owner = fields.paymentKeyHex; // owner address/hash
    const score = fields.score; // score value

    const existingFields = ownerMap.get(owner);

    // If owner doesn't exist or current score is higher, update
    if (!existingFields || score > existingFields[2]) {
      ownerMap.set(owner, fields);
    }
  });

  const result = Array.from(ownerMap.values());

  const playerFields = result.find(
    (fields) => fields.paymentKeyHex === walletStore.account?.paymentKeyHex
  );

  if (playerFields) {
    infoGamePlayer.score = playerFields.score;
    infoGamePlayer.rank =
      result.filter((fields) => fields.score > playerFields.score).length + 1;
  } else {
    infoGamePlayer.score = 0;
    infoGamePlayer.rank = result.length + 1;
  }

  return result.sort((a, b) => {
    const scoreA = a.score;
    const scoreB = b.score;
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
  if (!authStore.wallet.name) return;

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

        if (!scriptUtxoPlayer) {
          const outputs = {
            address: useRuntimeConfig().public.scriptAddress,
            amount: [
              {
                unit: "lovelace",
                quantity: "5000000",
              },
            ],
          };

          const inlineDatum = DatumUtils.mkConstr(0, [
            DatumUtils.mkBytes(
              ParserUtils.stringToHex(walletStore.account!.paymentKeyHex)
            ), // owner luôn từ wallet (hex→bytes)
            DatumUtils.mkBytes(ParserUtils.stringToHex(authStore.wallet.name)),
            DatumUtils.mkInt(score.value),
            DatumUtils.mkInt(1),
          ]);

          const result = await buildTx({
            inputs: addressUtxos,
            outputs,
            txOutInlineDatum: inlineDatum,
            changeAddress: walletStore.account!.baseAddressBech32,
          });

          if (result?.isConfirmed && result?.isValid) {
            // Refresh data from Hydra snapshot instead of manually pushing
            await hydraStore.queryInlineDatum();
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

          const outputs = {
            address: useRuntimeConfig().public.scriptAddress,
            amount: [
              {
                unit: "lovelace",
                quantity: "5000000",
              },
            ],
          };

          const datumJson =
            scriptUtxoPlayer?.output?.inlineDatum &&
            JSON.parse(
              scriptUtxoPlayer.output.inlineDatum.to_json(
                DatumUtils.DatumSchema.Basic
              )
            );

          const txOutInlineDatum = DatumUtils.mkConstr(0, [
            DatumUtils.mkBytes(
              ParserUtils.stringToHex(walletStore.account!.paymentKeyHex)
            ), // owner luôn từ wallet (hex→bytes)
            DatumUtils.mkBytes(ParserUtils.stringToHex(authStore.wallet.name)),
            DatumUtils.mkInt(score.value),
            DatumUtils.mkInt(parseInt(datumJson.fields[3]) + 1),
          ]);

          const result = await buildTx({
            inputs: addressUtxos,
            outputs,
            txOutInlineDatum,
            changeAddress: walletStore.account!.baseAddressBech32,
            redeemer,
            script: useRuntimeConfig().public.txScript,
            txIn: scriptUtxoPlayer,
            collateral: addressUtxos[0],
          });

          if (result?.isConfirmed && result?.isValid) {
            // Refresh data from Hydra snapshot instead of manually pushing
            await hydraStore.queryInlineDatum();
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
  <div class="relative min-h-screen bg-slate-900">
    <div class="flex items-center min-h-screen">
      <div class="grid w-full grid-cols-1 gap-4 mx-10 lg:grid-cols-12 lg:gap-6">
        <!-- Left Panel - User Info & Rankings (Hidden on mobile) -->
        <div class="hidden space-y-4 lg:block lg:col-span-3">
          <!-- User Profile Card -->
          <ProfileCard :infoGame="infoGamePlayer" />

          <!-- Top Ranking -->
          <TopRanking :sortSnapshotDatum="sortSnapshotDatum" />
        </div>

        <!-- Center Panel - Game -->
        <div class="flex flex-col items-center justify-center lg:col-span-6">
          <!-- <h1 class="mb-6 text-3xl font-bold text-white">Score: {{ score }}</h1> -->

          <div
            ref="gridGameRef"
            class="w-full max-w-[500px] aspect-square relative rounded-xl overflow-hidden bg-gray-900 border-2 border-gray-700 shadow-xl"
          >
            <canvas
              ref="canvas"
              :width="width"
              :height="height"
              class="block w-full h-full"
            ></canvas>

            <div
              v-if="gameOver || isFirstRender"
              class="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 backdrop-blur-sm"
            >
              <h2 class="mb-2 text-3xl font-bold">
                {{ isFirstRender ? "TAP TO PLAY" : "Game Over" }}
              </h2>
              <p v-show="!isFirstRender" class="mb-6 text-xl">
                Score: {{ score }}
              </p>
              <button
                @click="startGame"
                class="px-8 py-3 text-lg font-bold text-white transition-colors bg-orange-600 border-4 border-orange-700 rounded-lg hover:bg-orange-700"
              >
                {{ isFirstRender ? "START" : "PLAY AGAIN" }}
              </button>
            </div>
          </div>

          <div
            class="flex flex-col items-center justify-center gap-3 mt-6 lg:hidden"
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

        <SnapshotList />
      </div>
    </div>
  </div>
  <PlayerNameDialog />
</template>
