<!-- notes:en -->

# v0.4.2 — PWA & Mobile

The settings page no longer keeps the mobile drawer open, and plugin update text follows the UI language.

- Opening a modal dialog, including Settings from the account menu, closes the left drawer. Changing the main view does the same. One Escape closes the dialog and the drawer together.
- The update page does not show internal stage names such as `enable`.
- After a finished update, installing 0.4.0 again does not leave **Check for updates** disabled.
- Release notes render as Markdown. English and zh-CN use the English section. Japanese uses the Japanese section when dsh-japanese provides `ja`. An older note without language markers stays Japanese and is hidden in English and zh-CN.

Landscape header overlap and the settings-nav scroll adjustment are not in this version. Device checks did not reproduce them. A dark launch screen can stay white, and the icons are still served without an ETag.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHub source installs can also update from Settings. Restart DSH after an update. Local and tgz installs stay manual.

Japanese UI text needs [dsh-japanese](https://github.com/Aero123421/dsh-japanese).

## Known issues

- Home-screen install, the on-screen keyboard, and other iOS / Safari behavior are still unverified beyond the reported landscape checks.
- npm may fail to install DSH `0.2.1-rc.2` because of DSH's own dependencies.
- In dark mode the launch screen can stay white, and the PWA icons have no ETag.

<!-- notes:ja -->

# v0.4.2 — PWA・モバイル

設定を開いたときに残っていたドロワーを閉じ、更新ノートを表示中の言語で出します。

- アカウントメニューから設定を開いたときを含め、モーダルダイアログが出ると左ドロワーを閉じます。メイン画面が切り替わったときも閉じます。Escape 1回でダイアログとドロワーの両方が閉じます。
- 更新画面に `enable` などの内部段階名を出しません。
- 更新が終わったあと 0.4.0 を入れ直しても、「更新を確認」は押せます。
- リリースノートは Markdown として表示します。英語と zh-CN は英語の節、日本語は dsh-japanese が `ja` を定義しているときの日本語の節です。言語の印がない古いノートは日本語とみなし、英語と zh-CN では出しません。

横向きヘッダーの重なりと、設定ナビを幅に合わせてスクロールする変更は入っていません。実機では再現しませんでした。ダークでも起動画面が白くなることと、アイコンに ETag が無いことは残っています。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.2
```

GitHubソースから導入済みの場合は、設定画面の更新機能も利用できます。更新後はDSHを再起動してください。ローカル・tgz導入は手動更新です。

日本語の表示には [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。

## 既知の問題

- ホーム画面への追加、OSキーボード、その他の iOS / Safari の挙動は、報告された横向き確認以外は未検証です。
- npm で `0.2.1-rc.2` が入らない場合があります（DSH 本体の依存の問題）。
- ダークモードでも起動画面が白くなることがあり、PWA アイコンに ETag がありません。
