# Mobile UI / PWA修正の検証メモ

## 照合した公式DSH

ソース参照: `deepseek-ai/deepseek-harness@571902028a75c64c1d767f4ae5fd099485f0ddf0`。
ブラウザ実行対象: npmで公開された `@deepseek-ai/dsh@0.2.1-alpha.3` と `@deepseek-ai/dsh@0.2.1-rc.2`（後述の追加修正で確認）。
ソースHEADをビルドした検証と、公開済みパッケージでの検証は同一ではありません。

参照箇所は `packages/client/ui-layout/src/client/{AppFrame.tsx,AppFrame.module.css,service.ts}`、`packages/client/ui-sidebar-right/src/client/shell/SidebarRight{.tsx,.module.css}`、`packages/client/ui-settings-general/src/client/SettingsRoot{.tsx,.module.css}`、`packages/host/{webserver,frontend-static}/src/index.ts`、`apps/web/index.html` です。

## 問題と修正

旧モバイル表示は、公式の3カラムgridを残したまま中央を左右にtranslateしていました。右パネルも88vwに制限し、ファイル画面の幅をさらに減らしていました。これをスマホでは単一カラム＋左オーバーレイ＋右全幅にします。会話やセッションを再マウントせず、layout serviceと右パネルの既存操作を使います。

浮いたメニューボタンは会話ヘッダーにしか余白を設けておらず、Pluginsなど別のメイン画面と衝突する構成でした。専用ヘッダーへ操作を分離し、safe-area、44pxのボタン、Escape、フォーカス復帰、背面のinertを追加します。Settingsも外枠からスクロール領域まで狭い画面に収めます。

会話全体のsubtreeを監視していたMutationObserverは削除します。公式のpanelInfo購読、フレーム属性と右パネルの監視に限定し、ストリーミング本文の追加を契機にサイドバー全体を調べません。

PNGアイコンは修正前から同梱され、独立した公式DSH環境でも200応答とサイズを確認できました。「画像ファイルが存在しない」ことが全環境での原因ではありません。一方、plugin自身のmanifestリンクとインストールUIがなく、既に開いているページでpluginを有効にしてもserver-sideのApple用head注入は反映されませんでした。manifestの明示、stockリンクとの重複整理、hot enable時のhead補完、アイコンのプレビュー、導入方法と到達性の表示を追加します。

## 実描画で見つかった問題と追加修正

iPhone相当（390×844、タッチ、画素密度3倍）と横向き（844×390）で、表・長いコード・リストを含む応答を返すローカルのスタブを使い、会話画面を描画して確認しました。

- 会話画面ではプラグインの上部バー（52px）とDSHの会話ヘッダー（タイトル行とChat/Trajectoryタブ）が縦に重なり、上部の約130pxを占めていました。メニューボタンを公式の `conversation.header.leading`（Sessionタイトルの前に置く全体ナビゲーション用の席。stock DSHでは空）へ移し、上部バーは会話ヘッダーのない画面（Plugins、Automation tasks）だけで表示します。会話ヘッダーは約64px、横向きではタブをタイトル行へ寄せて約37pxです。
- DSHの `.md-table-wide` は `:hover` のときだけ横スクロールできるため、タッチ画面では右側の列に届きませんでした。モバイル表示では常に横スクロールでき、セルの最大幅を `min(30vw,320px)` から `min(60vw,320px)` へ広げます。
- 横向きのスマホは幅768px以上のため「自動」でもデスクトップ表示になり、会話の見える範囲が細い帯だけでした。「自動」の条件に `(max-height: 500px) and (pointer: coarse)` を加えます。左右のsafe-area（ノッチ）を中央列・右パネル・ドロワー・設定画面で避けます。
- iOSではキーボード表示時にページの高さを変えず、visual viewportを下へずらします。旧実装は高さだけを `visualViewport.height` に合わせたため、ずれた分だけ表示が空白側へ寄る可能性がありました。`offsetTop` に合わせて `#root` を移動し、キーボード表示中は入力欄の下のsafe-area余白を外します。ピンチズーム中は値を更新しません。実機での確認は未実施です。
- 説明文の色に存在しないトークン `--dsw-alias-text-secondary` を使っていたため、灰色にならず本文と同じ色でした。設定欄をstockの設定行と同じ構成（項目名14px、説明12px `--dsw-alias-label-tertiary`、区切り線）に揃え、モード切り替えを等幅のセグメントにし、重複していた見出しを外します。ローカル導入などで自動更新できない状態は失敗ではないため、エラー色と `role=alert` を使いません。
- 設定ダイアログの「設定ファイルを開く」と閉じるボタンが独立した1行を占めていたため、タイトルと同じ行へ移します。
- `conversation.header.leading` は1件だけ表示される席です。デスクトップ表示で別のプラグインの表示を隠さないよう、モバイル表示中だけ登録します。優先度100で登録し、通常の登録（既定値0）を優先します。同じ優先度だとDSHは重複登録エラーにするため、既定値のまま登録しません。別の登録が優先された場合は、上部バーのメニューが残ります。
- タッチ後に `:hover` の背景が残らないよう、ボタンのhover表示を `(hover:hover)` に限定します。
- ドロワーは上部バーがない画面ではステータスバーの下まで覆います。

