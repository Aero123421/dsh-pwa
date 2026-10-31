<!-- notes:en -->

# v0.4.6 — PWA & Mobile

## Changes

- Fix landscape conversation tabs on newer DSH builds while retaining the older layout.
- Preserve other plugins' history wrappers during cleanup, and distinguish an installation prompt failure or stale update candidate from other errors.
- Report unreachable update checks accurately. Only claim a previous version was restored when the manager result and installed version confirm it; unblock checks after replacing a restart-required version, and report interrupted preparation.
- Match DSH's compatibility evaluator when checking update candidates, including the precedence of `engines.dsh` over peer dependencies.

## Install

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.6
```

GitHub source installations can also update from Settings. Restart DSH and reload the browser after updating; local and tgz installations require manual updates. DSH 0.2.2-alpha.2 includes Japanese; older checked versions need [dsh-japanese](https://github.com/Aero123421/dsh-japanese). Do not combine its older 0.2.3 language pack with the newer built-in dictionaries.

## Limits and known issues

- Browser emulation is not verification of real iOS/iPadOS devices, keyboards, IMEs, safe areas, screen readers, or all plugin combinations. Mobile styling depends on internal DSH DOM markers. There is no service worker or offline application support.
- Install-prompt failure and network/restore failure paths are covered by tests, not all by real browser interaction or live failure injection. See the [compatibility results](https://github.com/Aero123421/dsh-pwa/blob/v0.4.6/docs/dsh-compatibility-2026-10-29.md) for the dated version matrix and limits.
- pnpm 12 can fail on minimum release age and leave the profile's node_modules empty when adding or updating plugins. Use pnpm 10; if affected, run `dsh plugin --profile web install` with pnpm 10. See also the known issues in [v0.4.5](https://github.com/Aero123421/dsh-pwa/releases/tag/v0.4.5).

<!-- notes:ja -->

# v0.4.6 — PWA・モバイル

## 変更点

- 新しい DSH の横向き会話タブの配置を修正し、旧版の配置も維持しました。
- 解除時に他プラグインの history ラッパーを外さないようにしました。インストール確認の失敗や古くなった更新候補も、別のエラーと区別します。
- 更新確認の通信失敗を正しく表示します。復旧結果と導入版を確認できた場合だけ以前の版に戻ったと表示し、再起動待ちの版を入れ替えた後の更新確認と、準備中の中断の判定を修正しました。
- 更新候補の DSH 互換性判定を本体と合わせ、`engines.dsh` を peer dependencies より優先します。

## 導入・更新

```sh
dsh plugin --profile web add -w github:Aero123421/dsh-pwa#v0.4.6
```

GitHub ソース導入では設定からも更新できます。更新後は DSH を再起動し、ブラウザーを再読み込みしてください。ローカル・tgz 導入は手動更新です。DSH 0.2.2-alpha.2 は日本語を内蔵し、それ以前の検証対象版では [dsh-japanese](https://github.com/Aero123421/dsh-japanese) が必要です。古い 0.2.3 言語パックと新しい内蔵辞書は併用しないでください。

## 限界・既知の問題

- ブラウザーのエミュレーションは iOS/iPadOS 実機、キーボード、IME、safe-area、スクリーンリーダー、全プラグインの組合せを保証しません。モバイル表示は DSH 内部の DOM に依存します。サービスワーカーやオフライン動作はありません。
- インストール確認の失敗や通信・復旧失敗はテストで検証しましたが、すべて実ブラウザー操作や実障害の注入で再現したわけではありません。対象版と制約は[互換性の記録](https://github.com/Aero123421/dsh-pwa/blob/v0.4.6/docs/dsh-compatibility-2026-10-29.md)を参照してください。
- pnpm 12 は最低公開経過時間の制限でプラグインの追加・更新に失敗し、プロファイルの node_modules が空になることがあります。pnpm 10 を使ってください。影響を受けた場合は pnpm 10 で `dsh plugin --profile web install` を実行します。その他の既知の問題は [v0.4.5](https://github.com/Aero123421/dsh-pwa/releases/tag/v0.4.5) も参照してください。
