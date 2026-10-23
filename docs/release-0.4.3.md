<!-- notes:en -->

# v0.4.3 — PWA & Mobile

Touch improvements on top of the published v0.4.2 layout and settings UI.

## Changes

- Touch adjustments also apply to tablets using the stock layout, independently of the mobile switch. Page overscroll is suppressed, conversations contain vertical chaining, and wide tables pan sideways. Coarse-primary width handles pass swipes through; finger resizing is unavailable. Double-tap zoom is disabled, but pinch zoom and DSH's explicit touch-action rules are retained.
- Visual-viewport height and pan tracking now also covers touch tablets. Android's resizing keyboard is detected while an input has focus, and phone statistics hide when the keyboard is detected; compact landscape keeps the header/menu, hides tabs/statistics and uses a one-row composer. Tall drafts and trigger/model/permission pickers fit the visible viewport.
- Modal surfaces follow the visible viewport and pan offset. Obscured focused modal inputs scroll into view. Question footers wrap and narrow provider tabs share equal-width columns.
- Sidebar actions no longer require hover. Phone rows/menu items, main composer controls, message/code/process/tool actions, file/document/zoom controls and PWA settings gain 44px touch targets; settings switches keep their visual track size. The PWA mode buttons wrap instead of overlapping in narrow settings. Phone pin/archive actions remain in the … menu.
- Reselecting a search result and reusing a workspace's New session draft close the drawer even without a route change.
- Escape closes the right panel when no modal/menu owns it and returns focus to the header/fallback menu. A right panel cannot leave a hidden left drawer open. Existing v0.4.2 dialog and route handling is retained, and a pending focus return after a drawer dialog is cancelled when the mobile layout unmounts.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.3
```

GitHub source installs can also update from Settings. Restart DSH and reload the browser after updating. Local and tgz installs stay manual. Japanese needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- The mobile Off switch does not disable touch adjustments. These rules depend on DSH internal DOM markers. Not every small DSH control is enlarged, and terminal finger-scrolling is outside this change.
- Actual keyboard/IME, safe areas, screen readers and native rubber-band physics require real-device verification; browser emulation does not certify them.
- On DSH 0.2.1-rc.2, the control that moves down to the latest message overlaps Column D of a wide table. That control belongs to DSH. This plugin's mobile layout shows it at a width of 844px as well. This release does not change that control.
- `/open-in-app/icon/filemanager` responds with 404. That route belongs to DSH.
- Physical iOS devices and Safari OS keyboard/home-screen behavior are unverified.
- In dark mode the launch screen can stay white, and the PWA icons have no ETag.
- npm may fail to install DSH `0.2.1-rc.2` because of DSH's own dependencies.
- Adding or updating a plugin with pnpm 12 can fail with ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION when the profile lockfile includes a dependency published less than 24 hours ago. pnpm then empties that profile's node_modules and does not restore DSH, so every plugin in the profile fails to load. Add and update plugins with pnpm 10. To recover, run `dsh plugin --profile web install` with pnpm 10. pnpm 11 stops with ERR_PNPM_UNEXPECTED_STORE and leaves node_modules intact.

<!-- notes:ja -->

# v0.4.3 — PWA・モバイル

公開済み v0.4.2 の会話ヘッダーと設定 UI を保ち、タッチ操作を改善します。

## 変更点

- タッチ修正をモバイル設定から分離し、標準レイアウトのタブレットにも適用。ページの overscroll を抑え、会話の縦連鎖を contain にし、表を横へ動かせます。タッチ主体の幅ハンドルはスワイプを素通しするため、指で幅調整できません。ダブルタップ拡大は無効、ピンチと本体の明示的 touch-action は保持します。
- visualViewport の高さと pan への追従をタブレットへ拡張。Android のサイズが変わるキーボードも入力中に検出し、スマホのキーボード検出中は統計を隠します。低い横長画面ではヘッダーとメニューを残し、タブ/統計を隠して入力欄を1行化。長文入力と候補/model/permission picker を可視高に収めます。
- modal の外枠を可視高と pan に追従させ、隠れた入力を見える位置へスクロール。質問 footer を折り返し、狭い provider タブを等幅にします。
- sidebar 行操作を hover なしで表示。スマホ行/メニュー、入力欄主操作、メッセージ/コード/process/tool、file/document/zoom、PWA 設定を44px化。設定スイッチは見た目を保って当たり判定だけを拡張し、スマホの pin/archive は … メニューにまとめます。狭い設定でも PWA のモード切替ボタンは重ならず折り返します。
- 検索結果の再選択や workspace 内の New session draft 再利用でも、route が変わらなくてもドロワーを閉じます。
- modal/menu がないとき Escape で右パネルを閉じ、ヘッダー/上部バーのメニューへフォーカスを戻します。右の裏に開いた左ドロワーを残しません。v0.4.2 のダイアログ・route による閉鎖は保持し、ドロワーのダイアログ後の遅延フォーカス復帰はモバイル表示の解除時に取り消します。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.3
```

GitHub ソース導入は設定画面からも更新できます。更新後は DSH を再起動し、ブラウザーを再読み込みしてください。ローカル・tgz は手動更新です。日本語には [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- モバイルの「オフ」でもタッチ修正は残ります。DSH 内部 DOM に依存します。すべての小さい操作を拡大したわけではなく、terminal の指スクロールは対象外です。
- 実キーボード/IME、safe-area、スクリーンリーダー、ラバーバンドは実機での確認が必要です。エミュレーションでは保証しません。
- DSH 0.2.1-rc.2 では、「下へ移動」ボタンが広い表の Column D に重なります。これは DSH 本体の挙動です。このプラグインのモバイル表示では、幅 844px でも出ます。今回はこのボタンは直しません。
- `/open-in-app/icon/filemanager` は 404 になります。これは DSH 本体の問題です。
- iOS 実機と Safari の OS キーボード・ホーム画面動作は未確認です。
- ダークモードでも起動画面が白くなることがあり、PWA アイコンに ETag がありません。
- npm で `0.2.1-rc.2` が入らない場合があります（DSH 本体の依存の問題）。
- pnpm 12 でプラグインを追加・更新すると、プロファイルの lockfile に公開から24時間たっていない依存が含まれている場合、ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION で失敗することがあります。このとき pnpm がプロファイルの node_modules を空にし、DSH も元に戻さないため、同じプロファイルのすべてのプラグインが読み込まれなくなります。プラグインの追加・更新は pnpm 10 で行ってください。壊れたときは pnpm 10 で `dsh plugin --profile web install` を実行すると戻ります。pnpm 11 では ERR_PNPM_UNEXPECTED_STORE で止まりますが、node_modules は壊れません。
