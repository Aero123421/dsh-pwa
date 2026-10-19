<!-- notes:en -->

# v0.4.2 — PWA & Mobile

The mobile header stays above the first message, Settings closes the drawer, and plugin update text follows the UI language.

- On a phone, the conversation header sticks to the top with the page background, so the first message's rectangle does not sit under it.
- Opening Settings, or any dialog, closes the left drawer. Changing the main view does the same. One Escape closes the dialog and the drawer together. This does not depend on glass-ui.
- Opening Settings scrolls the selected navigation item into view.
- A successful update does not show the internal stage name. Other results still can.
- After a finished update, installing 0.4.0 again does not leave **Check for updates** disabled.
- Release notes render as Markdown. English and zh-CN use the English section. Japanese uses the Japanese section. An older note without language markers stays Japanese and is hidden in English and zh-CN.
- **日本語** appears in the language list from this plugin. There is no Chinese dictionary; zh-CN shows the English copy. The rest of DSH still needs dsh-japanese for Japanese.

The light `theme-color` is `#ffffff`. Icon caching is unchanged. A dark launch screen can stay white, and the icons are still served without an ETag.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHub source installs can also update from Settings. Restart DSH after an update. Local and tgz installs stay manual.

This plugin adds 日本語 to the language list. Japanese for the rest of DSH needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- Home-screen install, the on-screen keyboard, and other iOS / Safari behavior are still unverified beyond the reported landscape checks.
- npm may fail to install DSH `0.2.1-rc.2` because of DSH's own dependencies.
- In dark mode the launch screen can stay white, and the PWA icons have no ETag.

<!-- notes:ja -->

# v0.4.2 — PWA・モバイル

モバイルのヘッダーを最初のメッセージの上に置き、設定を開くとドロワーを閉じ、更新ノートを表示中の言語で出します。

- 会話ヘッダーは画面上部に残り、ページの背景色です。最初のメッセージの矩形はヘッダーと重なりません。
- 設定、またはほかのダイアログが開くと左ドロワーを閉じます。メイン画面が切り替わったときも閉じます。Escape 1回でダイアログとドロワーの両方が閉じます。glass-ui には依存しません。
- 設定を開くと、選択中の項目がナビの表示範囲に入ります。
- 更新が成功したとき（applied）は内部の段階名を出しません。それ以外の結果では出すことがあります。
- 更新が終わったあと 0.4.0 を入れ直しても、「更新を確認」は押せます。
- リリースノートは Markdown として表示します。英語と zh-CN は英語の節、日本語は日本語の節です。言語の印がない古いノートは日本語とみなし、英語と zh-CN では出しません。
- 言語の一覧に「日本語」を足します。中国語の辞書はなく、zh-CN では英語です。DSH 本体の日本語には dsh-japanese が必要です。

ライトの `theme-color` は `#ffffff` です。アイコンのキャッシュは変えていません。ダークでも起動画面が白くなることと、アイコンに ETag が無いことは残っています。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHubソースから導入済みの場合は、設定画面の更新機能も利用できます。更新後はDSHを再起動してください。ローカル・tgz導入は手動更新です。

このプラグインは言語一覧に日本語を足します。DSH 本体を日本語にするには [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- ホーム画面への追加、OSキーボード、その他の iOS / Safari の挙動は、報告された横向き確認以外は未検証です。
- npm で `0.2.1-rc.2` が入らない場合があります（DSH 本体の依存の問題）。
- ダークモードでも起動画面が白くなることがあり、PWA アイコンに ETag がありません。
