<!-- notes:en -->

# v0.4.2 — PWA & Mobile

Opening Settings closes the mobile drawer, and plugin update text follows the UI language.

- Opening Settings, or a modal dialog (`[role=dialog][aria-modal="true"]`), closes the left drawer. A confirmation or rename dialog opened from the drawer does not, so focus can return to the control that opened it. Changing the main view, including choosing another conversation, still closes the drawer. One Escape closes Settings and the drawer together. This does not depend on glass-ui.
- A successful update does not show the internal stage name. Other results still can.
- After a finished update, installing 0.4.0 again does not leave **Check for updates** disabled. `viewStatus` in `updates.js` treats an older installed bundle as idle, and `PluginUpdates.reconcile` does not keep a previously applied operation in the way.
- Release notes render as Markdown. `releaseNotes` splits `<!-- notes:en -->` and `<!-- notes:ja -->`. `notesForLocale` and `ReleaseNotes` in `client.js` show the English section for English and zh-CN, and the Japanese section for Japanese. An older note without language markers stays Japanese and is hidden in English and zh-CN.
- This plugin registers its `ja` dictionary and does not define the language. 日本語表示には dsh-japanese が必要です。There is no Chinese dictionary. zh-CN uses the English copy, not message keys.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHub source installs can also update from Settings. Restart DSH after an update. Local and tgz installs stay manual.

Japanese for DSH needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- On DSH 0.2.1-rc.2 at 844×390, the control that moves down to the latest message overlaps the table. That control belongs to DSH.
- iOS and Safari are unverified.
- In dark mode the launch screen can stay white, and the PWA icons have no ETag.
- npm may fail to install DSH `0.2.1-rc.2` because of DSH's own dependencies.

<!-- notes:ja -->

# v0.4.2 — PWA・モバイル

設定を開くとモバイルのドロワーを閉じ、更新ノートを表示中の言語で出します。

- 設定、または `[role=dialog][aria-modal="true"]` のダイアログが開くと左ドロワーを閉じます。ドロワーから開いた確認や名前変更は閉じません。フォーカスを戻す先を残すためです。別の会話を選ぶなど、メイン画面が切り替わったときも閉じます。Escape 1回で設定とドロワーの両方が閉じます。glass-ui には依存しません。
- 更新が成功したとき（applied）は内部の段階名を出しません。それ以外の結果では出すことがあります。
- 更新が終わったあと 0.4.0 を入れ直しても、「更新を確認」は押せます。`updates.js` の `viewStatus` は、導入版が実行版より古いとき idle にします。`PluginUpdates.reconcile` は、一度 applied になった操作が後の導入を止めないようにします。
- リリースノートは Markdown として表示します。`releaseNotes` が `<!-- notes:en -->` と `<!-- notes:ja -->` で分け、`client.js` の `notesForLocale` と `ReleaseNotes` が、英語と zh-CN では英語の節、日本語では日本語の節を出します。言語の印がない古いノートは日本語とみなし、英語と zh-CN では出しません。
- このプラグインは ja の辞書を登録し、言語そのものは定義しません。日本語表示には dsh-japanese が必要です。中国語の辞書はありません。zh-CN では英語になり、メッセージキーは出しません。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHubソースから導入済みの場合は、設定画面の更新機能も利用できます。更新後はDSHを再起動してください。ローカル・tgz導入は手動更新です。

DSH を日本語にするには [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- DSH 0.2.1-rc.2 の 844×390 では、最新のメッセージへ下へ移動するボタンが表に重なります。このボタンは DSH 本体のものです。
- iOS と Safari は未確認です。
- ダークモードでも起動画面が白くなることがあり、PWA アイコンに ETag がありません。
- npm で `0.2.1-rc.2` が入らない場合があります（DSH 本体の依存の問題）。
