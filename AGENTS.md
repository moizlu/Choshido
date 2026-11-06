# 調知堂 — 開発メモ

健康記録と防災訓練をひとつにした、ローカル完結のWebプロトタイプ。

## コマンド

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
pnpm run deploy
```

コミット前に `typecheck` / `lint` / `test` / `build` を通す。

## 構成

- `src/domain/` — 純粋なドメインロジック。Reactに依存させない。
  - `metrics.ts` BMI・BMR、`points.ts` ポイント・段位、`streak.ts` 連続記録、`advice.ts` 助言、`sim.ts` シミュレーション
- `src/features/map/` — 固定グリッドのマップ、A*経路探索、SVG描画
- `src/app/` — 状態ストア、zodスキーマ、localStorage永続化、派生セレクタ
- `src/features/` — 今日・記録・防災・設定の画面
- `src/components/` — 共通UI。色・フォントは `src/styles/tokens.css` の変数のみ使う。

## 守ること

- クライアントサイド完結。外部API・Webフォント・地図タイル・解析タグを追加しない。
- 通常データ（`choshido:v1:real`）とシミュレーション（`choshido:v1:sim`）を混ぜない。ストアは `mode` で参照先を切り替える。
- ポイント付与は `src/app/apply.ts` の重複防止キー経由に統一する。
- 日付はローカル日付キー `YYYY-MM-DD` で扱う。UTC変換で日付を跨がない。
- 医療上の断定を書かない。防災マップは架空であることを常時表示する。
- デザインは記録簿・手帳の方向性。紫グラデーション、ガラス表現、絵文字アイコン、過剰な角丸を避ける。
- 画面を追加したら、モバイル375pxとデスクトップで確認する。

## スコープ外

HealthKit / Google Fit / Health Connect、Geolocation、実地図、実ハザードGIS、アカウント・同期・通知、PWA、ネイティブアプリ化、SNS・ショップ。

## テスト

- ドメイン変更時は必ずユニットテストを追加・更新する。
- `src/features/map/pathfinding.test.ts` は「回避ONで危険区域を通らない」「OFFでは最短経路が危険区域を通る」を保証している。マップを変えたら必ず実行する。
- `src/app/store.test.tsx` はreal/simの分離とインポート検証を担保する。
