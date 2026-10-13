/* Source-distributed client: DSH supplies the shared React and native Button. */
window.__ModuleLoader__.load({ id: 'dsh-pwa', factory(require) {
  const React = require('react')
  const { Button } = require('@deepseek-ai/dsh-client-ui-primitives')
  const h = React.createElement, NS = 'dsh.pwa'
  const copy = {
    en: {
      title: 'PWA', version: 'Running plugin version', installed: 'Installed plugin version', check: 'Check for updates', install: 'Update plugin', reconcile: 'Check result', manual: 'Manual update on GitHub Releases',
      hint: 'If the home-screen icon stays outdated, remove it and add it again.',
      idle: 'Check for a versioned plugin release.', checking: 'Checking for updates…', current: 'No newer stable release.', 'no-release': 'No published update release yet.',
      available: 'A plugin update is available.', starting: 'Preparing the update…', preparing: 'Validating the release files…', installing: 'DSH is installing the plugin…',
      'restart-required': 'Installed. Restart DSH to apply the plugin update.', applied: 'Updated. Installed and running versions match.', unknown: 'The result is unknown. Check the original operation instead of submitting it again.',
      failed: 'Update failed.', cancelled: 'Update cancelled.', overridden: 'Another configuration overrides this update.', blocked: 'Automatic updates are unavailable for this installation.',
      'reason.manager-unavailable': 'Automatic updates are unavailable in this environment. Update manually.', 'reason.read-only': 'These settings cannot change this installation.', 'reason.source': 'Update this installation manually.',
      'reason.metadata': 'Release files or metadata are missing or invalid.', 'reason.channel': 'Only stable releases are offered.', 'reason.incompatible': 'This release does not support the running DSH version.', 'reason.compatibility-unknown': 'DSH compatibility could not be confirmed.',
      'reason.busy': 'Another update is in progress.', 'reason.redirect': 'A download redirected outside the approved repository.', 'reason.size': 'Release data exceeded the download limit.', 'reason.stale-candidate': 'The candidate or installed bundle changed. Check again.',
      'reason.release-unavailable': 'No published update release is available.', 'reason.storage': 'The profile update record could not be saved.', 'reason.interrupted': 'Preparation was interrupted before installation. Check again.', 'reason.network': 'The release service or DSH connection could not be reached.',
    },
    ja: {
      title: 'PWA', version: 'プラグインの実行版', installed: '導入済みの版', check: '更新を確認', install: 'プラグインを更新', reconcile: '結果を確認', manual: 'GitHub Releases から手動更新',
      hint: 'ホーム画面のアイコンが古い場合は、追加し直してください。',
      idle: '版付きのプラグイン配布を確認できます。', checking: '更新を確認しています…', current: '新しい正式版はありません。', 'no-release': '公開された更新版がありません。',
      available: 'プラグインの更新があります。', starting: '更新を準備しています…', preparing: '配布ファイルを検証しています…', installing: 'DSH がプラグインを導入しています…',
      'restart-required': '導入しました。更新を適用するには DSH を再起動してください。', applied: '更新しました。導入版と実行版の一致を確認しました。', unknown: '結果を確認できません。同じ導入は再送せず、元の操作の結果を確認してください。',
      failed: '更新に失敗しました。', cancelled: '更新をキャンセルしました。', overridden: '別の設定が優先され、更新を適用できませんでした。', blocked: 'この構成では自動更新できません。',
      'reason.manager-unavailable': 'この環境では自動更新できません。手動で更新してください。', 'reason.read-only': 'この設定画面からは変更できません。', 'reason.source': 'この導入は手動で更新してください。',
      'reason.metadata': '配布ファイルが不足しているか、配布情報が不正です。', 'reason.channel': '正式版だけを更新候補にします。', 'reason.incompatible': 'この配布版は実行中の DSH に対応していません。', 'reason.compatibility-unknown': 'DSH との互換性を確認できません。',
      'reason.busy': '別の更新が進行中です。', 'reason.redirect': '許可していない取得先への転送を拒否しました。', 'reason.size': '配布情報が取得サイズ上限を超えました。', 'reason.stale-candidate': '候補または導入済み bundle が変わりました。再確認してください。',
      'reason.release-unavailable': '公開された更新版を取得できません。', 'reason.storage': 'profile の更新記録を保存できませんでした。', 'reason.interrupted': '導入前の準備が中断されました。再確認してください。', 'reason.network': '配布サービスまたは DSH と通信できませんでした。',
    },
  }
  class UpdateController {
    constructor(connection, storage) {
      if (storage === undefined) { try { storage = globalThis.sessionStorage } catch {} }
      this.connection = connection; this.storage = storage; this.listeners = new Set()
      this.state = { status: 'idle' }; this.generation = 0; this.closed = false; this.timer = null
    }
    getSnapshot = () => this.state
    subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
    publish(state) { if (this.closed) return; this.state = state; for (const listener of this.listeners) listener() }
    key(profile = this.profileKey) { return profile ? `dsh-pwa:update:${profile}` : null }
    remember(id) { this.requestId = id; try { if (this.key()) this.storage?.setItem(this.key(), id) } catch {} }
    async call(action, payload = {}) {
      const result = await this.connection.rpc.call('/api', `dsh-pwa/update-${action}`, payload)
      if (!result.ok) { const error = new Error(result.error.code); error.rejected = true; throw error }
      return result.value
    }
    async load() {
      if (this.closed) return
      const generation = ++this.generation
      clearTimeout(this.timer)
      try {
        let state = await this.call('status')
        if (this.closed || generation !== this.generation) return
        this.profileKey = state.profileKey
        let pending
        try { pending = this.key() && this.storage?.getItem(this.key()) } catch {}
        if (!state.requestId && pending && state.status !== 'blocked') state = await this.call('reconcile', { requestId: pending })
        if (this.closed || generation !== this.generation) return
        if (state.requestId) this.remember(state.requestId)
        this.publish(state)
        if (['preparing', 'installing'].includes(state.status)) this.timer = setTimeout(() => { void this.load() }, 800)
      } catch { if (generation === this.generation) this.publish({ ...this.state, status: this.requestId ? 'unknown' : 'blocked', reason: 'network' }) }
    }
    async check() {
      if (this.closed || ['checking', 'starting', 'preparing', 'installing', 'unknown', 'restart-required'].includes(this.state.status)) return
      const generation = ++this.generation
      this.publish({ ...this.state, status: 'checking' })
      try {
        const state = await this.call('check')
        if (generation === this.generation) { this.profileKey = state.profileKey; this.publish(state) }
      } catch { if (generation === this.generation) this.publish({ ...this.state, status: 'blocked', reason: 'network' }) }
    }
    async begin() {
      if (this.closed || this.state.status !== 'available') return
      const candidate = this.state.candidate, generation = ++this.generation, requestId = crypto.randomUUID(), key = this.key()
      this.remember(requestId) // Own the ID before the first request, including a lost reply.
      this.publish({ ...this.state, status: 'starting' })
      try {
        const state = await this.call('begin', { candidateId: candidate.id, requestId })
        if (this.closed || generation !== this.generation) return
        if (state.requestId !== requestId) throw new Error('invalid result')
        this.publish({ ...this.state, ...state }); await this.load()
      } catch (error) {
        if (this.closed || generation !== this.generation) return
        if (error.rejected) {
          this.requestId = undefined
          try { if (key && this.storage?.getItem(key) === requestId) this.storage.removeItem(key) } catch {}
        }
        this.publish({ ...this.state, status: error.rejected ? 'failed' : 'unknown', reason: error.message.endsWith('/busy') ? 'busy' : 'network' })
      }
    }
    dispose() { this.closed = true; this.generation++; clearTimeout(this.timer); this.listeners.clear() }
  }
  function UpdateUI({ controller, locale }) {
    const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot)
    React.useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot().revision)
    const t = locale.bind(NS)
    React.useEffect(() => { void controller.load() }, [controller])
    const active = ['checking', 'starting', 'preparing', 'installing'].includes(state.status)
    return h('section', { className: 'dsh-pwa-updates' },
      h('h3', null, t('title')),
      h('p', null, `${t('version')}: ${state.runtimeVersion ?? '—'}`),
      state.installedVersion && state.installedVersion !== state.runtimeVersion && h('p', null, `${t('installed')}: ${state.installedVersion}`),
      h('p', { role: ['failed', 'blocked'].includes(state.status) ? 'alert' : 'status' }, t(state.status)),
      state.reason && h('p', { className: 'dsh-pwa-muted' }, t(`reason.${state.reason}`)),
      state.candidate && h('div', { className: 'dsh-pwa-notes' }, h('p', null, `${state.runtimeVersion} → ${state.candidate.version} · DSH ${state.candidate.compatibility}`), h('p', null, state.candidate.notes)),
      h('div', { className: 'dsh-pwa-actions' },
        h(Button, { size: 'sm', variant: 'outline', disabled: active || ['unknown', 'restart-required'].includes(state.status), onClick: () => { void controller.check() } }, t('check')),
        state.status === 'available' && h(Button, { size: 'sm', variant: 'primary', onClick: () => { void controller.begin() } }, t('install')),
        state.status === 'unknown' && h(Button, { size: 'sm', variant: 'outline', onClick: () => { void controller.load() } }, t('reconcile'))),
      h('a', { href: 'https://github.com/Aero123421/dsh-pwa/releases', target: '_blank', rel: 'noopener noreferrer' }, t('manual')),
      state.result?.stage && h('p', { className: 'dsh-pwa-muted' }, `${state.result.stage}${state.result.error?.code ? ` · ${state.result.error.code}` : ''}`),
      h('p', { className: 'dsh-pwa-muted' }, t('hint')))
  }
  function apply(ctx) {
    if (!ctx.slots?.inject || !ctx.connection?.rpc || !ctx.locale?.register) return
    const controller = new UpdateController(ctx.connection)
    ctx.effect(() => () => controller.dispose())
    ctx.effect(() => ctx.locale.register(NS, copy))
    ctx.effect(() => {
      const style = document.createElement('style')
      style.dataset.dshPwaUpdates = ''
      style.textContent = '.dsh-pwa-updates{display:grid;gap:12px;min-width:0}.dsh-pwa-updates p,.dsh-pwa-updates h3{margin:0;overflow-wrap:anywhere}.dsh-pwa-actions{display:flex;flex-wrap:wrap;gap:8px}.dsh-pwa-notes{white-space:pre-wrap;overflow-wrap:anywhere}.dsh-pwa-muted{color:var(--dsw-alias-text-secondary);font-size:var(--dsw-alias-font-size-body,13px)}'
      document.head.append(style)
      return () => style.remove()
    })
    ctx.on('connection/reset', () => { void controller.load() })
    const t = ctx.locale.bind(NS)
    ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-pwa', order: 920, label: () => t('title') }, () => h(UpdateUI, { controller, locale: ctx.locale })))
  }
  return { name: 'dsh-pwa', inject: ['slots', 'locale', 'connection'], apply, UpdateController, UpdateUI, copy }
} })
