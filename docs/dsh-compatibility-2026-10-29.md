# DSH 互換性確認（2026-10-29）

対象は dsh-pwa 0.4.5、main `2dde4a5e0c6b1a16df52714694debb60e41ac755` からのローカル差分です。依存の許容範囲や製品バージョンは変更していません。

## 配布元と対象版

公式配布は [npm の @deepseek-ai/dsh](https://registry.npmjs.org/@deepseek-ai%2fdsh)、本体は [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) です。2026-10-29 時点の npm 公開版一覧に、安定版の semver はありません。`latest` も release candidate を指します。

| npm チャネル | 版 | 公式 tag の commit SHA |
| --- | --- | --- |
| latest | 0.2.1-rc.2 | `687f282e8625c6b8d11ff58211a90524be2e4317` |
| next | 0.2.1-rc.4 | `504a01a9578abc2c6f1fb896b1dc322c9fe24f66` |
| alpha | 0.2.2-alpha.2 | `f3803c96974ad4a94195fb97e5c637e9c2a3afe3` |

公式 tag は `dsh-v<version>` です。npm の対象 manifest に `gitHead` はなく、上記は tag の SHA です。npm が記録したビルド元 SHA とは扱いません。各 CLI tarball の SHA-1 と SHA-512 を registry 値と照合しました。

## 対応と変更

各対象版の公開 tarball と tag のソースで、次を確認しました。

| 対象 | 確認結果・根拠 |
| --- | --- |
| 静的 PWA metadata | `webServer.register`、`tapIndex`、`webserver/index-inject` は維持。[WebServer](https://github.com/deepseek-ai/deepseek-harness/blob/f3803c96974ad4a94195fb97e5c637e9c2a3afe3/packages/host/webserver/src/index.ts) |
| 接続・更新 API | `connection.rpc.call`、`connection.fetch.register`、`connection/reset` は維持。[Host RPC](https://github.com/deepseek-ai/deepseek-harness/blob/f3803c96974ad4a94195fb97e5c637e9c2a3afe3/packages/client/connection/src/rpc-host.ts) |
| 画面・モバイル | 使用する slot、layout service、data 属性、React と Button の公開 import は維持。alpha のタブには新たな親ラッパーがある。[web seed](https://github.com/deepseek-ai/deepseek-harness/blob/f3803c96974ad4a94195fb97e5c637e9c2a3afe3/apps/web/src/seed.ts) |
| 日本語 | alpha は日本語を標準搭載。従来の日本語テスト fixture を重ねると辞書登録が衝突する。[locale](https://github.com/deepseek-ai/deepseek-harness/blob/f3803c96974ad4a94195fb97e5c637e9c2a3afe3/packages/client/locale/src/client/index.ts) |
| app-boot 判定 | 下限 0.2.1-alpha.2 と上記 3 チャネルの実 evaluator で、plugin の許容／拒否判定が一致 |

実画面では、alpha の横向き 844×390 で会話ヘッダーが 72px の 2 段になり、既存の 1 段表示テストが失敗しました。新しい [ConversationSession](https://github.com/deepseek-ai/deepseek-harness/blob/f3803c96974ad4a94195fb97e5c637e9c2a3afe3/packages/client/ui-conversation/src/client/skeleton/ConversationSession.tsx#L218) はタブと More メニューを親要素で包みます。旧 CSS は内側のタブへ grid 座標を指定しており、外側の grid item を移動できません。

`client.js` の横向き CSS を、ヘッダー内のタブとタブを直接包む非 slot 要素へ適用します。`display: contents` の slot マーカーを対象から外し、新しい構造の内側タブの余白をリセットして、旧版のタブも同じ 1 段表示を保ちます。新ラッパーには、本体の「1 view あたり 120px ＋ More 48px」の計測に合わせて 288px を確保します。auto 幅だと最初に表示する Chat 1 件の幅へ固定され、Trajectory が常に More に隠れるためです。hashed class への依存や版番号での分岐は増やしません。

その他の変更は検証経路と案内です。

- ブラウザテストは、実行する DSH の公開 `@deepseek-ai/dsh-client-locale/locale/ja.json` があれば標準日本語を使います。旧版だけ既存の固定日本語 fixture を導入します。bundle の識別子は plugin manager の選択を保持します。
- 「新しいセッション」「新規セッション」の両方の日本語ラベルを扱います。
- app-boot チェックは CLI のチャネルを先に解決し、同じ版の evaluator を個別の一時ディレクトリで読みます。
- ブラウザ CI は alpha.3 固定から、宣言の下限・latest・next・alpha の 4 対象へ変更します。各対象の artifact 名は独立しています。
- proxy テストも他のブラウザテストと同じ `DSH_TEST_CHROMIUM` 指定に対応します。

既存 [PR 30](https://github.com/Aero123421/dsh-pwa/pull/30)（履歴ラッパー解除・更新開始エラー・install prompt 表示）と [PR 31](https://github.com/Aero123421/dsh-pwa/pull/31)（通信・復旧結果・再起動待ち・更新準備中断）は別の修正です。今回の差分へ取り込まず、再実装もしません。そのため main に残る既知の問題を今回解決済みとは扱いません。

## 検証の区別

Node テストと実 app-boot evaluator の照合、cookie gate 配下の proxy 回帰、実 DSH Host／Client と Chromium の操作検証を分けて記録します。モデル応答にはローカルの Messages API stub を使い、有料 API は呼びません。

隔離 DSH_HOME のみを使い、実アカウントへのログインや利用者の profile の変更はしません。実端末でのホーム画面追加、OS キーボード／IME、iOS の慣性スクロール、利用者の HTTPS／proxy、他テーマとの組み合わせは未検証です。

## 実行結果

| 対象 DSH | 実 app-boot 判定 | 実 DSH ブラウザ（2回起動） |
| --- | --- | --- |
| 下限 0.2.1-alpha.2 | 成功 | 成功 |
| latest 0.2.1-rc.2 | 成功 | 成功 |
| next 0.2.1-rc.4 | 成功 | 成功 |
| alpha 0.2.2-alpha.2 | 成功 | 成功 |

`npm test` は129件成功、cookie gate 配下の proxy 回帰も成功しました。ブラウザでは320/360/390/600/1280pxの設定、モバイル切替、左右パネル、横向き844×390と667×375、タブ操作、再起動後の状態を確認しました。alphaのヘッダーは修正後37pxで、ChatとTrajectoryを表示します。alphaではphone/iPadのタッチ、中止後のStopped表示、再読込後の履歴、明示的な再接続のgeneration lost→readyも確認しました。

独立した統合環境では、npm latest 0.2.1-rc.2で対象11プラグインの同時起動・停止／再有効化・再接続のsmokeが成功しています。分離したインストールprefixによる依存解決差のpeer警告は残存します。実行Hostの互換範囲内での結果であり、警告の解消や全機能の組合せを保証するものではありません。実アカウント、有料推論、全OSの検証は未実施です。

再現コマンドは次のとおりです。対象の公式DSH版とpnpmを実行PATHへ置き、ブラウザを事前に導入してください。

```sh
npm ci --ignore-scripts
npm test
npm run check:dsh-peer
node scripts/pwa-proxy-check.mjs
npm pack --ignore-scripts
npm run test:browser
npm run test:touch
```

ブラウザテストは独立した一時profileとローカルモデルstubを使います。通常のPlaywright Chromium以外を使う場合は、`DSH_TEST_CHROMIUM`へ実行ファイルを指定できます。
