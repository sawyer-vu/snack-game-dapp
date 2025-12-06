# Snack Game DApp — Snake + Cardano

Một dự án nhỏ: game rắn săn mồi (Snake) chạy trên Nuxt + TypeScript, kết hợp với các ý tưởng DApp trên Cardano (ví dụ: lưu high score on-chain, mint phần thưởng, hoặc tương tác ví). Mục tiêu là một demo chơi được, dễ mở rộng để tích hợp chức năng blockchain.

---

## Tính năng chính

- Trò chơi rắn săn mồi nhẹ (canvas + JavaScript/TypeScript)
- Responsive UI, hỗ trợ bàn phím và controls trên mobile
- Tốc độ tăng dần theo điểm (tăng 1 speed mỗi khi ăn 5 mồi, max 15)
- Queue hướng di chuyển cho input mượt mà trên cả keyboard và touch
- Thiết kế để dễ dàng tích hợp Cardano (Nami/WalletConnect/Blockfrost) — có chỗ để mở rộng và thêm các interaction on-chain

---

## Demo nhanh

- Chạy local dev server và mở http://localhost:3000

---

## Công nghệ

- Nuxt 3 (Vite)
- Vue 3 + TypeScript
- Canvas 2D API cho phần game
- Tailwind CSS / SCSS cho UI

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

- Bàn phím: Mũi tên / WASD
- Mobile: Nút điều khiển trên màn hình (touch starts), thiết kế tối ưu để giảm lag input
- Space: Start/Reset game

---

## Cardano Integration (Ghi chú)

> Lưu ý: phần Cardano trong README này chỉ là hướng dẫn tích hợp cơ bản. Dự án chưa nhất thiết phải có mọi thành phần on-chain — bạn có thể mở rộng theo nhu cầu.

- Mục tiêu tích hợp:

  - Ghi nhận high-scores on-chain bằng transaction hoặc sử dụng metadata JSON
  - Mint NFT reward cho người chơi khi đạt milestone
  - Tích hợp ví (ví dụ: Nami hoặc WalletConnect cho Cardano) để xác thực transaction

- Ví dụ các công việc cần làm để tích hợp Cardano:

  1. Tạo tài khoản Blockfrost và lấy `BLOCKFROST_PROJECT_ID` (nếu định tương tác qua Blockfrost API)
  2. Thêm connector ví (Nami) vào frontend để người dùng sign transaction / mint
  3. Viết các endpoints backend (tùy chọn) hoặc call trực tiếp RPC / Blockfrost để đọc/ghi data on-chain

- ENV variables gợi ý (thêm vào `.env`):
  - BLOCKFROST_PROJECT_ID=yourKey
  - CARDANO_NETWORK=testnet/mainnet

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
