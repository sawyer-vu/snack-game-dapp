<script setup lang="ts">
// Config
const width = computed(() => gridGameRef.value?.clientWidth || 400);
const height = computed(() => gridGameRef.value?.clientWidth || 400);
const canvas = ref<HTMLCanvasElement | null>(null);

// Reactive game state
const gridSize = ref<number>(16); // number of columns/rows
const tileSize = () => Math.floor(width.value / gridSize.value);
const speed = ref<number>(5); // starts at 1, max 15
const score = ref<number>(0);
const gameOver = ref<boolean>(false);

const snake = ref<Array<{ x: number; y: number }>>([]);
const dir = ref<{ x: number; y: number }>({ x: 1, y: 0 });
const nextDir = ref<{ x: number; y: number }>({ x: 1, y: 0 });
let lastDir = { x: 1, y: 0 };
const food = ref<{ x: number; y: number } | null>(null);

const gridGameRef = useTemplateRef<HTMLDivElement>("gridGameRef");
const isFirstRender = ref(true);

let animationFrame = 0;
let accumulator = 0;
let lastTime = 0;

function randPos() {
  return {
    x: Math.floor(Math.random() * gridSize.value),
    y: Math.floor(Math.random() * gridSize.value),
  };
}

function spawnFood() {
  let pos = randPos();
  // avoid spawning on snake
  while (snake.value.some((s) => s.x === pos.x && s.y === pos.y)) {
    pos = randPos();
  }
  food.value = pos;
}

function resetGame() {
  score.value = 0;
  speed.value = 5;
  gameOver.value = false;
  snake.value = [];
  dir.value = { x: 1, y: 0 };
  nextDir.value = { x: 1, y: 0 };
  lastDir = { x: 1, y: 0 };
  const mid = Math.floor(gridSize.value / 2);
  snake.value.push({ x: mid - 1, y: mid });
  snake.value.push({ x: mid, y: mid });
  snake.value.push({ x: mid + 1, y: mid });
  spawnFood();
}

function startGame() {
  resetGame();
  isFirstRender.value = false;
  cancelAnimationFrame(animationFrame);
  lastTime = performance.now();
  accumulator = 0;
  animationFrame = requestAnimationFrame(loop);
}

function endGame() {
  gameOver.value = true;
  cancelAnimationFrame(animationFrame);
}

function loop(time: number) {
  const ctx = canvas.value?.getContext("2d");
  if (!ctx) return;

  const fps = Math.max(1, speed.value * 2); // base frames per second mapping
  const interval = 1000 / fps;
  const delta = time - lastTime;
  lastTime = time;
  accumulator += delta;

  if (accumulator >= interval) {
    update();
    accumulator -= interval;
    render(ctx);
  }

  if (!gameOver.value) animationFrame = requestAnimationFrame(loop);
}

