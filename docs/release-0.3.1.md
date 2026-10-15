# v0.3.1 — PWA & Mobile

## 修正した Issue

- #9 自己更新で旧版を外したあと新しい版の導入が失敗すると、プラグインが消えたままになる問題を修正しました。外す前の導入元と有効状態を退避し、導入が失敗してパッケージが一覧から消えていることを確認できた場合は、以前の版を入れ直します。入れ直せた場合は設定画面に「以前の版を入れ直した」と表示します。入れ直しにも失敗した場合は、プラグインが外れている可能性と、GitHub Releases から入れ直す方法を表示します。取消（cancelled）と上書き（overridden）は復元しません。
- #10 PWA マニフェストに maskable アイコン（`icon-192-maskable.png`、`icon-512-maskable.png`）を追加しました。既存の `purpose: any` の 192/512 アイコンはそのまま残します。

あわせて、DSH 0.2.x の peer 範囲（`>=0.2.1-alpha.2 <0.3.0-0`）と、HMR が有効な DSH で `already-installed` が返る場合の自己更新に対応しました（旧ドラフト PR #8 の内容を #11 に取り込み）。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.3.1
```

既存の GitHub ソース導入では設定画面の更新機能も利用できます。導入後は DSH を再起動してください。

## 検証

- `npm test`: 46 件成功。
- DSH `0.2.1-alpha.2` / `0.2.1-alpha.3` で配布 tgz を導入し、2 回の起動とも成功しました。
- Android 実機の適応アイコン、iPadOS / Chrome のホーム画面追加、実 DSH での復元操作は未検証です。

[変更内容](https://github.com/Aero123421/dsh-pwa/pull/11)
