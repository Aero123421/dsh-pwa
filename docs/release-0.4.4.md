<!-- notes:en -->

# v0.4.4 — PWA & Mobile

Smoother touch scrolling, menus at their normal size, and Enter for new lines on phones.

## Changes

- Thinking and process groups expand inline on touch screens instead of scrolling inside a capped box. A swipe that starts on them now scrolls the conversation instead of stopping at the box edge, and DSH no longer pulls the conversation back to the latest reply while you drag during a streaming reply.
- The conversation no longer rubber-bands at its own ends on touch screens.
- On touch tablets, viewport height changes under 4px are ignored, and the app moves with the visual viewport only while a keyboard is open. Small viewport wobbles no longer shift the whole app on an iPad.
- An Android keyboard that resizes the window is detected while an input has focus, so the phone statistics row hides as on iOS.
- Menus and pickers (model, permission, +, `/`) keep DSH's own position, width and row height. v0.4.3 showed them full width and taller. While a keyboard is open or in compact landscape, their height is limited to the room above their anchor.
- In the mobile layout, plain Enter inserts a new line. Send with the send button or Ctrl/⌘+Enter. Enter picks a `/` or `@` suggestion only while one is highlighted. An IME commit that ends with a new line also becomes a new line instead of sending. The stock layout, including an iPad in Auto, keeps Enter-to-send.
- Inputs on touch screens, including search fields in pickers and the stock-layout iPad composer, use at least 16px text so iOS does not zoom the page when they gain focus.
- A pending focus return after a drawer dialog is cancelled when the mobile layout unmounts.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.4
```

GitHub source installs can also update from Settings. Restart DSH and reload the browser after updating. Local and tgz installs stay manual. Japanese needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- Expanded thinking makes the conversation longer. When a group first opens while a reply is streaming, DSH can still move the conversation to the latest reply before you touch it. Closing a group while reading it can replace the view with the reply below. Both come from DSH's own tail following.
- Menu rows are back to DSH's 34px height and are not enlarged to 44px. DSH positions the second-level model list against the full window height, so a very long model list can still extend under an iOS keyboard.
- Terminal output does not scroll with a finger. That belongs to DSH.
- Real iOS rubber-band, momentum, keyboards and IMEs, safe areas and screen readers need device verification. Browser emulation does not certify them.
- The mobile Off switch does not disable touch adjustments. These rules depend on DSH internal DOM markers.
- On DSH 0.2.1-rc.2, the control that moves down to the latest message overlaps Column D of a wide table, and `/open-in-app/icon/filemanager` responds with 404. Both belong to DSH.
- In dark mode the launch screen can stay white, and the PWA icons have no ETag.
- npm may fail to install DSH `0.2.1-rc.2` because of DSH's own dependencies.
- Adding or updating a plugin with pnpm 12 can fail with ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION and empty the profile's node_modules. Add and update plugins with pnpm 10. To recover, run `dsh plugin --profile web install` with pnpm 10.

<!-- notes:ja -->

# v0.4.4 — PWA・モバイル

タッチでのスクロールを滑らかにし、メニューを元の大きさに戻し、スマホでは Enter で改行するようにしました。

## 変更点

- **思考過程の表示**：タッチ端末では、思考過程やツールのグループを、高さに上限のある箱の中でスクロールさせず、会話の中にそのまま展開します。グループの上で始めたスワイプも会話を動かします。
  - 箱の端でスワイプが止まらなくなりました。
  - 回答の生成中に指で動かしても、最新の回答の位置へ引き戻されなくなりました。
- **会話の端**：タッチ端末では、会話の端で跳ね返らなくなりました。
- **タッチ対応のタブレット**：画面の高さの 4px 未満の変化は無視します。また、アプリが画面の表示範囲に合わせて動くのは、キーボードが開いているときだけにしました。これで、iPad で表示範囲が少し揺れても、アプリ全体がずれなくなりました。
- **Android のキーボード**：画面の高さを縮める Android のキーボードも、入力欄にフォーカスがあるあいだは検出します。iOS と同じように統計の行を隠します。
- **メニューとピッカー**（モデル・権限・＋・`/`）：DSH 本来の位置・幅・行の高さに戻しました。v0.4.3 では画面幅いっぱいに大きく表示していました。キーボードが開いているときと、低い横向きのときは、開いたボタンより上の空きに収まる高さに制限します。
- **Enter キー**：モバイル表示では、普通の Enter で改行します。送信は送信ボタンか Ctrl/⌘+Enter で行います。
  - `/` や `@` の候補を Enter で選ぶのは、候補がハイライトされているときだけです。
  - 日本語入力などで、改行で終わる確定も、送信せず改行にします。
  - 標準レイアウト（Auto の iPad を含む）は、Enter で送信のままです。
- **入力欄の文字の大きさ**：タッチ端末の入力欄は 16px 以上にしました。ピッカーの検索欄や、標準レイアウトの iPad の入力欄も含みます。これで iOS がフォーカス時に画面を拡大しなくなりました。
- **ドロワーのダイアログ**：ダイアログを閉じた後のフォーカスの戻しが保留中でも、モバイル表示を解除したときに取り消します。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.4
```

GitHub ソースから導入している場合は、設定画面からも更新できます。更新後は DSH を再起動し、ブラウザーを再読み込みしてください。ローカル・tgz で導入した場合は手動で更新してください。日本語表示には [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- **思考過程を展開した会話**：会話が長くなります。次の2点は DSH 本体の末尾追従によるものです。
  - 回答の生成中に初めてグループを開くと、指を触れる前に DSH が最新の回答の位置へ移動することがあります。
  - 読んでいる途中でグループを閉じると、下の回答に表示が切り替わります。
- **メニューの行の高さ**：DSH 本来の 34px に戻したため、44px にはしていません。DSH は2段目のモデル一覧の位置をウィンドウ全体の高さで決めるため、モデルがとても多いと iOS のキーボードの下まで伸びることがあります。
- **terminal**：出力は指でスクロールできません。DSH 本体の問題です。
- **実機での確認**：iOS 実機の跳ね返り・慣性・キーボードと IME・safe-area・スクリーンリーダーは、実機での確認が必要です。ブラウザーのエミュレーションでは保証できません。
- **モバイル表示の「オフ」**：オフにしてもタッチ向けの調整は残ります。これらの調整は DSH 内部の DOM の目印に依存しています。
- **DSH 0.2.1-rc.2 の問題**：次の2点は DSH 本体の問題です。
  - 「下へ移動」ボタンが、広い表の Column D に重なります。
  - `/open-in-app/icon/filemanager` が 404 になります。
- **起動画面とアイコン**：ダークモードでも起動画面が白いことがあります。PWA アイコンに ETag がありません。
- **npm での導入**：npm で `0.2.1-rc.2` が入らない場合があります（DSH 本体の依存の問題）。
- **pnpm 12**：プラグインの追加・更新が ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION で失敗し、プロファイルの node_modules が空になることがあります。
  - プラグインの追加・更新は pnpm 10 で行ってください。
  - 壊れたときは、pnpm 10 で `dsh plugin --profile web install` を実行すると元に戻ります。
