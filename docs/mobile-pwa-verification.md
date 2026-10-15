# Mobile UI / PWA修正の検証メモ

## 照合した公式DSH

ソース参照: `deepseek-ai/deepseek-harness@571902028a75c64c1d767f4ae5fd099485f0ddf0`。
ブラウザ実行対象: npmで公開された `@deepseek-ai/dsh@0.2.1-alpha.3`。
ソースHEADをビルドした検証と、公開済みパッケージでの検証は同一ではありません。

参照箇所は `packages/client/ui-layout/src/client/{AppFrame.tsx,AppFrame.module.css,service.ts}`、`packages/client/ui-sidebar-right/src/client/shell/SidebarRight{.tsx,.module.css}`、`packages/client/ui-settings-general/src/client/SettingsRoot{.tsx,.module.css}`、`packages/host/{webserver,frontend-static}/src/index.ts`、`apps/web/index.html` です。

## 問題と修正

旧モバイル表示は、公式の3カラムgridを残したまま中央を左右にtranslateしていました。右パネルも88vwに制限し、ファイル画面の幅をさらに減らしていました。これをスマホでは単一カラム＋左オーバーレイ＋右全幅にします。会話やセッションを再マウントせず、layout serviceと右パネルの既存操作を使います。

浮いたメニューボタンは会話ヘッダーにしか余白を設けておらず、Pluginsなど別のメイン画面と衝突する構成でした。専用ヘッダーへ操作を分離し、safe-area、44pxのボタン、Escape、フォーカス復帰、背面のinertを追加します。Settingsも外枠からスクロール領域まで狭い画面に収めます。

会話全体のsubtreeを監視していたMutationObserverは削除します。公式のpanelInfo購読、フレーム属性と右パネルの監視に限定し、ストリーミング本文の追加を契機にサイドバー全体を調べません。

PNGアイコンは修正前から同梱され、独立した公式DSH環境でも200応答とサイズを確認できました。「画像ファイルが存在しない」ことが全環境での原因ではありません。一方、plugin自身のmanifestリンクとインストールUIがなく、既に開いているページでpluginを有効にしてもserver-sideのApple用head注入は反映されませんでした。manifestの明示、stockリンクとの重複整理、hot enable時のhead補完、アイコンのプレビュー、導入方法と到達性の表示を追加します。

## 内部DOMへの依存

公開slotとserviceでできない表示変更だけ、`data-slot=root/sidebar/main`、`data-sidebar-collapsed`、`data-sidebar-right-panel/open`、`data-shortcut-modal=settings` とその直接のラッパーを利用します。hashed class名やReact fiberには依存しません。公式にモバイルpresentation APIができたら、このCSS seamをそちらに置き換えるのが望ましいです。

右パネルのcloseは既存toggleを押します。`layout.closeRightbar()`だけを呼ぶと、列の予約状態と右パネル本体のexpanded状態がずれるためです。

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

ブラウザ検証は使い捨てのDSH_HOMEとダミーAPI接続先を使います。既存のユーザープロファイルや実モデルAPIを利用しません。スクリーンショットはテストの一時ディレクトリに出力し、GitHub Actionsでは画像のみをartifactに保存します。認証URLを含む起動ログはartifactに含めません。

検証対象: 320/360/390/600/1280px、767/768px境界、モバイル設定の永続化、Settings、左右パネル、セッション／Pluginsの再選択、Escape、ライト／ダーク、reduced motion、デスクトップ復帰、認証された更新API、ブラウザが選ぶmanifest、PNG寸法とAppleアイコンのdecode、head補完と復元。成功／失敗の実行結果はPRとActionsを参照してください。

## 導入時の確認

設定の「PWA・モバイル」→「ホーム画面に追加」に、アイコンと確認結果を表示します。インストールボタンはブラウザがbeforeinstallpromptを提供した場合だけ表示します。iPhone/iPadではSafariの共有メニューから追加します。ブラウザのaccepted応答を、インストール完了の通知と混同しません。

通常のLAN内HTTPアドレスはPWAのsecure contextではありません。HTTPSのアドレスが必要です（開発用localhostを除く）。proxy側がmanifestやPNGをログインHTMLへ置き換えたり、外部へredirectした場合は、設定確認を失敗として表示します。CORSや認証を緩めて回避しません。

Service Workerや会話のoffline cacheは追加しません。既存のworkerやcacheも削除しません。この修正は、オフラインで会話・ツールを実行できるようにするものではありません。

iPhone/Androidの実機ホーム画面への導入、OSキーボード、ユーザーのHTTPS／proxy環境、他社テーマpluginとの併用は自動検証で保証していません。特に実機インストール完了はブラウザのheadlessテストだけでは証明できません。
