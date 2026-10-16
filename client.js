/* Source-distributed client: DSH supplies the shared React and native Button. */
window.__ModuleLoader__.load({ id: 'dsh-pwa', factory(require) {
  const React = require('react')
  const { Button } = require('@deepseek-ai/dsh-client-ui-primitives')
  const h = React.createElement, NS = 'dsh.pwa'
  const copy = {
    en: {
      'pwa.title': 'Add to Home Screen', 'pwa.install': 'Install app', 'pwa.check': 'Check PWA setup',
      'pwa.idle': 'Check the app icon and installation metadata.', 'pwa.checking': 'Checking the manifest and icons…',
      'pwa.ready': 'The manifest and home-screen icons are available.', 'pwa.failed': 'The PWA manifest or icons could not be verified. Enable this plugin in the Web profile, restart DSH and reload this page; then check the proxy paths.',
      'pwa.insecure': 'Installation requires HTTPS (or localhost). Open the HTTPS address of this DSH server.',
      'pwa.installed': 'The home-screen app is installed.', 'pwa.ios': 'In Safari, use Share → Add to Home Screen. Open this page in Safari rather than an in-app browser.',
      'pwa.manual': 'Use the browser menu → Install app / Add to Home Screen. The install button appears here when the browser offers it.',
      'pwa.accepted': 'Installation was accepted. Finish any browser confirmation.', 'pwa.dismissed': 'Installation was cancelled. You can try again from the browser menu.',
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
      'mobile.dismiss': 'Dismiss sidebar backdrop', 'mobile.menu': 'Open sidebar', 'mobile.close': 'Close sidebar', 'mobile.closePanel': 'Close panel',
      'reason.release-unavailable': 'No published update release is available.', 'reason.storage': 'The profile update record could not be saved.', 'reason.interrupted': 'Preparation was interrupted before installation. Check again.', 'reason.network': 'The release service or DSH connection could not be reached.',
      'reason.restored': 'The new version did not install. The previous version was installed again. Restart DSH if the plugin does not come back.',
      'reason.plugin-missing': 'The new version did not install, and the previous version could not be put back. The plugin may have been removed. Install it again from GitHub Releases.',
    },
    ja: {
      'pwa.title': 'ホーム画面に追加', 'pwa.install': 'アプリをインストール', 'pwa.check': 'PWAの設定を確認',
      'pwa.idle': 'アプリアイコンとインストール情報を確認します。', 'pwa.checking': 'manifestとアイコンを確認しています…',
      'pwa.ready': 'manifestとホーム画面用アイコンを取得できました。', 'pwa.failed': 'manifestまたはアイコンを確認できません。Webプロファイルでこのプラグインを有効にし、DSHを再起動してページを再読み込みしてください。プロキシのパス設定も確認してください。',
      'pwa.insecure': 'インストールにはHTTPS（またはlocalhost）が必要です。このDSHサーバーのHTTPSアドレスで開いてください。',
      'pwa.installed': 'ホーム画面アプリを追加済みです。', 'pwa.ios': 'Safariの「共有」→「ホーム画面に追加」で追加できます。アプリ内ブラウザではなくSafariで開いてください。',
      'pwa.manual': 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。ブラウザが対応する場合は、ここにもインストールボタンが表示されます。',
      'pwa.accepted': 'インストール操作を受け付けました。ブラウザ側に確認が表示された場合は完了してください。', 'pwa.dismissed': 'インストールをキャンセルしました。ブラウザのメニューから再実行できます。',
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
      'mobile.dismiss': 'サイドバーの背景を閉じる', 'mobile.menu': 'サイドバーを開く', 'mobile.close': 'サイドバーを閉じる', 'mobile.closePanel': 'パネルを閉じる',
      'reason.release-unavailable': '公開された更新版を取得できません。', 'reason.storage': 'profile の更新記録を保存できませんでした。', 'reason.interrupted': '導入前の準備が中断されました。再確認してください。', 'reason.network': '配布サービスまたは DSH と通信できませんでした。',
      'reason.restored': '新しい版は導入できませんでした。以前の版を入れ直しました。プラグインが戻らない場合は DSH を再起動してください。',
      'reason.plugin-missing': '新しい版は導入できず、以前の版も入れ直せませんでした。プラグインが消えている可能性があります。GitHub Releases から入れ直してください。',
    },
  }
  /** Mirror server metadata on hot plugin activation. Restore only our writes. */
  function mountPwaHead(doc = document) {
    const cleanup = []
    const patch = (selector, tag, attributes) => {
      const matches = [...doc.head.querySelectorAll(selector)]
      const nodes = matches.length ? matches : [doc.createElement(tag)]
      for (const node of nodes) {
        const fresh = !node.parentNode
        const before = Object.fromEntries(Object.keys(attributes).map(key => [key, node.getAttribute(key)]))
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
        if (fresh) doc.head.append(node)
        cleanup.push(() => {
          if (fresh) { node.remove(); return }
          for (const [key, value] of Object.entries(attributes)) {
            if (node.getAttribute(key) !== value) continue
            if (before[key] === null) node.removeAttribute(key)
            else node.setAttribute(key, before[key])
          }
        })
      }
    }
    patch('link[rel="manifest"]', 'link', { rel: 'manifest', href: './manifest.webmanifest', crossorigin: 'use-credentials' })
    patch('link[rel="apple-touch-icon"]', 'link', { rel: 'apple-touch-icon', sizes: '180x180', href: './pwa/apple-touch-icon.png' })
    patch('meta[name="apple-mobile-web-app-capable"]', 'meta', { name: 'apple-mobile-web-app-capable', content: 'yes' })
    patch('meta[name="apple-mobile-web-app-title"]', 'meta', { name: 'apple-mobile-web-app-title', content: 'DeepSeek Harness' })
    // Preserve zoom/accessibility directives from the host instead of replacing them.
    const viewport = doc.head.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? 'width=device-width, initial-scale=1'
    const cover = viewport.replace(/,?\s*viewport-fit\s*=\s*[^,]+/gi, '') + ', viewport-fit=cover'
    patch('meta[name="viewport"]', 'meta', { name: 'viewport', content: cover })
    return () => { for (const dispose of cleanup.reverse()) dispose() }
  }
  class InstallController {
    constructor(target = window) {
      this.target = target; this.listeners = new Set(); this.closed = false
      this.display = target.matchMedia?.('(display-mode: standalone)')
      const ua = target.navigator?.userAgent ?? ''
      const ios = /iPad|iPhone|iPod/.test(ua) || (target.navigator?.platform === 'MacIntel' && target.navigator.maxTouchPoints > 1)
      this.state = { secure: !!target.isSecureContext, installed: !!(this.display?.matches || target.navigator?.standalone), ios, prompt: false, check: 'idle', outcome: null }
      this.onPrompt = event => { event.preventDefault(); this.deferred = event; this.publish({ prompt: true, outcome: null }) }
      this.onInstalled = () => { this.deferred = null; this.publish({ installed: true, prompt: false, outcome: null }) }
      this.onDisplay = () => this.publish({ installed: !!(this.display?.matches || target.navigator?.standalone) })
      target.addEventListener('beforeinstallprompt', this.onPrompt)
      target.addEventListener('appinstalled', this.onInstalled)
      this.display?.addEventListener('change', this.onDisplay)
    }
    getSnapshot = () => this.state
    subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
    publish(value) { if (this.closed) return; this.state = { ...this.state, ...value }; for (const fn of this.listeners) fn() }
    async install() {
      const event = this.deferred
      if (this.closed || !event) return
      this.deferred = null; this.publish({ prompt: false })
      try {
        await event.prompt() // Invoked in the button's user-activation task.
        const choice = await event.userChoice
        if (!this.state.installed) this.publish({ outcome: choice.outcome === 'accepted' ? 'accepted' : 'dismissed' })
      } catch { this.publish({ outcome: 'failed' }) }
    }
    async check() {
      if (this.closed || this.state.check === 'checking') return
      this.request?.abort(); const request = new AbortController(); this.request = request
      this.publish({ check: 'checking' })
      try {
        const base = new URL('./', this.target.document.baseURI)
        const manifestUrl = new URL('./manifest.webmanifest', base)
        const get = async (url, type) => {
          if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) throw new Error('foreign metadata')
          const response = await this.target.fetch(url.href, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: request.signal })
          if (!response.ok || !response.headers.get('content-type')?.includes(type)) throw new Error('unavailable metadata')
          return response
        }
        const response = await get(manifestUrl, 'application/manifest+json')
        const data = await response.json()
        const start = new URL(data.start_url, manifestUrl), scope = new URL(data.scope, manifestUrl)
        if (!data.name || data.display !== 'standalone' || start.href !== base.href || scope.href !== base.href) throw new Error('invalid manifest')
        const images = [{ src: './pwa/apple-touch-icon.png', size: 180 }]
        for (const size of [192, 512]) {
          const image = data.icons?.find(icon => icon.sizes === `${size}x${size}` && (!icon.purpose || icon.purpose.split(/\s+/).includes('any')))
          if (!image) throw new Error('missing icon')
          images.push({ ...image, size })
        }
        await Promise.all(images.map(async image => {
          const response = await get(new URL(image.src, manifestUrl), 'image/png')
          const bytes = new Uint8Array(await response.arrayBuffer())
          if (bytes.length < 24 || bytes.length > 1024 * 1024 || bytes.slice(0, 8).join(',') !== '137,80,78,71,13,10,26,10') throw new Error('invalid icon')
          const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
          if (view.getUint32(16) !== image.size || view.getUint32(20) !== image.size) throw new Error('invalid icon size')
        }))
        if (!request.signal.aborted) this.publish({ check: 'ready' })
      } catch { if (!request.signal.aborted) this.publish({ check: 'failed' }) }
    }
    dispose() {
      this.closed = true; this.deferred = null; this.request?.abort(); this.listeners.clear()
      this.target.removeEventListener('beforeinstallprompt', this.onPrompt)
      this.target.removeEventListener('appinstalled', this.onInstalled)
      this.display?.removeEventListener('change', this.onDisplay)
    }
  }
  function InstallUI({ install, locale }) {
    const state = React.useSyncExternalStore(install.subscribe, install.getSnapshot), t = locale.bind(NS)
    React.useEffect(() => { void install.check() }, [install])
    const status = state.installed ? 'installed' : !state.secure ? 'insecure' : state.check
    return h('div', { className: 'dsh-pwa-install' },
      h('div', { className: 'dsh-pwa-identity' }, h('img', { src: './pwa/apple-touch-icon.png', width: 56, height: 56, alt: '' }), h('h4', null, t('pwa.title'))),
      h('p', { role: status === 'failed' || status === 'insecure' ? 'alert' : 'status' }, t(`pwa.${status}`)),
      !state.installed && h('p', { className: 'dsh-pwa-muted' }, t(state.ios ? 'pwa.ios' : 'pwa.manual')),
      state.outcome && h('p', { role: 'status' }, t(`pwa.${state.outcome}`)),
      h('div', { className: 'dsh-pwa-actions' },
        state.prompt && !state.installed && state.secure && h(Button, { variant: 'primary', onClick: () => { void install.install() } }, t('pwa.install')),
        h(Button, { variant: 'outline', disabled: state.check === 'checking', onClick: () => { void install.check() } }, t('pwa.check'))))
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
      this.viewport = globalThis.visualViewport
      this.onViewport = () => {
        if (!this.state?.active || (this.viewport?.scale ?? 1) !== 1) return
        this.root?.style?.setProperty('--dsh-pwa-viewport', `${Math.round(this.viewport?.height ?? globalThis.innerHeight)}px`)
      }
      this.viewport?.addEventListener('resize', this.onViewport)
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
      if (!active) this.root?.style?.removeProperty('--dsh-pwa-viewport')
      if (mode === this.state.mode && active === this.state.active) return
      this.state = { mode, active }; this.onViewport()
      for (const listener of this.listeners) listener()
    }
    dispose() { this.viewport?.removeEventListener('resize', this.onViewport); this.root?.style?.removeProperty('--dsh-pwa-viewport'); this.query?.removeEventListener?.('change', this.onChange); this.root?.removeAttribute?.('data-dsh-mobile'); this.listeners.clear() }
  }
  // Internal DOM seam: official ui-layout at 5719020 (0.2.1-alpha.3).
  // There is no public mobile-presentation API. Keep state in ctx.layout and
  // style only stable slot/data markers; never copy or replace the DSH shell.
  const FRAME = '[data-slot=root] > div', CENTER = ':scope > div:has(> [data-slot=main])', M = 'html[data-dsh-mobile]'
  const mobileCss = `
    ${M}{--dsh-pwa-drawer:min(86vw,320px);--dsh-pwa-toolbar:calc(52px + env(safe-area-inset-top));-webkit-tap-highlight-color:transparent}
    ${M} body{overscroll-behavior:none}
    ${M} #root{height:var(--dsh-pwa-viewport,100dvh)!important;min-height:0}
    ${M} ${FRAME}{grid-template-columns:0 minmax(0,1fr) 0!important;box-sizing:border-box;padding-top:var(--dsh-pwa-toolbar);transition:none!important}
    ${M} ${FRAME}>div:has(>[data-slot=main]){grid-column:2;grid-row:1;min-width:0;min-height:0;transform:none!important;border-radius:0}
    ${M} ${FRAME}>div:has(>[data-slot=sidebar]){position:fixed;top:var(--dsh-pwa-toolbar);left:0;width:var(--dsh-pwa-drawer);height:calc(var(--dsh-pwa-viewport,100dvh) - var(--dsh-pwa-toolbar));z-index:30;box-sizing:border-box;padding:0 0 env(safe-area-inset-bottom) env(safe-area-inset-left);background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base));transform:translateX(-100%);visibility:hidden;transition:transform .2s ease,visibility 0s linear .2s}
    ${M} ${FRAME}:not([data-sidebar-collapsed])>div:has(>[data-slot=sidebar]){transform:none;visibility:visible;transition-delay:0s;box-shadow:8px 0 24px #0002}
    ${M} [data-slot=sidebar]>div{width:100%!important}
    ${M} [data-slot=sidebar] nav button{min-height:44px}
    ${M} ${FRAME}>[data-rightbar-col]{grid-column:3;grid-row:1}
    ${M} [data-sidebar-right-panel]{width:100vw!important;max-width:100vw!important;--dsh-sidebar-width:100vw!important;box-sizing:border-box;padding-bottom:env(safe-area-inset-bottom)}
    ${M} ${FRAME}>div[data-side]{display:none!important}
    ${M} [data-composer-seat]{min-width:0;padding-bottom:env(safe-area-inset-bottom)}
    ${M} [data-composer-input],${M} input,${M} textarea,${M} select{font-size:max(16px,1em)}
    ${M} [data-slot=main]{min-width:0;min-height:0}
    ${M} [data-shortcut-modal=settings]{flex-direction:column!important;width:calc(100vw - 16px);max-width:calc(100vw - 16px);height:calc(var(--dsh-pwa-viewport,100dvh) - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom));max-height:900px;min-width:0;border-radius:16px}
    ${M} [data-shortcut-modal=settings]>nav{width:auto!important;min-width:0;flex:none!important;max-width:100%;padding:12px 12px 0;gap:8px;border:0}
    ${M} [data-shortcut-modal=settings]>nav>div:last-child{display:flex;flex-direction:row;gap:4px;overflow-x:auto;overscroll-behavior-x:contain}
    ${M} [data-shortcut-modal=settings]>nav>div:last-child>*{flex:none;width:auto;min-height:44px}
    ${M} [data-shortcut-modal=settings]>div:last-child{flex:1 1 auto;min-height:0;min-width:0;width:auto}
    ${M} [data-shortcut-modal=settings]>div:last-child>div:first-child{height:48px;padding:2px 12px}
    ${M} [data-shortcut-modal=settings]>div:last-child>div:first-child button{min-width:44px;min-height:44px}
    ${M} [data-shortcut-modal=settings]>div:last-child>div:last-child{padding:0 16px 16px;min-width:0;overflow:auto}
    ${M} .dsh-pwa-actions button{min-height:44px}
    .dsh-pwa-toolbar{position:fixed;top:0;left:0;right:0;height:var(--dsh-pwa-toolbar);padding:env(safe-area-inset-top) max(8px,env(safe-area-inset-right)) 0 max(8px,env(safe-area-inset-left));box-sizing:border-box;display:flex;align-items:center;gap:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l3);pointer-events:auto}
    .dsh-pwa-toolbar strong{font-size:14px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-pwa-menu{border:0;padding:0;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:inherit;background:transparent;cursor:pointer;flex:none}
    .dsh-pwa-menu:hover{background:var(--dsw-alias-interactive-bg-hover)}
    .dsh-pwa-menu:focus-visible{outline:2px solid currentColor;outline-offset:-3px}
    .dsh-pwa-scrim{position:fixed;top:var(--dsh-pwa-toolbar);left:var(--dsh-pwa-drawer);right:0;height:calc(var(--dsh-pwa-viewport,100dvh) - var(--dsh-pwa-toolbar));border:0;padding:0;background:#0005;pointer-events:auto}
    .dsh-pwa-install{display:grid;gap:12px;min-width:0}
    .dsh-pwa-identity{display:flex;align-items:center;gap:12px}
    .dsh-pwa-identity img{width:56px;height:56px;border-radius:12px;flex:none}
    @media(prefers-reduced-motion:reduce){${M} ${FRAME}>div,${M} [data-sidebar-right-panel] *{transition:none!important;animation:none!important}}
  `
  const icon = paths => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', 'aria-hidden': true }, paths.map(d => h('path', { key: d, d })))
  const menuIcon = () => icon(['M4 6h16', 'M4 12h16', 'M4 18h16'])
  const closeIcon = () => icon(['M6 6l12 12', 'M18 6L6 18'])
  function toggleSidebar(ctx) { ctx.get?.('layout')?.toggleSidebar() }
  // Closing the occupant, not layout.closeRightbar(), keeps its state in sync.
  function openRightPanel(root = document) { return [...root.querySelectorAll('[data-sidebar-right-panel][data-sidebar-right-open]')].find(panel => !panel.closest('[hidden]')) }
  function closePanel() { openRightPanel()?.querySelector('button[data-sidebar-right-toggle]')?.click() }
  function MobileChrome({ ctx, mobile, locale }) {
    const { active } = React.useSyncExternalStore(mobile.subscribe, mobile.getSnapshot)
    React.useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot().revision)
    const t = locale.bind(NS), [open, setOpen] = React.useState(null), menu = React.useRef(null)
    React.useEffect(() => {
      if (!active) { setOpen(null); return }
      const frame = document.querySelector(FRAME)
      if (!frame) return
      const center = frame.querySelector(CENTER), sidebar = frame.querySelector(':scope > div:has(> [data-slot=sidebar])')
      const right = frame.querySelector('[data-rightbar-col]')
      const originalInert = new Map([center, sidebar].filter(Boolean).map(el => [el, el.inert]))
      const isOpen = () => !frame.hasAttribute('data-sidebar-collapsed')
      let previous = null, timer
      const sync = () => {
        const next = right && openRightPanel(right) ? 'right' : isOpen() ? 'left' : null
        setOpen(next)
        if (center) center.inert = originalInert.get(center) || next !== null
        if (sidebar) sidebar.inert = originalInert.get(sidebar) || next !== 'left'
        // Return focus only when it was inside the surface that is closing.
        if (previous !== 'left' && next === 'left' && !document.querySelector('[role=dialog]')) sidebar?.querySelector('button')?.focus({ preventScroll: true })
        if (previous === 'left' && next !== 'left' && sidebar?.contains(document.activeElement)) menu.current?.focus({ preventScroll: true })
        if (previous === 'left' && next === 'right') close()
        previous = next
      }
      const close = () => { if (isOpen()) toggleSidebar(ctx) }
      // Observe geometry only, not streaming messages or the conversation subtree.
      const watch = new MutationObserver(sync)
      watch.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
      if (right) watch.observe(right, { subtree: true, attributes: true, attributeFilter: ['data-sidebar-right-open', 'hidden'], childList: true })
      const info = ctx.get?.('layout')?.panelInfo
      let panel = info?.getSnapshot().activePanelId
      const offPanel = info?.subscribe(() => { const next = info.getSnapshot().activePanelId; if (next !== panel) { panel = next; close() } })
      const onClick = event => {
        const target = event.target
        if (!target.closest?.('[data-slot=sidebar]')) return
        const newSession = target.closest('button')?.getAttribute('aria-label') === locale.bind('sidebar')('session.new.label')
        const nav = target.closest('nav button')
        const session = target.closest('[data-row-key^="session:"]') && !target.closest('button,input')
        if (newSession || nav || session) { clearTimeout(timer); timer = setTimeout(close) }
      }
      const onKey = event => {
        // Portalled menus/dialogs own Escape before our drawer does.
        if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[role=dialog],[role=menu]')) return
        if (previous === 'left') { event.preventDefault(); close(); menu.current?.focus() }
      }
      document.addEventListener('click', onClick, true)
      document.addEventListener('keydown', onKey)
      sync()
      return () => {
        clearTimeout(timer); watch.disconnect(); offPanel?.()
        document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey)
        for (const [el, inert] of originalInert) el.inert = inert
      }
    }, [active, ctx, locale])
    if (!active) return null
    const label = open === 'right' ? t('mobile.closePanel') : t(open === 'left' ? 'mobile.close' : 'mobile.menu')
    return h(React.Fragment, null,
      open === 'left' && h('button', { type: 'button', className: 'dsh-pwa-scrim', 'aria-label': t('mobile.dismiss'), tabIndex: -1, onClick: () => toggleSidebar(ctx) }),
      h('div', { className: 'dsh-pwa-toolbar' },
        h('button', { ref: menu, type: 'button', className: 'dsh-pwa-menu', 'aria-label': label, title: label, 'aria-expanded': open !== null, onClick: open === 'right' ? closePanel : () => toggleSidebar(ctx) }, open ? closeIcon() : menuIcon()),
        h('strong', null, 'DeepSeek Harness')))
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
  function SettingsUI({ controller, mobile, install, locale }) {
    React.useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot().revision)
    return h('section', { className: 'dsh-pwa-settings' },
      h('h3', null, locale.bind(NS)('title')),
      h(InstallUI, { install, locale }),
      h(MobileUI, { mobile, locale }),
      controller && h(UpdateUI, { controller, locale }))
  }
  function apply(ctx) {
    if (!ctx.slots?.inject || !ctx.locale?.register) return
    const mobile = new MobileController(), install = new InstallController()
    ctx.effect(() => mountPwaHead())
    const controller = ctx.connection?.rpc ? new UpdateController(ctx.connection) : null
    ctx.effect(() => () => { mobile.dispose(); install.dispose(); controller?.dispose() })
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
    ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-pwa', order: 920, label: () => t('title') }, () => h(SettingsUI, { controller, mobile, install, locale: ctx.locale })))
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'dsh-pwa.mobile' }, () => h(MobileChrome, { ctx, mobile, locale: ctx.locale })))
  }
  return { name: 'dsh-pwa', inject: ['slots', 'locale', 'connection'], apply, UpdateController, UpdateUI, MobileController, MobileUI, SettingsUI, InstallController, mountPwaHead, copy }
} })