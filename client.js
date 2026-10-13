/* Source-distributed client: DSH supplies the shared React and native Button. */
window.__ModuleLoader__.load({ id: 'dsh-pwa', factory(require) {
  const React = require('react')
  const { Button } = require('@deepseek-ai/dsh-client-ui-primitives')
  const h = React.createElement, NS = 'dsh.pwa'
  const copy = {
    en: {
      title: 'PWA & Mobile', updates: 'Plugin updates', version: 'Running plugin version', installed: 'Installed plugin version', check: 'Check for updates', install: 'Update plugin', reconcile: 'Check result', manual: 'Manual update on GitHub Releases',
      hint: 'If the home-screen icon stays outdated, remove it and add it again.',
      idle: 'Check for a versioned plugin release.', checking: 'Checking for updates…', current: 'No newer stable release.', 'no-release': 'No published update release yet.',
      available: 'A plugin update is available.', starting: 'Preparing the update…', preparing: 'Validating the release files…', installing: 'DSH is installing the plugin…',
      'restart-required': 'Installed. Restart DSH to apply the plugin update.', applied: 'Updated. Installed and running versions match.', unknown: 'The result is unknown. Check the original operation instead of submitting it again.',
      failed: 'Update failed.', cancelled: 'Update cancelled.', overridden: 'Another configuration overrides this update.', blocked: 'Automatic updates are unavailable for this installation.',
      'reason.manager-unavailable': 'Automatic updates are unavailable in this environment. Update manually.', 'reason.read-only': 'These settings cannot change this installation.', 'reason.source': 'Update this installation manually.',
      'reason.metadata': 'Release files or metadata are missing or invalid.', 'reason.channel': 'Only stable releases are offered.', 'reason.incompatible': 'This release does not support the running DSH version.', 'reason.compatibility-unknown': 'DSH compatibility could not be confirmed.',
      'reason.busy': 'Another update is in progress.', 'reason.redirect': 'A download redirected outside the approved repository.', 'reason.size': 'Release data exceeded the download limit.', 'reason.stale-candidate': 'The candidate or installed bundle changed. Check again.',
      'mobile.title': 'Mobile layout', 'mobile.auto': 'Auto', 'mobile.on': 'On', 'mobile.off': 'Off',
      'mobile.hint': 'Auto uses the mobile layout on screens narrower than 768px. The choice is saved in this browser only.', 'mobile.active': 'Mobile layout is on in this browser.', 'mobile.inactive': 'Mobile layout is off in this browser.',
      'mobile.menu': 'Open sidebar', 'mobile.close': 'Close sidebar', 'mobile.closePanel': 'Close panel',
      'reason.release-unavailable': 'No published update release is available.', 'reason.storage': 'The profile update record could not be saved.', 'reason.interrupted': 'Preparation was interrupted before installation. Check again.', 'reason.network': 'The release service or DSH connection could not be reached.',
    },
    ja: {
      title: 'PWA・モバイル', updates: 'プラグインの更新', version: 'プラグインの実行版', installed: '導入済みの版', check: '更新を確認', install: 'プラグインを更新', reconcile: '結果を確認', manual: 'GitHub Releases から手動更新',
      hint: 'ホーム画面のアイコンが古い場合は、追加し直してください。',
      idle: '版付きのプラグイン配布を確認できます。', checking: '更新を確認しています…', current: '新しい正式版はありません。', 'no-release': '公開された更新版がありません。',
      available: 'プラグインの更新があります。', starting: '更新を準備しています…', preparing: '配布ファイルを検証しています…', installing: 'DSH がプラグインを導入しています…',
      'restart-required': '導入しました。更新を適用するには DSH を再起動してください。', applied: '更新しました。導入版と実行版の一致を確認しました。', unknown: '結果を確認できません。同じ導入は再送せず、元の操作の結果を確認してください。',
      failed: '更新に失敗しました。', cancelled: '更新をキャンセルしました。', overridden: '別の設定が優先され、更新を適用できませんでした。', blocked: 'この構成では自動更新できません。',
      'reason.manager-unavailable': 'この環境では自動更新できません。手動で更新してください。', 'reason.read-only': 'この設定画面からは変更できません。', 'reason.source': 'この導入は手動で更新してください。',
      'reason.metadata': '配布ファイルが不足しているか、配布情報が不正です。', 'reason.channel': '正式版だけを更新候補にします。', 'reason.incompatible': 'この配布版は実行中の DSH に対応していません。', 'reason.compatibility-unknown': 'DSH との互換性を確認できません。',
      'reason.busy': '別の更新が進行中です。', 'reason.redirect': '許可していない取得先への転送を拒否しました。', 'reason.size': '配布情報が取得サイズ上限を超えました。', 'reason.stale-candidate': '候補または導入済み bundle が変わりました。再確認してください。',
      'mobile.title': 'モバイル表示', 'mobile.auto': '自動', 'mobile.on': 'オン', 'mobile.off': 'オフ',
      'mobile.hint': '自動では幅 768px 未満の画面でモバイル表示にします。設定はこのブラウザにだけ保存されます。', 'mobile.active': 'このブラウザではモバイル表示がオンです。', 'mobile.inactive': 'このブラウザではモバイル表示がオフです。',
      'mobile.menu': 'サイドバーを開く', 'mobile.close': 'サイドバーを閉じる', 'mobile.closePanel': 'パネルを閉じる',
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
        if (this.profileKey !== state.profileKey) this.requestId = undefined
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
        const state = await this.call('begin', { candidateId: candidate.id, requestId, profileKey: this.profileKey })
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
  /* Mobile layout: stored per browser, applied as one attribute on <html> that scopes every rule below. */
  const MODES = ['auto', 'on', 'off'], MODE_KEY = 'dsh-pwa:mobile-ui', NARROW = '(max-width: 767px)'
  class MobileController {
    constructor({ storage, matchMedia, root } = {}) {
      if (storage === undefined) { try { storage = globalThis.localStorage } catch {} }
      this.storage = storage; this.root = root ?? globalThis.document?.documentElement; this.listeners = new Set()
      let mode
      try { mode = storage?.getItem(MODE_KEY) } catch {}
      this.query = (matchMedia ?? globalThis.matchMedia)?.(NARROW)
      this.onChange = () => this.update()
      this.query?.addEventListener?.('change', this.onChange)
      this.state = { mode: MODES.includes(mode) ? mode : 'auto', active: false }
      this.update(this.state.mode)
    }
    getSnapshot = () => this.state
    subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
    setMode(mode) {
      if (!MODES.includes(mode)) return
      try { this.storage?.setItem(MODE_KEY, mode) } catch {}
      this.update(mode)
    }
    update(mode = this.state.mode) {
      const active = mode === 'on' || (mode === 'auto' && !!this.query?.matches)
      this.root?.toggleAttribute?.('data-dsh-mobile', active)
      if (mode === this.state.mode && active === this.state.active) return
      this.state = { mode, active }
      for (const listener of this.listeners) listener()
    }
    dispose() { this.query?.removeEventListener?.('change', this.onChange); this.root?.removeAttribute?.('data-dsh-mobile'); this.listeners.clear() }
  }
  // DSH layout hooks without hashed class names: frame data attributes, slot markers and :has().
  const FRAME = '[data-slot=root] > div', CENTER = ':scope > div:has(> [data-slot=main])', M = 'html[data-dsh-mobile]'
  const EASE = '.28s cubic-bezier(.2,.8,.2,1)'
  const mobileCss = [
    `${M}{--dsh-pwa-drawer:min(84vw,320px);--dsh-pwa-panel:min(88vw,440px);-webkit-tap-highlight-color:transparent}`,
    `${M} body{overscroll-behavior:none}`,
    `${M} ${FRAME}>div:has(>[data-slot=main]){grid-column:1/span 2!important;grid-row:1;transition:transform ${EASE},border-radius ${EASE}}`,
    `${M} ${FRAME}>div:has(>[data-slot=sidebar]){position:fixed;inset:0 auto 0 0;z-index:30;width:var(--dsh-pwa-drawer);box-sizing:border-box;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) env(safe-area-inset-left);background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base));transform:translateX(-100%);visibility:hidden;transition:transform ${EASE},visibility 0s linear .28s}`,
    `${M} ${FRAME}:not([data-sidebar-collapsed])>div:has(>[data-slot=sidebar]){transform:none;visibility:visible;transition-delay:0s}`,
    `${M} ${FRAME}:not([data-sidebar-collapsed])>div:has(>[data-slot=main]){transform:translateX(var(--dsh-pwa-drawer));border-radius:24px 0 0 24px;overflow:hidden}`,
    `${M} [data-slot=sidebar]>div{width:100%!important}`,
    // The right panel (files, terminal…) opens fullscreen on narrow frames; present it as a drawer from the right instead.
    `${M} ${FRAME}[data-rightbar-fullscreen]>div:has(>[data-slot=main]){transform:translateX(calc(-1 * var(--dsh-pwa-panel)));border-radius:0 24px 24px 0;overflow:hidden}`,
    `${M} [data-sidebar-right-panel=fullscreen]{left:auto!important;width:var(--dsh-pwa-panel)!important;max-width:none!important;--dsh-sidebar-width:var(--dsh-pwa-panel)!important;padding-top:env(safe-area-inset-top);box-sizing:border-box}`,
    `${M} [data-sidebar-right-panel=fullscreen][data-sidebar-right-open]{box-shadow:-8px 0 24px #0000001f;animation:dsh-pwa-panel-in ${EASE}}`,
    `@keyframes dsh-pwa-panel-in{from{transform:translateX(100%)}}`,
    `${M} ${FRAME}>div[data-side]{display:none!important}`,
    `${M} [data-slot="conversation.header"]>header{padding-left:calc(env(safe-area-inset-left) + 64px)}`,
    `${M} [data-composer-seat]{padding-bottom:env(safe-area-inset-bottom)}`,
    `${M} [data-composer-input],${M} input,${M} textarea{font-size:max(16px,1em)}`,
    // DSH Settings is a two-column dialog; on a phone its navigation becomes a scrolling row above the page.
    `${M} [data-shortcut-modal=settings]{flex-direction:column!important}`,
    `${M} [data-shortcut-modal=settings]>nav{width:auto!important;flex:none!important;max-width:none!important;padding-bottom:0!important;border:0!important}`,
    `${M} [data-shortcut-modal=settings]>nav>div:last-child{display:flex!important;flex-direction:row!important;gap:4px;overflow-x:auto;scrollbar-width:none;margin-top:8px}`,
    `${M} [data-shortcut-modal=settings]>nav>div:last-child>*{flex:none!important;width:auto!important}`,
    `${M} [data-shortcut-modal=settings]>div:last-child{flex:1 1 auto!important;min-height:0;width:auto!important}`,
    `.dsh-pwa-menu,.dsh-pwa-scrim{pointer-events:auto;border:0;padding:0;-webkit-tap-highlight-color:transparent}`,
    `.dsh-pwa-menu{position:fixed;z-index:20;top:calc(env(safe-area-inset-top) + 8px);left:calc(env(safe-area-inset-left) + 12px);width:44px;height:44px;border-radius:50%!important;corner-shape:round!important;display:grid;place-items:center;color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--dsw-alias-bg-base) 78%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 0 0 .5px var(--dsw-alias-border-l3,#0002),0 4px 16px #0000001f;cursor:pointer}`,
    `.dsh-pwa-scrim{position:fixed;z-index:20;inset:0 0 0 var(--dsh-pwa-drawer);background:#0000002e;cursor:default}`,
    `.dsh-pwa-scrim[data-side=right]{inset:0 var(--dsh-pwa-panel) 0 0}`,
    `@media (prefers-reduced-motion:reduce){${M} ${FRAME}>div{transition:none!important}${M} [data-sidebar-right-panel]{transition:none!important;animation:none!important}}`,
  ].join('')
  const icon = paths => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', 'aria-hidden': true }, paths.map(d => h('path', { key: d, d })))
  const menuIcon = () => icon(['M4 8h16', 'M4 16h10'])
  function toggleSidebar(ctx) {
    const layout = ctx.get?.('layout')
    if (layout?.toggleSidebar) layout.toggleSidebar()
    else {
      const t = ctx.locale.bind('sidebar'), labels = [t('toggle.open'), t('toggle.collapse')]
      Array.from(document.querySelectorAll('[data-slot=sidebar] button')).find(button => labels.includes(button.getAttribute('aria-label')))?.click()
    }
  }
  // The right Sidebar keeps its own open state; its collapse control is the only close that keeps it in sync.
  function closePanel() { document.querySelector('[data-sidebar-right-panel] button[data-sidebar-right-toggle]')?.click() }
  /** Floating menu button while no drawer is open; a tap-to-close scrim beside whichever drawer is. */
  function MobileChrome({ ctx, mobile, locale }) {
    const { active } = React.useSyncExternalStore(mobile.subscribe, mobile.getSnapshot)
    React.useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot().revision)
    const t = locale.bind(NS), [open, setOpen] = React.useState(null)
    React.useEffect(() => {
      const frame = active && document.querySelector(FRAME)
      if (!frame) return
      const isOpen = () => !frame.hasAttribute('data-sidebar-collapsed')
      const side = () => frame.hasAttribute('data-rightbar-fullscreen') ? 'right' : isOpen() ? 'left' : null
      const close = () => { if (isOpen()) toggleSidebar(ctx) }
      const where = () => { const center = frame.querySelector(CENTER); return [ctx.get?.('layout')?.panelInfo?.getSnapshot?.()?.activePanelId, center?.querySelector('[data-conversation-session]')?.dataset.conversationSession, center?.querySelector('[data-slot=main]')?.childElementCount].join('|') }
      let last = where()
      // Like a native drawer: choosing a session, panel or New Session closes it.
      const watch = new MutationObserver(() => { setOpen(side()); const now = where(); if (now !== last) { last = now; close() } })
      watch.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed', 'data-rightbar-fullscreen', 'data-conversation-session'], subtree: true, childList: true })
      let closeTimer
      const onClick = event => {
        const target = event.target
        if (!target.closest?.('[data-slot=sidebar]')) return
        const button = target.closest('button')
        const newSession = button?.getAttribute('aria-label') === locale.bind('sidebar')('session.new.label')
        const panel = target.closest('nav button')
        // Row action buttons and rename inputs do not select the session.
        const session = target.closest('[data-row-key^="session:"]') && !target.closest('button,input')
        if (newSession || panel || session) { clearTimeout(closeTimer); closeTimer = setTimeout(close) }
      }
      document.addEventListener('click', onClick, true)
      setOpen(side())
      return () => { clearTimeout(closeTimer); watch.disconnect(); document.removeEventListener('click', onClick, true) }
    }, [active])
    if (!active) return null
    if (open === 'right') return h('button', { type: 'button', className: 'dsh-pwa-scrim', 'data-side': 'right', 'aria-label': t('mobile.closePanel'), onClick: closePanel })
    return open
      ? h('button', { type: 'button', className: 'dsh-pwa-scrim', 'aria-label': t('mobile.close'), onClick: () => toggleSidebar(ctx) })
      : h('button', { type: 'button', className: 'dsh-pwa-menu', 'aria-label': t('mobile.menu'), title: t('mobile.menu'), onClick: () => toggleSidebar(ctx) }, menuIcon())
  }
  function MobileUI({ mobile, locale }) {
    const state = React.useSyncExternalStore(mobile.subscribe, mobile.getSnapshot)
    const t = locale.bind(NS)
    return h('div', { className: 'dsh-pwa-mobile' },
      h('h4', null, t('mobile.title')),
      h('div', { className: 'dsh-pwa-actions', role: 'group', 'aria-label': t('mobile.title') },
        MODES.map(mode => h(Button, { key: mode, size: 'sm', variant: state.mode === mode ? 'primary' : 'outline', 'aria-pressed': state.mode === mode, onClick: () => mobile.setMode(mode) }, t(`mobile.${mode}`)))),
      h('p', { role: 'status' }, t(state.active ? 'mobile.active' : 'mobile.inactive')),
      h('p', { className: 'dsh-pwa-muted' }, t('mobile.hint')))
  }
  function UpdateUI({ controller, locale }) {
    const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot)
    const t = locale.bind(NS)
    React.useEffect(() => { void controller.load() }, [controller])
    const active = ['checking', 'starting', 'preparing', 'installing'].includes(state.status)
    return h('div', { className: 'dsh-pwa-updates' },
      h('h4', null, t('updates')),
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
  function SettingsUI({ controller, mobile, locale }) {
    React.useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot().revision)
    return h('section', { className: 'dsh-pwa-settings' },
      h('h3', null, locale.bind(NS)('title')),
      h(MobileUI, { mobile, locale }),
      controller && h(UpdateUI, { controller, locale }))
  }
  function apply(ctx) {
    if (!ctx.slots?.inject || !ctx.locale?.register) return
    const mobile = new MobileController()
    const controller = ctx.connection?.rpc ? new UpdateController(ctx.connection) : null
    ctx.effect(() => () => { mobile.dispose(); controller?.dispose() })
    ctx.effect(() => ctx.locale.register(NS, copy))
    ctx.effect(() => {
      const style = document.createElement('style')
      style.dataset.dshPwaUpdates = ''
      style.textContent = '.dsh-pwa-settings,.dsh-pwa-updates,.dsh-pwa-mobile{display:grid;gap:12px;min-width:0}.dsh-pwa-settings{gap:24px}.dsh-pwa-settings p,.dsh-pwa-settings h3,.dsh-pwa-settings h4{margin:0;overflow-wrap:anywhere}.dsh-pwa-actions{display:flex;flex-wrap:wrap;gap:8px}.dsh-pwa-notes{white-space:pre-wrap;overflow-wrap:anywhere}.dsh-pwa-muted{color:var(--dsw-alias-text-secondary);font-size:var(--dsw-alias-font-size-body,13px)}' + mobileCss
      document.head.append(style)
      return () => style.remove()
    })
    if (controller) ctx.on('connection/reset', () => { void controller.load() })
    const t = ctx.locale.bind(NS)
    ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-pwa', order: 920, label: () => t('title') }, () => h(SettingsUI, { controller, mobile, locale: ctx.locale })))
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'dsh-pwa.mobile' }, () => h(MobileChrome, { ctx, mobile, locale: ctx.locale })))
  }
  return { name: 'dsh-pwa', inject: ['slots', 'locale', 'connection'], apply, UpdateController, UpdateUI, MobileController, MobileUI, SettingsUI, copy }
} })
