<!-- notes:en -->

# v0.4.5 — PWA & Mobile

Typing in the terminal on a phone or iPad no longer fills it with stray line breaks.

## Changes

- While the terminal has focus and an on-screen keyboard overlays the page (iOS, iPadOS, and Chrome or Firefox on Android by default), the app keeps its full height instead of shrinking above the keyboard. The terminal therefore keeps its size, and the shell is no longer resized each time the keyboard opens or closes. Each resize used to make the shell reprint its prompt, which looked like stray line breaks. The browser pans to the cursor line instead, as in stock DSH.
- Other inputs, such as the composer and dialogs, still fit above the keyboard as in v0.4.4.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.5
```

GitHub source installs can also update from Settings. Restart DSH and reload the browser after updating. Local and tgz installs stay manual. Japanese needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- With a keyboard that resizes the whole window (Android with `interactive-widget=resizes-content`, which neither DSH nor this plugin sets), the terminal still resizes with the keyboard. Stock DSH behaves the same.
- While typing in the terminal, the browser's pan can move the header out of view until the keyboard closes.
- Terminal output does not scroll with a finger. That belongs to DSH.
- Expanded thinking makes the conversation longer, and DSH can still move to the latest reply when a group first opens while a reply is streaming.
- Real iOS rubber-band, momentum, keyboards and IMEs, safe areas and screen readers need device verification. Browser emulation does not certify them.
- The mobile Off switch does not disable touch adjustments. These rules depend on DSH internal DOM markers.
- On DSH 0.2.1-rc.2, the control that moves down to the latest message overlaps Column D of a wide table, and `/open-in-app/icon/filemanager` responds with 404. Both belong to DSH.
- Adding or updating a plugin with pnpm 12 can fail with ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION and empty the profile's node_modules. Add and update plugins with pnpm 10. To recover, run `dsh plugin --profile web install` with pnpm 10.

<!-- notes:ja -->

# v0.4.5 — PWA・モバイル

スマホや iPad でターミナルに入力すると、謎の改行だらけになる問題を直しました。

## 変更点

- **ターミナル入力中は、アプリの高さを縮めない**
  - 対象：ターミナルにフォーカスがあり、画面に重なるタイプのキーボードが出ているとき。iOS・iPadOS と、Android の Chrome・Firefox の標準の動作が当てはまります。
  - これまではキーボードの上に収まるようアプリを縮めていました。そのたびにターミナルの大きさが変わり、シェルの画面サイズが変わってプロンプトが描き直されていました。これが謎の改行に見えていました。
  - これからはアプリの高さを保ちます。キーボードを開いたり閉じたりしてもターミナルの大きさは変わらず、シェルもサイズ変更されません。
  - カーソルの行は、DSH 本来の動きと同じく、ブラウザーが画面をずらして見える位置に表示します。
- **ほかの入力欄は v0.4.4 と同じ**：入力欄やダイアログは、これまでどおりキーボードの上に収まります。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.5
```

GitHub ソースから導入している場合は、設定画面からも更新できます。更新後は DSH を再起動し、ブラウザーを再読み込みしてください。ローカル・tgz で導入した場合は手動で更新してください。日本語表示には [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- **画面全体を縮めるタイプのキーボード**：Android で `interactive-widget=resizes-content` を指定している場合です。DSH もこのプラグインも、この指定はしていません。この場合は、キーボードに合わせてターミナルの大きさが変わります。DSH 本体だけでも同じ動きです。
- **ターミナル入力中のヘッダー**：ブラウザーが画面をずらすため、キーボードを閉じるまでヘッダーが見えなくなることがあります。
- **ターミナルの指スクロール**：ターミナルの出力は指でスクロールできません。DSH 本体の問題です。
- **思考過程を展開した会話**：会話が長くなります。回答の生成中にグループを初めて開くと、DSH が最新の回答へ移動することがあります。
- **実機での確認**：iOS 実機の跳ね返り・慣性・キーボードと IME・safe-area・スクリーンリーダーは、実機での確認が必要です。ブラウザーのエミュレーションでは保証できません。
- **モバイル表示の「オフ」**：オフにしても、タッチ向けの調整は残ります。これらの調整は、DSH 内部の DOM の目印に依存しています。
- **DSH 0.2.1-rc.2 の問題**：次の2点は DSH 本体の問題です。
  - 「下へ移動」ボタンが、広い表の Column D に重なります。
  - `/open-in-app/icon/filemanager` が 404 になります。
- **pnpm 12**：プラグインの追加・更新が ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION で失敗し、プロファイルの node_modules が空になることがあります。追加・更新は pnpm 10 で行ってください。壊れたときは、pnpm 10 で `dsh plugin --profile web install` を実行すると元に戻ります。
