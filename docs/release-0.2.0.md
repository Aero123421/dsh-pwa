# v0.2.0 の配布準備

最初の版付き Release は `v0.2.0` を予定しています。この変更ではタグ・Release を公開せず、レビュー後にリポジトリの管理者が、確認した commit にタグを付けて Release を作成します。配布は従来どおり GitHub のソースで、Release に tgz があることを更新機能の前提にしません。

## 変更

- DSH の `settings.section` に PWA 項目を追加しました。共通 React と標準 Button を使う素の JavaScript Client entry で、製品の build / prepare は不要です。
- 更新確認と導入を別操作にし、Release 未作成・API 失敗・更新なし・非対応 DSH・導入失敗・再起動待ち・実行版確認済みを区別します。
- 固定 repository の正式 Release だけを選び、タグ内の package・版・対応 DSH・Host / Client entry・bundle patch・3 つの PNG を検証してから DSH manager に渡します。任意 URL や shell は画面から受け取りません。
- 操作 ID は最初の request 前に確定し、Host は現在の profile に専用記録を保存します。複数の Client、応答喪失、再接続、自己解除後は同じ操作を照合し、結果不明なら再送しません。
- OFF 状態を維持し、manager がない・read-only・GitHub ソース以外の場合は手動更新を案内します。保存などの awaited I/O 後も解除状態と導入済み版を再確認します。

manifest identity・start_url・scope・アイコンと URL は維持します。ホーム画面アイコンの反映とプラグイン更新は別です。service worker を追加せず、他の worker や cache を操作しません。モデル・認証・設定・システムプロンプト・接続先の許可規則は変更しません。

## 検証記録

- `npm ci --ignore-scripts`: この checkout の開発依存を導入。
- `npm test`: 30 件が成功。Node の単体検査。静的 route、optional services、route の解除、Release metadata、導入結果、複数 Client / profile、自己解除、結果不明を確認。
- `node --check index.js` / `updates.js` / `client.js`: 配布 JavaScript の構文検査。
- `npm pack --ignore-scripts`: package / patch / Host / Client / PNG が公開形式に含まれることを確認。tgz は検証用で、更新先をソースから tgz に自動変更しません。
- `npm run test:browser`: npm 版 DSH 0.2.1-alpha.2 のクリーンな profile への tgz 導入、再起動後の実行版、認証拒否、manifest / PNG、日本語の標準 UI を 1280px / 600px / 390px で確認する検査。
- `npm run test:browser -- github:Aero123421/dsh-pwa#<確認した commit>`: 同じ配布ソースを GitHub の固定 commit から導入し、公開 Release 未作成の表示と API を確認する検査。

ローカル tgz は初回起動・再起動ともに全 3 幅で成功しました。GitHub 固定 commit の導入結果と正確な commit は PR に記録します。公開タグからの導入は Release 作成後の確認が必要です。実機 iOS / iPadOS / Android、Cloudflare / Tailscale の実環境、実際の自己更新による差し替えは未検証です。
