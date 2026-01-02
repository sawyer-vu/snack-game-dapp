# Snack Game DApp — Snake + Cardano Hydra L2

Một dự án game rắn săn mồi (Snake) chạy trên Nuxt + TypeScript, tích hợp **Hydra L2** của Cardano để tạo trải nghiệm chơi game on-chain với tốc độ cao, chi phí thấp và độ trễ tối thiểu. Mục tiêu là demo chơi được, dễ mở rộng để tích hợp các tính năng blockchain thời gian thực.

---

## Tính năng chính

- 🎮 Trò chơi rắn săn mồi mượt mà (canvas + JavaScript/TypeScript)
- 📱 Responsive UI, hỗ trợ bàn phím và controls trên mobile
- ⚡ Tốc độ tăng dần theo điểm (tăng 1 speed mỗi khi ăn 5 mồi, max 15)
- 🎯 Queue hướng di chuyển cho input mượt mà trên cả keyboard và touch
- ⚙️ Tích hợp **Hydra L2** để xử lý giao dịch nhanh, phí thấp, phù hợp cho gaming DApp

---

## Demo nhanh

- Chạy local dev server và mở http://localhost:3000

---

## Công nghệ

### Frontend
- **Nuxt 3** (Vite) — Framework Vue.js hiện đại
- **Vue 3 + TypeScript** — Reactive UI với type safety
- **Canvas 2D API** — Rendering game engine
- **Tailwind CSS / SCSS** — Styling và responsive design

### Blockchain Layer
- **Cardano Hydra L2** — Layer 2 scaling solution
  - Isomorphic state channels cho throughput cao
  - Sub-second finality cho trải nghiệm real-time
  - Chi phí giao dịch gần như bằng 0
  - Phù hợp cho gaming: leaderboards, rewards, in-game transactions
- **Cardano Mainnet/Testnet** — Layer 1 cho settlement cuối cùng
- **Blockfrost API** — Tương tác với Cardano blockchain
- **Nami/Eternl Wallet** — Wallet integration cho người chơi

---

## Cài đặt & chạy

1. Cài dependencies (yêu cầu pnpm):

```bash
pnpm install
```

2. Chạy dev server:

```bash
pnpm dev
```

3. Build production:

```bash
pnpm build
pnpm preview
```

---

## Điều khiển

- **Bàn phím**: Mũi tên / WASD
- **Mobile**: Nút điều khiển trên màn hình (touch), tối ưu để giảm lag input
- **Space**: Start/Reset game

---

## Tích hợp Cardano Hydra L2

### Tại sao sử dụng Hydra cho Gaming?

**Hydra** là giải pháp Layer 2 của Cardano, đặc biệt phù hợp cho gaming DApps vì:

- ⚡ **Tốc độ cao**: Xử lý hàng nghìn giao dịch mỗi giây (TPS) trong Hydra Head
- 💰 **Chi phí thấp**: Phí giao dịch gần như bằng 0 trong L2, chỉ trả phí khi mở/đóng Head
- 🚀 **Độ trễ thấp**: Finality trong vòng dưới 1 giây, phù hợp cho real-time gaming
- 🔒 **Bảo mật**: Kế thừa security từ Cardano L1, sử dụng eUTxO model
- 🎯 **Isomorphic**: Smart contracts giống hệt L1, dễ dàng migrate logic

### Kiến trúc đề xuất

```
┌─────────────────┐
│   Game Client   │ (Nuxt + Vue)
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Hydra Head    │ ← Xử lý game state, scores, rewards
│   (Layer 2)     │ ← Transactions nhanh, phí thấp
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cardano Mainnet │ ← Settlement cuối cùng
│   (Layer 1)     │ ← NFT minting, final leaderboard
└─────────────────┘
```

### Các tính năng có thể tích hợp

1. **Real-time Leaderboard**
   - Ghi điểm số vào Hydra Head với độ trễ thấp
   - Cập nhật bảng xếp hạng theo thời gian thực
   - Settle điểm cao nhất lên L1 định kỳ

2. **Instant Rewards**
   - Mint token/NFT rewards ngay lập tức trong Hydra
   - Người chơi nhận phần thưởng không cần chờ đợi
   - Commit rewards lên L1 khi cần

3. **In-game Transactions**
   - Mua items, power-ups với chi phí gần như 0
   - Micropayments không khả thi trên L1 nhưng hoàn hảo trên Hydra
   - Trade items giữa người chơi trong Head

4. **Tournament Mode**
   - Mở Hydra Head cho từng tournament
   - Tất cả matches diễn ra trong Head
   - Kết quả cuối cùng được commit lên L1

### Hướng dẫn tích hợp cơ bản

#### 1. Setup Hydra Node

```bash
# Clone Hydra repository
git clone https://github.com/input-output-hk/hydra.git
cd hydra

# Run Hydra node (testnet)
./hydra-node --network testnet --hydra-scripts-tx-id <tx-id>
```

#### 2. Kết nối ví Cardano

```typescript
// Kết nối Nami wallet
const cardano = await window.cardano.nami.enable();
const address = await cardano.getUsedAddresses();
```

#### 3. Tương tác với Hydra Head

```typescript
// Mở Hydra Head
const headId = await openHydraHead({
  participants: [playerAddress1, playerAddress2],
  initialFunds: "10000000" // 10 ADA
});

// Submit transaction trong Head
await submitToHydra({
  headId,
  transaction: scoreUpdateTx
});

// Đóng Head và settle lên L1
await closeHydraHead(headId);
```

#### 4. Environment Variables

Thêm vào `.env`:

```bash
# Cardano Network
CARDANO_NETWORK=testnet
BLOCKFROST_PROJECT_ID=your_blockfrost_key

# Hydra Configuration
HYDRA_NODE_URL=http://localhost:4001
HYDRA_API_KEY=your_hydra_api_key
HYDRA_SCRIPTS_TX_ID=your_scripts_tx_id

# Wallet
WALLET_SEED_PHRASE=your_seed_phrase_for_backend
```

### Resources

- [Hydra Documentation](https://hydra.family/head-protocol/)
- [Hydra GitHub](https://github.com/input-output-hk/hydra)
- [Cardano Developer Portal](https://developers.cardano.org/)
- [Blockfrost API](https://blockfrost.io/)
- [Hydra Node](https://hexcore.io.vn/)
- [Develop Tools](https://hydrasdk.com/)

---

---

## Cấu trúc chính

- `app/pages/index.vue` — logic game chính (render, update, controls)
- `app/assets/...` — CSS/SCSS
- `nuxt.config.ts` — cấu hình Nuxt

---

## Làm tiếp & Contribute

- Bạn có thể mở PR để thêm:
  - On-chain high-score leaderboard
  - Minting NFT reward cho milestones
  - Tutor tutorial để deploy smart contract/Plutus

---

## Giấy phép

MIT

---

Enjoy! Nếu cần, tôi có thể bổ sung phần hướng dẫn tích hợp Cardano chi tiết hơn (ví dụ kết nối Nami, xử lý Blockfrost requests, ví dụ code).</p>

# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