幅1024px以上で「オン」にした場合（iPad横向きなど）、DSHはデスクトップ用のサイドバー幅の設定を使うため、最初の表示でドロワーが開いていることがあります。一度閉じるとDSHがその状態を保存するので、プラグインからは変更しません。

## 内部DOMへの依存

公開slotとserviceでできない表示変更だけ、`data-slot=root/sidebar/main`、`data-sidebar-collapsed`、`data-sidebar-right-panel/open`、`data-shortcut-modal=settings`、`data-slot="conversation.header"` の直下の `header`、`data-conversation-tabs`、`data-conversation-header-leading`、`data-composer-seat`、`.md-table-wide` とその直接のラッパーを利用します。hashed class名やReact fiberには依存しません。公式にモバイルpresentation APIができたら、このCSS seamをそちらに置き換えるのが望ましいです。

上部バー表示中の右パネルのcloseは既存toggleを押します。会話画面では右パネル自身のtoggleで閉じます。`layout.closeRightbar()`だけを呼ぶと、列の予約状態と右パネル本体のexpanded状態がずれるためです。

モバイル変更は `html[data-dsh-mobile]` 内に限定します。解除時はobserver、イベント、購読、viewport変数、inertを片付けます。head補完は自分が変更した属性だけ復元し、その後他の所有者が変更した値は上書きしません。

## 再現可能な検証

```sh
npm ci --ignore-scripts
npm test
npm install --global @deepseek-ai/dsh@0.2.1-alpha.3 pnpm@11.28.5
npx playwright install --with-deps chromium
npm pack --ignore-scripts
npm run test:browser
```

ブラウザ検証は使い捨てのDSH_HOMEと、スクリプト内のローカルスタブ（固定のMarkdown応答を1件返す）を使います。既存のユーザープロファイルや実モデルAPIを利用しません。スクリーンショットはテストの一時ディレクトリに出力し、GitHub Actionsでは画像のみをartifactに保存します。認証URLを含む起動ログはartifactに含めません。

検証対象: 320/360/390/600/1280px、767/768px境界、横向きのタッチ端末、会話ヘッダーのメニューと上部バーの切り替え、横スクロールする表、モバイル設定の永続化、Settings、左右パネル、セッション／Pluginsの再選択、Escape、ライト／ダーク、reduced motion、デスクトップ復帰、認証された更新API、ブラウザが選ぶmanifest、PNG寸法とAppleアイコンのdecode、head補完と復元。成功／失敗の実行結果はPRとActionsを参照してください。

## 導入時の確認

設定の「PWA・モバイル」→「ホーム画面に追加」に、アイコンと確認結果を表示します。インストールボタンはブラウザがbeforeinstallpromptを提供した場合だけ表示します。iPhone/iPadではSafariの共有メニューから追加します。ブラウザのaccepted応答を、インストール完了の通知と混同しません。

通常のLAN内HTTPアドレスはPWAのsecure contextではありません。HTTPSのアドレスが必要です（開発用localhostを除く）。proxy側がmanifestやPNGをログインHTMLへ置き換えたり、外部へredirectした場合は、設定確認を失敗として表示します。CORSや認証を緩めて回避しません。

Service Workerや会話のoffline cacheは追加しません。既存のworkerやcacheも削除しません。この修正は、オフラインで会話・ツールを実行できるようにするものではありません。

iPhone/Androidの実機ホーム画面への導入、OSキーボード、ユーザーのHTTPS／proxy環境、他社テーマpluginとの併用は自動検証で保証していません。特に実機インストール完了はブラウザのheadlessテストだけでは証明できません。
