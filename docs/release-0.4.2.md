<!-- notes:en -->

# v0.4.2 — PWA & Mobile

Opening Settings closes the mobile drawer, and plugin update text follows the UI language.

- Opening Settings, or a modal dialog (`[role=dialog][aria-modal="true"]`), closes the left drawer. A confirmation or rename dialog opened from the drawer does not, so focus can return to the control that opened it. Changing the main view, including choosing another conversation, still closes the drawer. One Escape closes Settings and the drawer together. This does not depend on glass-ui.
- A successful update does not show the internal stage name. Other results still can.
- After a finished update, installing 0.4.0 again does not leave **Check for updates** disabled. `viewStatus` in `updates.js` treats an older installed bundle as idle, and `PluginUpdates.reconcile` does not keep a previously applied operation in the way.
- Release notes render as Markdown. `releaseNotes` splits `<!-- notes:en -->`, `<!-- notes:ja -->`, and `<!-- notes:zh -->`. `notesForLocale` shows the matching section. Japanese is the section for Japanese. A `zh` section is the section for zh and zh-CN. This release has no `zh` section, so those languages use the English section. An older note without language markers stays Japanese and is hidden for other languages.
- This plugin registers its `en` and `ja` dictionaries and does not define `ja`. 日本語表示には dsh-japanese が必要です。It does not register a `zh` dictionary. DSH's built-in `zh` language, whose document language is zh-CN, uses a `zh` dictionary when one is registered. With none, DSH shows the English copy and does not show message keys.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHub source installs can also update from Settings. Restart DSH after an update. Local and tgz installs stay manual.

Japanese for DSH needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- On DSH 0.2.1-rc.2, the control that moves down to the latest message overlaps Column D of a wide table. That control belongs to DSH. This plugin's mobile layout shows it at a width of 844px as well. This release does not change that control.
- `/open-in-app/icon/filemanager` responds with 404. That route belongs to DSH.
- iOS and Safari are unverified.
- In dark mode the launch screen can stay white, and the PWA icons have no ETag.
- npm may fail to install DSH `0.2.1-rc.2` because of DSH's own dependencies.

<!-- notes:ja -->

# v0.4.2 — PWA・モバイル

設定を開くとモバイルのドロワーを閉じ、更新ノートを表示中の言語で出します。

- 設定、または `[role=dialog][aria-modal="true"]` のダイアログが開くと左ドロワーを閉じます。ドロワーから開いた確認や名前変更は閉じません。フォーカスを戻す先を残すためです。別の会話を選ぶなど、メイン画面が切り替わったときも閉じます。Escape 1回で設定とドロワーの両方が閉じます。glass-ui には依存しません。
- 更新が成功したとき（applied）は内部の段階名を出しません。それ以外の結果では出すことがあります。
- 更新が終わったあと 0.4.0 を入れ直しても、「更新を確認」は押せます。`updates.js` の `viewStatus` は、導入版が実行版より古いとき idle にします。`PluginUpdates.reconcile` は、一度 applied になった操作が後の導入を止めないようにします。
- リリースノートは Markdown として表示します。`releaseNotes` が `<!-- notes:en -->`、`<!-- notes:ja -->`、`<!-- notes:zh -->` で分け、`notesForLocale` が一致する節を出します。日本語では日本語の節、zh と zh-CN では `zh` の節です。この版に `zh` の節はないので、その言語では英語の節になります。言語の印がない古いノートは日本語とみなし、それ以外の言語では出しません。
- このプラグインは en と ja の辞書を登録し、ja そのものは定義しません。日本語表示には dsh-japanese が必要です。zh の辞書は登録していません。DSH に最初からある言語 `zh`（文書の言語は zh-CN）は、zh の辞書が登録されていればそれを使い、無ければ英語を出します。メッセージキーは出しません。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHubソースから導入済みの場合は、設定画面の更新機能も利用できます。更新後はDSHを再起動してください。ローカル・tgz導入は手動更新です。

DSH を日本語にするには [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- DSH 0.2.1-rc.2 では、「下へ移動」ボタンが広い表の Column D に重なります。これは DSH 本体の挙動です。このプラグインのモバイル表示では、幅 844px でも出ます。今回はこのボタンは直しません。
- `/open-in-app/icon/filemanager` は 404 になります。これは DSH 本体の問題です。
- iOS と Safari は未確認です。
- ダークモードでも起動画面が白くなることがあり、PWA アイコンに ETag がありません。
- npm で `0.2.1-rc.2` が入らない場合があります（DSH 本体の依存の問題）。