function update() {
  // Apply queued direction
  dir.value = { ...nextDir.value };

  // move snake
  const lastSegment = snake.value[snake.value.length - 1];
  if (!lastSegment) return;

  const head = {
    x: lastSegment.x + dir.value.x,
    y: lastSegment.y + dir.value.y,
  };

  // wrap around
  head.x = (head.x + gridSize.value) % gridSize.value;
  head.y = (head.y + gridSize.value) % gridSize.value;

  // collision with self
  if (snake.value.some((seg) => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  snake.value.push(head);

  // eat food
  if (food.value && head.x === food.value.x && head.y === food.value.y) {
    score.value += 1;

    // increase speed every 10 foods, max 10
    if (score.value % 10 === 0 && speed.value < 10) {
      speed.value += 1;
    }

    spawnFood();
  } else {
    snake.value.shift();
  }

  lastDir = { ...dir.value };
}

async function render(ctx: CanvasRenderingContext2D) {
  await nextTick();
  // clear
  ctx.clearRect(0, 0, width.value, height.value);

  // background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width.value, height.value);

  const t = tileSize();

  // grid (optional subtle)
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

  // draw food
  if (food.value) {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.value.x * t + 2, food.value.y * t + 2, t - 4, t - 4);
  }

  // draw snake
  for (let i = 0; i < snake.value.length; i++) {
    const seg = snake.value[i];
    if (!seg) continue;
    // head different color
    if (i === snake.value.length - 1) ctx.fillStyle = "#10b981";
    else ctx.fillStyle = "#22c55e";
    ctx.fillRect(seg.x * t + 1, seg.y * t + 1, t - 2, t - 2);
  }
}

function changeDirection(direction: "up" | "down" | "left" | "right") {
  if (gameOver.value) return;

  const mapping: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const nd = mapping[direction];
  if (!nd) return;

  // prevent reverse direction
  if (nd.x === -dir.value.x && nd.y === -dir.value.y) return;

  // queue next direction for smooth input
  nextDir.value = nd;
}

function onKey(e: KeyboardEvent) {
  const k = e.key;

  if (["ArrowUp", "w", "W"].includes(k)) {
    e.preventDefault();
    changeDirection("up");
  }
  if (["ArrowDown", "s", "S"].includes(k)) {
    e.preventDefault();
    changeDirection("down");
  }
  if (["ArrowLeft", "a", "A"].includes(k)) {
    e.preventDefault();
    changeDirection("left");
  }
  if (["ArrowRight", "d", "D"].includes(k)) {
    e.preventDefault();
    changeDirection("right");
  }
  if (k === " ") {
    e.preventDefault();
    if (!gameOver.value && !isFirstRender.value) return;
    startGame();
  }
}

onMounted(() => {
  // initialize canvas pixel ratio for sharpness
  const cvs = canvas.value!;
  const dpr = window.devicePixelRatio || 1;
  cvs.width = width.value * dpr;
  cvs.height = height.value * dpr;
  cvs.style.width = width.value + "px";
  cvs.style.height = height.value + "px";
  const ctx = cvs.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // start with a ready board
  resetGame();
  render(ctx);

  window.addEventListener("keydown", onKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  cancelAnimationFrame(animationFrame);
});

watch(gridSize, () => {
  // recalc tile size on change - canvas is fixed pixel size so just redraw
  const ctx = canvas.value?.getContext("2d");
  if (ctx) render(ctx);
});
</script>

<template>
  <div class="p-4 flex flex-col items-center h-screen sm:gap-8 gap-5">
    <!-- overlay UI -->
    <h1 class="text-white text-3xl sm:mt-10 mt-3">Score: {{ score }}</h1>
    <div
      ref="gridGameRef"
      class="w-80 h-80 sm:w-[480px] sm:h-[480px] pt-0 relative rounded-lg overflow-hidden bg-gray-900"
    >
      <canvas
        ref="canvas"
        :width="width"
        :height="height"
        class="w-full h-auto block"
      ></canvas>

      <div
        v-if="gameOver || isFirstRender"
        class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white"
      >
        <h2 class="text-2xl mb-2">
          {{ isFirstRender ? "Welcome" : "Game Over" }}
        </h2>
        <p v-show="!isFirstRender" class="mb-4">Score: {{ score }}</p>
        <div class="flex gap-2">
          <button @click="startGame" class="px-4 py-2 bg-green-600 rounded">
            {{ isFirstRender ? "Start Game" : "Play Again" }}
          </button>
        </div>
      </div>
    </div>

    <!-- controls (keyboard + mobile) -->
    <div class="flex items-center flex-col justify-center md:hidden gap-2">
      <button
        @touchstart.prevent="changeDirection('up')"
        @click="changeDirection('up')"
        class="control-btn"
      >
        <Icon size="18" name="material-symbols:arrow-upward-alt-rounded" />
      </button>
      <div class="flex items center gap-6">
        <button
          @touchstart.prevent="changeDirection('left')"
          @click="changeDirection('left')"
          class="control-btn"
        >
          <Icon size="18" name="material-symbols:arrow-left-alt-rounded" />
        </button>
        <button class="control-btn invisible" />
        <button
          @touchstart.prevent="changeDirection('right')"
          @click="changeDirection('right')"
          class="control-btn"
        >
          <Icon size="18" name="material-symbols:arrow-right-alt-rounded" />
        </button>
      </div>
      <button
        @touchstart.prevent="changeDirection('down')"
        @click="changeDirection('down')"
        class="control-btn"
      >
        <Icon size="18" name="material-symbols:arrow-downward-alt-rounded" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.control-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 10px;
  min-width: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease-out;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover {
    background: #334155;
  }

  &:active {
    transform: scale(0.92);
    background: #0f172a;
    border-color: #22c55e;
  }
}
</style>
