# 調知堂

ブラウザ完結のプロトタイプです。

- 毎日の体重・睡眠・運動・体調を記録
- BMI・基礎代謝・標準体重・推定消費量を表示
- ルールベースの生活習慣アドバイス（最大3件）
- ポイント・段位・連続記録・判子風バッジ
- 架空の街のマップで、避難所までの経路を選ぶ防災さんぽ訓練
- 14日分のサンプルを生成するデモ再生型シミュレーション

データは全てブラウザの `localStorage` に保存されます。

## 技術構成

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- react-router-dom（HashRouter）
- zod（保存データ・インポートJSONの検証）
- 自作SVG（グラフ・防災マップ・アイコン）
- Vitest + Testing Library
- Cloudflare Pages（静的アセットのみ）
- Docker + nginx（任意のローカル配信）


## ダウンロード
### Gitが使える場合
```bash
git clone https://github.com/moizlu/Choshido.git
cd Choshido
```
## 直にダウンロードする場合
1. リポジトリトップページの右上にある｢Code(緑背景)｣ボタンをクリックし、一番下の｢Download ZIP｣をクリック
2. ZIPファイルを展開して好きなところに配置
3. ターミナルの作業ディレクトリをそこに設定
   - 例: ダウンロードフォルダに置いた場合は`C\:Users\[username]\Downloads\Choshido`

## 起動
### Dockerを使う場合
#### 開発サーバー(普段はこっち)

```bash
docker compose --profile dev up dev
```

`http://localhost:5173` を開きます。ホットリロードが有効です。

依存関係を更新したときは、イメージを作り直してください。開発用コンテナは `package.json` と `pnpm-lock.yaml` をイメージ内から読み込みます。

#### 本番ビルド(nginx)

```bash
docker compose up --build
```

`http://localhost:8080` を開きます。`dist/` を nginx で配信し、`public/_headers` 相当のCSP・キャッシュ・セキュリティヘッダーは `nginx.conf` で付与します。

#### 検証用ビルド

```bash
docker build --target check .
```

`typecheck` / `lint` / `test` をコンテナ内で実行します。

`localStorage` はオリジン単位のため、`localhost:5173` と `localhost:8080` の記録データは共有されません。データを移す場合は設定画面のJSON書き出し／読み込みを使ってください。

### 直接起動する場合
```bash
pnpm install
pnpm dev
```

`http://localhost:5173` を開きます。Node.js 20 以上と pnpm 11 が必要です。

## スクリプト

```bash
pnpm dev            # 開発サーバー
pnpm typecheck      # TypeScriptのチェック
pnpm lint           # oxlint
pnpm test           # Vitest
pnpm build          # 本番ビルド（dist/）
pnpm preview        # ビルド結果の確認
pnpm run deploy     # Cloudflare Pagesへデプロイ
```
## データの保存
全て`localStorage`内に保存されます。
- 通常データ: `choshido:v1:real`
- シミュレーション: `choshido:v1:sim`
- 破損データの退避: `choshido:corrupt:<timestamp>`

設定画面から現在のモードのデータをJSONで書き出し／読み込みできます。読み込み時はzodで検証し、不正なファイルは既存データを変更せずに拒否します。シミュレーションは通常データと完全に別のキー・状態で管理し、終了しても通常データは変わりません。

シミュレーションのモード自体はリロード時に通常モードへ戻ります（シミュレーションデータは残ります）。

## デモ手順

1. 初回オンボーディングで身長・生年・性別を入力（「あとで設定する」でも可）。
2. 今日の記録を入力して保存。BMI・基礎代謝・ポイント・助言が更新されます。
3. 設定 →「シミュレーションを開始」。14日分の記録・グラフ・段位が生成されます。
4. 上部の「1日進める」を数回押すと、日付・グラフ・連続記録・ポイントが変化します。
5. 防災 → 避難所Bを選び、「危険区域を避ける」ONで「歩く」→ 到着+30 / 安全+20。
6. トグルをOFFにし、まだ歩いていない別の避難所（Aなど）を選んで「歩く」→ 危険区域を通過する警告と到着+30のみ。
   - ポイントは避難先ごとに1日1回です。同じ避難先をもう一度歩くと記録は残りますが、その日のポイントは0になります。
7. シミュレーションを終了し、今日の画面が開始前の通常データに戻っていることを確認します。

## 実装しないもの

- HealthKit / Google Fit / Health Connect など実ヘルスデータ連携（手入力のみ）
- ネイティブアプリ（.apk）化・ストア公開
- Geolocation API・実地図・実際のハザードマップGISデータ
- アカウント・サーバーサイド・端末間同期・通知・PWA
- SNS・ランキング・ショップ・ペナルティ
- ダークモード・多言語化

## テスト

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

ドメインロジック（BMI・BMR・ポイント・連続記録・助言・経路探索・シミュレーション・スキーマ）、ログフォーム、real/sim分離、インポートの検証をテストしています。
