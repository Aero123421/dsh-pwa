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
      'mobile.hint': 'Auto uses the mobile layout on screens narrower than 768px and on phones in landscape. The choice is saved in this browser only.', 'mobile.active': 'Mobile layout is on in this browser.', 'mobile.inactive': 'Mobile layout is off in this browser.',
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
      'mobile.hint': '自動では、幅 768px 未満の画面と横向きのスマートフォンでモバイル表示にします。設定はこのブラウザにだけ保存されます。', 'mobile.active': 'このブラウザではモバイル表示がオンです。', 'mobile.inactive': 'このブラウザではモバイル表示がオフです。',
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
    return h('div', { className: 'dsh-pwa-group dsh-pwa-install' },
      h('div', { className: 'dsh-pwa-identity' },
        h('img', { src: './pwa/apple-touch-icon.png', width: 44, height: 44, alt: '' }),
        h('div', null,
          h('h4', { className: 'dsh-pwa-title' }, t('pwa.title')),
          h('p', { className: 'dsh-pwa-state', role: status === 'failed' || status === 'insecure' ? 'alert' : 'status' }, t(`pwa.${status}`)))),
      !state.installed && h('p', { className: 'dsh-pwa-desc' }, t(state.ios ? 'pwa.ios' : 'pwa.manual')),
      state.outcome && h('p', { className: 'dsh-pwa-state', role: 'status' }, t(`pwa.${state.outcome}`)),
      h('div', { className: 'dsh-pwa-actions' },
        state.prompt && !state.installed && state.secure && h(Button, { size: 'sm', variant: 'primary', onClick: () => { void install.install() } }, t('pwa.install')),
        h(Button, { size: 'sm', variant: 'outline', disabled: state.check === 'checking', onClick: () => { void install.check() } }, t('pwa.check'))))
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
        const quiet = ['applied', 'failed', 'cancelled', 'overridden', 'idle', 'current', 'no-release', 'available', 'blocked'].includes(state.status)
        if (state.requestId && !quiet) this.remember(state.requestId)
        else if (quiet) {
          this.requestId = undefined
          try { const key = this.key(); if (key) this.storage?.removeItem(key) } catch {}
        }
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
  /* Mobile layout: stored per browser; mobile and touch attributes scope host UI rules independently. */
  const MODES = ['auto', 'on', 'off'], MODE_KEY = 'dsh-pwa:mobile-ui'
  // Phones in landscape are wider than 767px but too short for the desktop frame.
  const NARROW = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)'
  // A visual viewport this much shorter than the window is treated as an open on-screen keyboard.
  const TOUCH = '(any-pointer: coarse)', KEYBOARD_MIN = 120
  function createStore(state) {
    const listeners = new Set()
    return {
      get: () => state,
      set(patch) {
        if (Object.keys(patch).every(key => patch[key] === state[key])) return
        state = { ...state, ...patch }
        for (const listener of listeners) listener()
      },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
      clear() { listeners.clear() },
    }
  }
  class MobileController {
    constructor({ storage, matchMedia, root, viewport, view } = {}) {
      if (storage === undefined) { try { storage = globalThis.localStorage } catch {} }
      this.storage = storage; this.root = root ?? globalThis.document?.documentElement; this.listeners = new Set()
      this.view = view ?? globalThis; this.closed = false
      this.document = this.view.document ?? globalThis.document
      this.viewport = viewport === undefined ? globalThis.visualViewport : viewport
      // open: the surface covering the conversation; inline: menu buttons mounted in conversation headers.
      this.chrome = createStore({ open: null, inline: 0 })
      this.menus = new Set()
      let mode
      try { mode = storage?.getItem(MODE_KEY) } catch {}
      const match = matchMedia ?? globalThis.matchMedia
      this.query = match?.(NARROW); this.touchQuery = match?.(TOUCH); this.touch = false
      this.onViewport = () => this.measure()
      this.viewport?.addEventListener?.('resize', this.onViewport)
      this.viewport?.addEventListener?.('scroll', this.onViewport)
      this.onChange = () => this.update()
      this.query?.addEventListener?.('change', this.onChange)
      this.touchQuery?.addEventListener?.('change', this.onChange)
      this.onFocusIn = event => {
        if (this.tracking && this.keyboard) this.revealModalInput(event.target)
      }
      this.document?.addEventListener?.('focusin', this.onFocusIn, true)
      this.state = { mode: MODES.includes(mode) ? mode : 'auto', active: false }
      this.update(this.state.mode)
    }
    get tracking() { return !this.closed && (!!this.state?.active || this.touch) }
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
      this.touch = !!this.touchQuery?.matches
      this.root?.toggleAttribute?.('data-dsh-touch', this.touch)
      const changed = mode !== this.state.mode || active !== this.state.active
      if (changed) this.state = { mode, active }
      this.measure(); this.syncToolbar()
      if (!changed) return
      if (!active) this.chrome.set({ open: null })
      for (const listener of this.listeners) listener()
    }
    /** Size the app to the visual viewport, which excludes an on-screen keyboard. */
    measure() {
      const style = this.root?.style, viewport = this.viewport
      if (!style) return
      if (!this.tracking || !viewport) {
        style.removeProperty('--dsh-pwa-viewport'); style.removeProperty('--dsh-pwa-shift')
        this.root.removeAttribute?.('data-dsh-mobile-keyboard')
        this.root.removeAttribute?.('data-dsh-pwa-compact'); this.keyboard = false
        return
      }
      // Pinch zoom also moves the visual viewport; keep the last unzoomed frame.
      if (Math.abs((viewport.scale ?? 1) - 1) > 0.01) return
      const height = Math.round(viewport.height), top = Math.max(0, Math.round(viewport.offsetTop ?? 0))
      // Read window geometry before CSS writes: innerHeight can otherwise force layout.
      const windowHeight = this.view?.innerHeight, width = Math.round(viewport.width ?? this.view?.innerWidth ?? 0)
      const keyboard = typeof windowHeight === 'number' && windowHeight - height > KEYBOARD_MIN
      style.setProperty('--dsh-pwa-viewport', `${height}px`)
      // iOS pans the visual viewport over the page when the keyboard opens. Move the
      // app with it, or the shortened app stays at the top and the visible area is blank.
      if (top) style.setProperty('--dsh-pwa-shift', `translateY(${top}px)`)
      else style.removeProperty('--dsh-pwa-shift')
      this.keyboard = keyboard
      this.root.toggleAttribute?.('data-dsh-mobile-keyboard', keyboard)
      this.root.toggleAttribute?.('data-dsh-pwa-compact', height <= 260 && width >= Math.max(480, height * 2))
      if (keyboard) this.revealModalInput(this.document?.activeElement)
    }
    /** Reveal modal fields only; the conversation owns composer scrolling. */
    revealModalInput(target) {
      if (!(target?.matches?.('input,textarea,[contenteditable]') || target?.isContentEditable) || target.closest?.('[data-composer-seat]') || !target.closest?.('[role=dialog][aria-modal=true]')) return
      const rect = target.getBoundingClientRect?.(), top = Math.round(this.viewport?.offsetTop ?? 0)
      const bottom = top + Math.round(this.viewport?.height ?? 0)
      if (rect && (rect.bottom > bottom || rect.top < top)) target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
    syncToolbar() { this.root?.toggleAttribute?.('data-dsh-mobile-toolbar', this.state.active && this.chrome.get().inline === 0) }
    /** Register a menu button; a conversation-header button replaces the fallback toolbar while mounted. */
    claimMenu(element, inline) {
      const entry = { element, inline: !!inline }
      this.menus.add(entry)
      if (entry.inline) this.chrome.set({ inline: this.chrome.get().inline + 1 })
      this.syncToolbar()
      return () => {
        if (!this.menus.delete(entry)) return
        if (entry.inline) this.chrome.set({ inline: Math.max(0, this.chrome.get().inline - 1) })
        this.syncToolbar()
      }
    }
    focusMenu() {
      const entry = [...this.menus].reverse().find(({ element }) => element.isConnected && !element.closest?.('[inert],[hidden]') && element.getClientRects?.().length)
      entry?.element.focus({ preventScroll: true })
    }
    dispose() {
      this.closed = true
      this.document?.removeEventListener?.('focusin', this.onFocusIn, true)
      this.touchQuery?.removeEventListener?.('change', this.onChange)
      this.viewport?.removeEventListener?.('resize', this.onViewport)
      this.viewport?.removeEventListener?.('scroll', this.onViewport)
      this.query?.removeEventListener?.('change', this.onChange)
      this.root?.style?.removeProperty('--dsh-pwa-viewport'); this.root?.style?.removeProperty('--dsh-pwa-shift')
      for (const name of ['data-dsh-mobile', 'data-dsh-touch', 'data-dsh-pwa-compact', 'data-dsh-mobile-toolbar', 'data-dsh-mobile-keyboard']) this.root?.removeAttribute?.(name)
      this.listeners.clear(); this.chrome.clear(); this.menus.clear()
    }
  }
  // Internal DOM seam: official ui-layout and ui-conversation, checked on 0.2.1-alpha.3 and 0.2.1-rc.2.
  // There is no public mobile-presentation API. Keep state in ctx.layout and
  // style only stable slot/data markers; never copy or replace the DSH shell.
  const FRAME = '[data-slot=root] > div', CENTER = ':scope > div:has(> [data-slot=main])', M = 'html[data-dsh-mobile]', T = 'html[data-dsh-touch]'
  const HEADER = '[data-slot="conversation.header"] > header', SETTINGS = '[data-shortcut-modal=settings]'
  const SAFE_L = 'env(safe-area-inset-left,0px)', SAFE_R = 'env(safe-area-inset-right,0px)', SAFE_B = 'env(safe-area-inset-bottom,0px)'
  const mobileCss = `
    ${T},${T} body,${M},${M} body{overscroll-behavior:none}
    ${T} [data-conversation-scroll]{overscroll-behavior-y:contain}
    /* Workspace/session actions otherwise require hover. A touch row tap opens
       the session (and dismisses the mobile drawer), so it cannot reveal them. */
    ${T} [data-slot=sidebar] [data-row-key]>span:has(button){display:flex!important}
    /* Enlarge the file/document seats on touch, not every panel button: tab
       chrome has a separate constrained layout that cannot safely grow here. */
    ${T} [data-files-entry]>button{min-height:44px}
    ${T} [data-files-state=tree]>div:has(>[data-files-reload]),${T} [data-textpreview-state=text]>div:has([data-document-viewer-menu]){height:48px}
    ${T} [data-files-reload],${T} [data-document-viewer-menu],${T} [data-textpreview-tool]{min-width:44px;min-height:44px}
    ${T} [data-document-zoom-controls] button{min-width:44px;min-height:44px}
    ${T} [data-files-body],${T} [data-textpreview-body]{overscroll-behavior:contain}
    /* Keep the switch track unchanged; only its transparent hit region grows.
       Settings rows already separate these controls vertically. Do not apply
       this to dense toolbar icons, whose expanded regions could overlap. */
    ${T} [data-shortcut-modal=settings] button[role=switch]{position:relative;overflow:visible}
    ${T} [data-shortcut-modal=settings] button[role=switch]::after{content:"";position:absolute;left:min(0px,calc((100% - 44px)/2));top:min(0px,calc((100% - 44px)/2));width:100%;height:100%;min-width:44px;min-height:44px;pointer-events:auto}
    /* These sibling overlays forward wheel, not touch, to the conversation.
       Pass coarse-primary input through instead of starting an accidental resize.
       A mouse-primary hybrid keeps its width controls. */
    @media(pointer:coarse){${T} [data-width-handle]{pointer-events:none}}
    /* Message and code chrome uses 24/28px desktop buttons. Enlarge only these
       stable seats on touch; wrapping preserves the clock on narrow phones. */
    ${T} [data-conversation-scroll] [data-clock]{height:auto;min-height:44px;flex-wrap:wrap}
    ${T} [data-conversation-scroll] [data-clock] button,${T} [data-code-block-banner] button{min-width:44px;min-height:44px;flex-shrink:0}
    ${T} [data-code-block-banner]{min-height:44px}
    ${T} button[data-turn-process],${T} button[data-process-activity],${T} [data-slot="tool.call.toolview"] [role=button][data-expandable=true]{min-height:44px}
    :where(${T}) *{touch-action:manipulation}
    ${M}{--dsh-pwa-drawer:min(86vw,320px);--dsh-pwa-top:env(safe-area-inset-top,0px);--dsh-pwa-cover:0px;-webkit-tap-highlight-color:transparent}
    ${M}[data-dsh-mobile-toolbar]{--dsh-pwa-top:calc(52px + env(safe-area-inset-top,0px));--dsh-pwa-cover:var(--dsh-pwa-top)}
    :is(${M},${T}) #root{height:var(--dsh-pwa-viewport,100dvh)!important;min-height:0;transform:var(--dsh-pwa-shift,none)}
    ${M} ${FRAME}{grid-template-columns:0 minmax(0,1fr) 0!important;box-sizing:border-box;padding-top:var(--dsh-pwa-top);transition:none!important}
    ${M} ${FRAME}>div:has(>[data-slot=main]){grid-column:2;grid-row:1;min-width:0;min-height:0;transform:none!important;border-radius:0;box-sizing:border-box;padding-inline:${SAFE_L} ${SAFE_R}}
    ${M} ${FRAME}>div:has(>[data-slot=sidebar]){position:fixed;top:var(--dsh-pwa-cover);left:0;width:calc(var(--dsh-pwa-drawer) + ${SAFE_L});height:calc(var(--dsh-pwa-viewport,100dvh) - var(--dsh-pwa-cover));z-index:30;box-sizing:border-box;padding:calc(var(--dsh-pwa-top) - var(--dsh-pwa-cover)) 0 ${SAFE_B} ${SAFE_L};background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-base));transform:translateX(-100%);visibility:hidden;transition:transform .2s ease,visibility 0s linear .2s}
    ${M} ${FRAME}:not([data-sidebar-collapsed])>div:has(>[data-slot=sidebar]){transform:none;visibility:visible;transition-delay:0s;box-shadow:8px 0 24px #0002}
    ${M} [data-slot=sidebar]>div{width:100%!important}
    ${M} [data-slot=sidebar] button{min-width:44px;min-height:44px}
    /* The host tree hides all row actions behind :hover. A phone has no hover:
       expose its menu, while duplicate quick actions stay available in that menu. */
    ${M} [data-slot=sidebar] [data-row-key^="workspace:"],${M} [data-slot=sidebar] [data-row-key^="session:"]{height:44px;min-height:44px}
    ${M} [data-slot=sidebar] [data-row-key]>span:has(button){height:auto!important;gap:0!important}
    ${M} [data-slot=sidebar] [data-row-key^="session:"]>span:has(button)>[data-slot]{display:none!important}
    /* Resize the header's clipping wrappers with its buttons, not only their
       hit targets. The host collapses these wrappers when search is expanded. */
    ${M} [data-slot="sidebar.workspaces"]>div>div:has(input){min-height:52px}
    ${M} [data-slot="sidebar.workspaces"]>div>div:has(input)>div:has(button[aria-expanded="false"]){min-width:44px;max-width:44px}
    ${M} [data-slot="sidebar.workspaces"]>div>div:has(input)>div:has(button[aria-expanded="true"]){min-width:0;max-width:100%}
    ${M} [data-slot="sidebar.workspaces"]>div>div:has(input):has(button[aria-expanded="false"])>div:has(button):not(:has(input)){max-width:92px}
    ${M} [data-slot=sidebar] div:has(>button[aria-expanded]):has(>input){height:44px}
    ${M} [role=menu] [role=menuitem]{min-height:44px;box-sizing:border-box}
    ${M} ${FRAME}>[data-rightbar-col]{grid-column:3;grid-row:1}
    ${M} [data-sidebar-right-panel]{width:100vw!important;max-width:100vw!important;--dsh-sidebar-width:100vw!important;box-sizing:border-box;padding:0 ${SAFE_R} ${SAFE_B} ${SAFE_L}}
    ${M} ${FRAME}>div[data-side]{display:none!important}
    ${M} ${HEADER}{min-height:0;padding:6px 20px 0 6px}
    ${M} ${HEADER}:not(:has([data-conversation-tabs])){padding-bottom:6px}
    ${M} [data-conversation-header-leading]:empty{display:none}
    ${M} [data-conversation-tabs]{margin-top:2px;padding-left:10px;gap:28px}
    @media (min-width:560px) and (max-height:500px){
      ${M} ${HEADER}:has([data-conversation-tabs]){grid-template-columns:auto minmax(0,1fr) auto}
      ${M} ${HEADER} [data-conversation-tabs]{grid-column:3;grid-row:1;align-self:end;margin:0 0 0 16px;padding-left:0}
    }
    ${M} [data-composer-seat]{min-width:0;padding-bottom:${SAFE_B}}
    ${M}[data-dsh-mobile-keyboard] [data-composer-seat]{padding-bottom:0}
    ${M} [data-composer-input],${M} input,${M} textarea,${M} select{font-size:max(16px,1em)}
    /* Composer controls keep a finger-sized target on touch screens, including
       tablets using the stock layout. Inline editor chips keep their own size. */
    ${T} [data-composer-card] button:not([contenteditable] button):not([data-slot="conversation.input.attachments"] button),${T} [data-composer-seat] button[aria-haspopup=dialog]{min-width:44px;min-height:44px}
    ${T} [id^=dsh-slash-option-]{min-height:44px}
    ${M}[data-dsh-mobile-keyboard] [data-composer-dock]{display:none}
    /* The stock 336px editor cap can exceed the whole keyboard-reduced phone
       viewport. Reserve the header, action row and statistics before growing. */
    ${T} [data-input-scroll]{max-height:min(336px,max(36px,calc(var(--dsh-pwa-viewport,100dvh) - 260px)))}
    /* /model and /permission use an inline filtered picker, not the portalled
       toolbar menus. On phones it needs a visible-viewport surface of its own. */
    ${M} [data-composer-seat]:has([data-composer-overlay] [data-menu-material]>input){z-index:25}
    ${M} [data-composer-overlay] [data-menu-material]:has(>input){position:fixed!important;left:12px;right:12px;top:calc(var(--dsh-pwa-top,0px) + 80px);bottom:auto;width:auto;max-width:calc(100vw - 24px);max-height:calc(var(--dsh-pwa-viewport,100dvh) - var(--dsh-pwa-top,0px) - 96px)!important}

    /* Stock tablet tables hide native x overflow; keep vertical scroll chaining. */
    :is(${M},${T}) .md-table-wide{overflow-x:auto!important;padding-bottom:0!important;overscroll-behavior-x:contain}
    ${T} [data-conversation-scroll] div:has(>table){overflow-x:auto}
    ${M} [data-slot=main] table :is(th,td){max-width:min(60vw,320px)}
    /* The question footer's pager and actions cannot share one row on small
       phones. Wrap the groups instead of clipping Submit at the card edge. */
    ${M} [data-question-key]>section>footer{flex-wrap:wrap;gap:8px}
    ${M} [data-question-key]>section>footer>div:last-child{margin-left:auto}
    ${M} ${SETTINGS}{position:relative;flex-direction:column!important;width:calc(100vw - 16px - ${SAFE_L} - ${SAFE_R});max-width:none;height:calc(var(--dsh-pwa-viewport,100dvh) - 16px - env(safe-area-inset-top,0px) - ${SAFE_B});max-height:900px;min-width:0;border-radius:16px}
    ${M} ${SETTINGS}>nav{width:auto!important;min-width:0;flex:none!important;max-width:100%;padding:8px 12px 0;gap:4px;border:0}
    ${M} ${SETTINGS}>nav>div:first-child{display:flex;align-items:center;min-height:44px;max-width:calc(100% - 200px);padding:0 4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    ${M} ${SETTINGS}>nav>div:last-child{display:flex;flex-direction:row;gap:4px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none}
    ${M} ${SETTINGS}>nav>div:last-child>*{flex:none;width:auto;min-height:44px}
    ${M} ${SETTINGS}>div:last-child{flex:1 1 auto;min-height:0;min-width:0;width:auto}
    ${M} ${SETTINGS}>div:last-child>div:first-child{position:absolute;top:8px;right:8px;height:auto;max-width:calc(100% - 96px);padding:0;gap:4px;z-index:1}
    ${M} ${SETTINGS}>div:last-child>div:first-child>*{min-width:0}
    ${M} ${SETTINGS}>div:last-child>div:first-child button{white-space:nowrap}
    ${M} ${SETTINGS}>div:last-child>div:first-child button{min-width:44px;min-height:44px}
    ${M} ${SETTINGS}>div:last-child>div:last-child{padding:8px 16px calc(16px + ${SAFE_B});min-width:0;overflow:auto}
    /* Portalled modal roots otherwise center against the layout viewport, below
       the iOS keyboard. Bound the surface (not just its content) to the visible
       viewport; short screens may scroll the entire dialog to reach actions. */
    ${T} body>[role=presentation]:has(>[role=dialog][aria-modal=true]){top:0;bottom:auto;transform:var(--dsh-pwa-shift,none);height:var(--dsh-pwa-viewport,100dvh);max-height:var(--dsh-pwa-viewport,100dvh);padding:12px;box-sizing:border-box}
    ${T} body>[role=presentation]>[role=dialog][aria-modal=true]{top:auto;margin-block:0;max-height:calc(var(--dsh-pwa-viewport,100dvh) - 24px);max-width:calc(100vw - 24px);overflow-y:auto}
    ${T} [data-shortcut-modal=shortcuts]{transform:none}
    /* Keep segmented options side by side so their shared selection indicator
       remains correct, but let labels wrap inside equal touch-sized columns. */
    ${M} [data-shortcut-modal=settings] [role=tablist]{display:flex;width:100%;max-width:100%;box-sizing:border-box}
    ${M} [data-shortcut-modal=settings] [role=tablist]>[role=tab]{flex:1 1 0;white-space:normal;min-width:0;min-height:44px;height:auto;overflow-wrap:anywhere}
    :is(${M},${T}) :is(.dsh-pwa-actions button,.dsh-pwa-segment button){min-width:44px;min-height:44px}
    ${T} .dsh-pwa-link{display:flex;align-items:center;min-height:44px;max-width:100%}
    /* Emergency landscape layout: keep navigation and every composer action,
       but defer tabs/statistics until the keyboard closes. No document scrolling. */
    :is(${T},${M})[data-dsh-pwa-compact] [data-slot="conversation.header"] header{min-height:44px;padding-top:6px;padding-bottom:6px}
    :is(${T},${M})[data-dsh-pwa-compact] [data-conversation-tabs],
    :is(${T},${M})[data-dsh-pwa-compact] [data-composer-dock]{display:none}
    :is(${T},${M})[data-dsh-pwa-compact] [data-composer-card]{flex-direction:row;align-items:center;padding:4px;gap:4px}
    :is(${T},${M})[data-dsh-pwa-compact] [data-input-scroll]{flex:1;min-width:0;max-height:44px;margin:0}
    :is(${T},${M})[data-dsh-pwa-compact] [data-composer-card]>div:last-child{flex:0 1 340px;width:44vw;max-width:48%;flex-wrap:nowrap;gap:4px;padding:0}
    /* A compact viewport has no room for the normal toolbar + 80px offset.
       Give the inline picker the visible surface while it covers the composer. */
    :is(${T},${M})[data-dsh-pwa-compact] [data-composer-overlay] [data-menu-material]:has(>input){position:fixed!important;left:12px;right:12px;bottom:auto;width:auto;top:4px;max-height:calc(var(--dsh-pwa-viewport,100dvh) - 8px)!important}
    /* Trigger suggestions (the + and / lists) are a different surface from
       filtered pickers. Their anchored viewport can collapse to zero in compact
       mode; use the visible viewport and let the option list scroll internally. */
    :is(${T},${M})[data-dsh-pwa-compact] [data-composer-seat]:has([data-trigger-menu]){z-index:25}
    :is(${T},${M})[data-dsh-pwa-compact] [data-composer-overlay] [data-trigger-menu]{position:fixed!important;left:12px!important;right:12px!important;top:4px!important;bottom:auto!important;width:auto!important;max-width:calc(100vw - 24px);height:calc(var(--dsh-pwa-viewport,100dvh) - 8px)!important;max-height:calc(var(--dsh-pwa-viewport,100dvh) - 8px)!important;display:flex;flex-direction:column;overflow:hidden;z-index:40}
    :is(${T},${M})[data-dsh-pwa-compact] [data-trigger-menu] [role=listbox]{flex:1 1 auto;height:auto!important;min-height:0;max-height:none!important;overflow-y:auto}
    .dsh-pwa-toolbar{position:fixed;top:0;left:0;right:0;height:var(--dsh-pwa-top);padding:env(safe-area-inset-top,0px) max(8px,${SAFE_R}) 0 max(8px,${SAFE_L});box-sizing:border-box;display:flex;align-items:center;gap:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-bottom:.5px solid var(--dsw-alias-border-l3);pointer-events:auto}
    .dsh-pwa-toolbar strong{font-size:14px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dsh-pwa-menu{border:0;padding:0;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:var(--dsw-alias-label-primary);background:transparent;cursor:pointer;flex:none;-webkit-app-region:no-drag}
    .dsh-pwa-menu-inline{width:40px;height:40px;margin:-5px 0;border-radius:10px}
    .dsh-pwa-menu:active{background:var(--dsw-alias-interactive-bg-active)}
    .dsh-pwa-menu:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-3px}
    @media (hover:hover){.dsh-pwa-menu:hover{background:var(--dsw-alias-interactive-bg-hover)}}
    .dsh-pwa-scrim{position:fixed;top:var(--dsh-pwa-cover);left:calc(var(--dsh-pwa-drawer) + ${SAFE_L});right:0;height:calc(var(--dsh-pwa-viewport,100dvh) - var(--dsh-pwa-cover));border:0;padding:0;background:#0005;pointer-events:auto}
    ${M}:has(${FRAME}[data-sidebar-collapsed]) .dsh-pwa-scrim{display:none}
    @media (prefers-reduced-motion:reduce){${M} ${FRAME}>div,${M} [data-sidebar-right-panel] *{transition:none!important;animation:none!important}}
  `
  const settingsCss = `
    .dsh-pwa-settings{display:grid;min-width:0}
    .dsh-pwa-group{display:grid;gap:8px;min-width:0;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
    .dsh-pwa-group:first-child{padding-top:0}
    .dsh-pwa-group:last-child{border-bottom:0}
    .dsh-pwa-settings :is(h4,p){margin:0;overflow-wrap:anywhere}
    .dsh-pwa-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}
    .dsh-pwa-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
    .dsh-pwa-state{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
    .dsh-pwa-state[role=alert]{color:var(--dsw-alias-state-error-primary)}
    .dsh-pwa-identity{display:flex;align-items:center;gap:12px;min-width:0}
    .dsh-pwa-identity>div{display:grid;gap:2px;min-width:0}
    .dsh-pwa-identity img{width:44px;height:44px;border-radius:10px;flex:none;box-shadow:0 0 0 .5px var(--dsw-alias-border-l3)}
    .dsh-pwa-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
    .dsh-pwa-segment{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;max-width:320px;padding:2px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-module-platform)}
    .dsh-pwa-segment button{min-width:0;min-height:32px;padding:0 8px;border:0;border-radius:calc(var(--dsw-radius-md,8px) - 2px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;cursor:pointer}
    .dsh-pwa-segment button[aria-pressed=true]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-weight:500;box-shadow:0 1px 2px #0000001f,0 0 0 .5px var(--dsw-alias-border-l3)}
    .dsh-pwa-segment button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
    @media (hover:hover){.dsh-pwa-segment button[aria-pressed=false]:hover{color:var(--dsw-alias-label-primary)}}
    .dsh-pwa-notes{display:grid;gap:8px;min-width:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
    .dsh-pwa-notes :is(h3,h4,p,ul,pre){margin:0}
    .dsh-pwa-notes h3,.dsh-pwa-notes h4{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}
    .dsh-pwa-notes ul{padding-left:1.1em}
    .dsh-pwa-notes a{color:var(--dsw-alias-link);text-decoration:none}
    .dsh-pwa-notes a:hover{text-decoration:underline}
    .dsh-pwa-notes code,.dsh-pwa-notes pre{font-family:var(--dsh-font-family-code,ui-monospace,monospace)}
    .dsh-pwa-notes pre{overflow:auto;padding:8px;border-radius:8px;background:var(--dsw-alias-bg-module-platform)}
    .dsh-pwa-link{justify-self:start;color:var(--dsw-alias-link);font-size:12px;line-height:18px;text-decoration:none}
    .dsh-pwa-link:hover{text-decoration:underline}
  `
  const icon = paths => h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', 'aria-hidden': true }, paths.map(d => h('path', { key: d, d })))
  const menuIcon = () => icon(['M4 6h16', 'M4 12h16', 'M4 18h16'])
  const closeIcon = () => icon(['M6 6l12 12', 'M18 6L6 18'])
  function toggleSidebar(ctx) { ctx.get?.('layout')?.toggleSidebar() }
  // Closing the occupant, not layout.closeRightbar(), keeps its state in sync.
  function openRightPanel(root = document) { return [...root.querySelectorAll('[data-sidebar-right-panel][data-sidebar-right-open]')].find(panel => !panel.closest('[hidden]')) }
  function closePanel() { openRightPanel()?.querySelector('button[data-sidebar-right-toggle]')?.click() }
  function useLocaleRevision(locale) { React.useSyncExternalStore(listener => locale.subscribe(listener), () => locale.getSnapshot().revision) }
  /** Inline sits in the official conversation.header.leading seat; otherwise it is the fallback toolbar button. */
  function MenuButton({ ctx, mobile, locale, inline }) {
    const { active } = React.useSyncExternalStore(mobile.subscribe, mobile.getSnapshot)
    const { open } = React.useSyncExternalStore(mobile.chrome.subscribe, mobile.chrome.get)
    useLocaleRevision(locale)
    const ref = React.useRef(null), t = locale.bind(NS)
    // Layout effect: hide the fallback toolbar before the first paint of a header button.
    React.useLayoutEffect(() => active && ref.current ? mobile.claimMenu(ref.current, inline) : undefined, [active, inline, mobile])
    if (!active) return null
    const panel = !inline && open === 'right', expanded = inline ? open === 'left' : open !== null
    const label = panel ? t('mobile.closePanel') : t(open === 'left' ? 'mobile.close' : 'mobile.menu')
    return h('button', { ref, type: 'button', className: inline ? 'dsh-pwa-menu dsh-pwa-menu-inline' : 'dsh-pwa-menu', 'aria-label': label, title: label, 'aria-expanded': expanded, onClick: panel ? closePanel : () => toggleSidebar(ctx) }, expanded && !inline ? closeIcon() : menuIcon())
  }
  function MobileChrome({ ctx, mobile, locale }) {
    const { active } = React.useSyncExternalStore(mobile.subscribe, mobile.getSnapshot)
    const { open, inline } = React.useSyncExternalStore(mobile.chrome.subscribe, mobile.chrome.get)
    useLocaleRevision(locale)
    const t = locale.bind(NS)
    React.useEffect(() => {
      if (!active) return
      const frame = document.querySelector(FRAME)
      if (!frame) return
      const center = frame.querySelector(CENTER), sidebar = frame.querySelector(':scope > div:has(> [data-slot=sidebar])')
      const right = frame.querySelector('[data-rightbar-col]')
      const originalInert = new Map([center, sidebar].filter(Boolean).map(el => [el, el.inert]))
      const isOpen = () => !frame.hasAttribute('data-sidebar-collapsed')
      let previous = null, timer
      let drawerOpener = null, returnFromRight = false
      const sync = () => {
        const next = right && openRightPanel(right) ? 'right' : isOpen() ? 'left' : null
        mobile.chrome.set({ open: next })
        if (center) center.inert = originalInert.get(center) || next !== null
        if (sidebar) sidebar.inert = originalInert.get(sidebar) || next !== 'left'
        // The header menu is inside center: wait until the right occupant closes
        // and center is no longer inert before returning Escape focus to it.
        if (returnFromRight && next !== 'right') {
          returnFromRight = false
          if (!document.querySelector('[role=dialog],[role=menu]')) mobile.focusMenu()
        }
        // Return focus only when it was inside the surface that is closing.
        if (previous !== 'left' && next === 'left' && !document.querySelector('[role=dialog]')) sidebar?.querySelector('button')?.focus({ preventScroll: true })
        if (previous === 'left' && next !== 'left' && sidebar?.contains(document.activeElement)) mobile.focusMenu()
        if (next !== 'left') {
          // Right-panel mutations can arrive before DSH commits the collapse.
          // Do not clear the close guard while a hidden drawer is still open.
          if (!isOpen()) { closing = false; clearTimeout(closingTimer) }
          drawerOpener = null
        }
        if (next === 'right' && isOpen()) close()
        previous = next
      }
      // Hold the guard until the collapsed attribute updates. A second toggle in the
      // same turn (route observer plus the session click) would otherwise reopen it.
      let closing = false
      let closingTimer
      const close = () => {
        if (!isOpen() || closing) return
        closing = true
        clearTimeout(closingTimer)
        closingTimer = setTimeout(() => { closing = false }, 500)
        toggleSidebar(ctx)
      }
      // Observe geometry only, not streaming messages or the conversation subtree.
      const watch = new MutationObserver(sync)
      watch.observe(frame, { attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
      if (right) watch.observe(right, { subtree: true, attributes: true, attributeFilter: ['data-sidebar-right-open', 'hidden'], childList: true })
      const info = ctx.get?.('layout')?.panelInfo
      let panel = info?.getSnapshot().activePanelId
      const offPanel = info?.subscribe(() => { const next = info.getSnapshot().activePanelId; if (next !== panel) { panel = next; close() } })
      // A menu portaled out of the sidebar is still a drawer action (rename, confirm).
      let fromDrawer = false
      let dialogFromDrawer = false
      let drawerFocusAt = 0
      const rememberOpener = target => {
        if (!target?.closest?.('[data-slot=sidebar]')) return
        const control = target.closest?.('button, a, input, textarea, select, [tabindex]')
        if (control instanceof HTMLElement) drawerOpener = control
      }
      const noteDrawerGesture = event => {
        fromDrawer = !!event.target?.closest?.('[data-slot=sidebar], [role=menu]')
        rememberOpener(event.target)
      }
      const noteDrawerFocus = event => {
        const sidebar = document.querySelector('[data-slot=sidebar]')
        if (sidebar?.contains(event.target)) drawerFocusAt = Date.now()
        rememberOpener(event.target)
      }
      const focusInSidebar = () => {
        const sidebar = document.querySelector('[data-slot=sidebar]')
        const focused = !!(sidebar && document.activeElement && sidebar.contains(document.activeElement))
        // The dialog moves focus before the mutation observer runs, so the recent sidebar focus still counts.
        return focused || Date.now() - drawerFocusAt < 1000
      }
      const onClick = event => {
        noteDrawerGesture(event)
        rememberOpener(event.target)
        const target = event.target
        if (!target.closest?.('[data-slot=sidebar]')) return
        const newSession = target.closest('button')?.getAttribute('aria-label') === locale.bind('sidebar')('session.new.label')
        const nav = target.closest('nav button')
        const session = target.closest('[data-row-key^="session:"]') && !target.closest('button,input')
        // Search reselection can leave both the route and main child unchanged.
        const searchSession = target.closest('[role=treeitem][aria-selected]') && !target.closest('[data-row-key]') && !target.closest('button,input')
        const group = target.closest('[data-row-key^="workspace:"]')
        // rc.2 workspace actions end with New session; the preceding menu stays open.
        const workspaceNew = group && target.closest('button') === [...group.querySelectorAll('button')].at(-1)
        // The second click of a title double-click opens rename. Leave the drawer up.
        if (event.detail > 1) { clearTimeout(timer); return }
        if (newSession || nav || searchSession || workspaceNew) { clearTimeout(timer); timer = setTimeout(close) }
        else if (session) { clearTimeout(timer); timer = setTimeout(close, 400) }
      }
      const onDialog = node => {
        if (!openedDialog(node)) return
        if (drawerDialogKeepsDrawer({ settings: settingsDialog(node), modal: true, fromDrawer, focusInSidebar: focusInSidebar() })) {
          dialogFromDrawer = true
          clearTimeout(timer)
          armDialogWatch()
          return
        }
        dialogFromDrawer = false
        if (drawerShouldClose({ open: isOpen(), modal: true })) close()
      }
      const onKey = event => {
        if (event.key !== 'Escape') return
        const modal = !!document.querySelector('[role=dialog][aria-modal="true"]')
        const menuOpen = !!document.querySelector('[role=menu]')
        // Settings still closes with the drawer. A dialog opened from the drawer stays, so focus can return.
        if (modal) {
          if (!dialogFromDrawer && drawerShouldClose({ open: isOpen(), modal: true })) close()
          return
        }
        if (menuOpen || event.defaultPrevented) return
        if (previous === 'right') { event.preventDefault(); returnFromRight = true; closePanel() }
        else if (previous === 'left') { event.preventDefault(); close(); mobile.focusMenu() }
      }
      document.addEventListener('pointerdown', noteDrawerGesture, true)
      document.addEventListener('focusin', noteDrawerFocus, true)
      document.addEventListener('click', onClick, true)
      window.addEventListener('keydown', onKey, true)
      // Pending focus returns are owned by this effect; cleanup cancels them so a
      // late callback cannot move focus after the drawer surface unmounts.
      let disposed = false, restoreFrame, restoreTimeout
      const restoreDrawerFocus = () => {
        const opener = drawerOpener
        const back = () => {
          if (disposed) return
          if (document.querySelector('[role=dialog][aria-modal="true"]')) return
          if (!(opener instanceof HTMLElement) || !opener.isConnected || opener.closest('[inert]')) return
          // The row action is display:none until the row is hovered, and a collapsed copy of the row has no box. Focus the visible title.
          const key = opener.closest('[data-row-key]')?.getAttribute('data-row-key')
          const visibleRow = key ? [...document.querySelectorAll(`[data-row-key="${CSS.escape(key)}"]`)].find(el => el.getClientRects().length > 0) : null
          const title = visibleRow?.querySelector('span')
          const place = opener.getClientRects().length > 0 ? opener : title
          if (!(place instanceof HTMLElement) || place.getClientRects().length === 0) return
          if (!place.hasAttribute('tabindex') && place !== opener) place.setAttribute('tabindex', '-1')
          place.focus({ preventScroll: true })
        }
        // The menu item DSH would restore is already gone, and the sidebar can still be inert in the same turn.
        back()
        cancelAnimationFrame(restoreFrame); clearTimeout(restoreTimeout)
        restoreFrame = requestAnimationFrame(back)
        restoreTimeout = setTimeout(back, 0)
      }
      let dialogWatch
      const armDialogWatch = () => {
        dialogWatch?.disconnect()
        dialogWatch = new MutationObserver(() => {
          if (document.querySelector('[role=dialog][aria-modal="true"]')) return
          dialogWatch?.disconnect()
          if (!dialogFromDrawer) return
          dialogFromDrawer = false
          restoreDrawerFocus()
        })
        dialogWatch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['role', 'aria-modal'] })
      }
      const onBody = records => {
        for (const record of records) for (const node of record.addedNodes) onDialog(node)
      }
      const bodyWatch = new MutationObserver(onBody)
      bodyWatch.observe(document.body, { childList: true })
      const main = frame.querySelector('[data-slot=main]')
      let route = `${location.pathname}${location.search}${location.hash}`
      const onRoute = () => {
        const next = `${location.pathname}${location.search}${location.hash}`
        const moved = next !== route
        route = next
        if (moved && drawerShouldClose({ open: isOpen(), route: true })) close()
      }
      const onMain = () => { if (drawerShouldClose({ open: isOpen(), route: true })) close() }
      const routeWatch = new MutationObserver(onMain)
      if (main) routeWatch.observe(main, { childList: true })
      const history = window.history
      const pushState = history?.pushState, replaceState = history?.replaceState
      if (pushState && replaceState) {
        history.pushState = function (...args) { const result = pushState.apply(this, args); onRoute(); return result }
        history.replaceState = function (...args) { const result = replaceState.apply(this, args); onRoute(); return result }
      }
      window.addEventListener('popstate', onRoute)
      window.addEventListener('hashchange', onRoute)
      if (drawerShouldClose({ open: isOpen(), modal: openedDialog(document.body) && !drawerDialogKeepsDrawer({ settings: settingsDialog(document.body), modal: true, focusInSidebar: focusInSidebar() }) })) close()
      sync()
      return () => {
        disposed = true; cancelAnimationFrame(restoreFrame); clearTimeout(restoreTimeout)
        clearTimeout(timer); clearTimeout(closingTimer); watch.disconnect(); offPanel?.(); bodyWatch.disconnect(); dialogWatch?.disconnect(); routeWatch.disconnect()
        document.removeEventListener('pointerdown', noteDrawerGesture, true); document.removeEventListener('focusin', noteDrawerFocus, true); document.removeEventListener('click', onClick, true); window.removeEventListener('keydown', onKey, true)
        window.removeEventListener('popstate', onRoute); window.removeEventListener('hashchange', onRoute)
        if (pushState && history.pushState !== pushState) history.pushState = pushState
        if (replaceState && history.replaceState !== replaceState) history.replaceState = replaceState
        for (const [el, inert] of originalInert) el.inert = inert
      }
    }, [active, ctx, locale, mobile])
    if (!active) return null
    return h(React.Fragment, null,
      open === 'left' && h('button', { type: 'button', className: 'dsh-pwa-scrim', 'aria-label': t('mobile.dismiss'), tabIndex: -1, onClick: () => toggleSidebar(ctx) }),
      inline === 0 && h('div', { className: 'dsh-pwa-toolbar' },
        h(MenuButton, { ctx, mobile, locale, inline: false }),
        h('strong', null, 'DeepSeek Harness')))
  }
  function MobileUI({ mobile, locale }) {
    const state = React.useSyncExternalStore(mobile.subscribe, mobile.getSnapshot)
    const t = locale.bind(NS)
    return h('div', { className: 'dsh-pwa-group dsh-pwa-mobile' },
      h('h4', { className: 'dsh-pwa-title' }, t('mobile.title')),
      h('p', { className: 'dsh-pwa-desc' }, t('mobile.hint')),
      h('div', { className: 'dsh-pwa-segment', role: 'group', 'aria-label': t('mobile.title') },
        MODES.map(mode => h('button', { key: mode, type: 'button', 'aria-pressed': state.mode === mode, onClick: () => mobile.setMode(mode) }, t(`mobile.${mode}`)))),
      h('p', { className: 'dsh-pwa-state', role: 'status' }, t(state.active ? 'mobile.active' : 'mobile.inactive')))
  }
  const DRAWER_CLOSE_DIALOG = '[data-shortcut-modal=settings], [role=dialog][aria-modal="true"]'
  /** Settings, or a modal dialog. A dialog without aria-modal does not close the drawer. */
  function openedDialog(node) {
    if (!node || node.nodeType !== 1) return false
    return node.matches?.(DRAWER_CLOSE_DIALOG) || !!node.querySelector?.(DRAWER_CLOSE_DIALOG)
  }
  function settingsDialog(node) {
    if (!node || node.nodeType !== 1) return false
    return node.matches?.('[data-shortcut-modal=settings]') || !!node.querySelector?.('[data-shortcut-modal=settings]')
  }
  /** A confirmation or rename dialog opened from the drawer keeps it, so focus can return. Settings still closes it. */
  function drawerDialogKeepsDrawer({ settings = false, modal = false, fromDrawer = false, focusInSidebar = false } = {}) {
    if (settings || !modal) return false
    return fromDrawer || focusInSidebar
  }
  /** A finished update has no manager stage name. Other results may still show one. */
  function showUpdateStage(state) {
    return state?.status !== 'applied' && typeof state?.result?.stage === 'string' && state.result.stage.length > 0
  }
  /** Close the open drawer once for a route change, a modal dialog, or Escape. */
  function drawerShouldClose({ open, modal = false, route = false, escape = false, menu = false }) {
    if (!open) return false
    if (modal || route) return true
    return escape && !menu
  }
  /** notesByLocale wins. A string note, including one without markers, stays Japanese. A zh section is used for zh; otherwise the en section. */
  function notesForLocale(notes, locale) {
    const lang = String(locale ?? 'en').toLowerCase().split('-')[0]
    const sections = notes && typeof notes === 'object' && notes.notesByLocale && typeof notes.notesByLocale === 'object'
      ? notes.notesByLocale
      : notes && typeof notes === 'object' && typeof notes.notes === 'string'
        ? notes.notes
        : notes
    if (typeof sections === 'string') return lang === 'ja' ? sections : ''
    if (!sections || typeof sections !== 'object') return ''
    if (lang === 'ja' && sections.ja) return sections.ja
    if (lang === 'zh' && sections.zh) return sections.zh
    return sections.en || ''
  }
  function releaseNoteBlocks(markdown) {
    const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n')
    const blocks = []
    let para = [], list = [], code = null
    const flushPara = () => { if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = [] } }
    const flushList = () => { if (list.length) { blocks.push({ type: 'ul', items: list }); list = [] } }
    for (const line of lines) {
      if (code) {
        if (line.startsWith('```')) { blocks.push({ type: 'pre', text: code.join('\n') }); code = null }
        else code.push(line)
        continue
      }
      if (line.startsWith('```')) { flushPara(); flushList(); code = []; continue }
      const heading = /^(#{1,3})\s+(.*)$/.exec(line)
      if (heading) { flushPara(); flushList(); blocks.push({ type: 'h', level: heading[1].length, text: heading[2].trim() }); continue }
      const item = /^\s*[-*]\s+(.*)$/.exec(line)
      if (item) { flushPara(); list.push(item[1].trim()); continue }
      if (!line.trim()) { flushPara(); flushList(); continue }
      flushList(); para.push(line.trim())
    }
    if (code) blocks.push({ type: 'pre', text: code.join('\n') })
    flushPara(); flushList()
    return blocks
  }
  function inlineParts(text) {
    const parts = []
    const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g
    let cursor = 0, match
    while ((match = pattern.exec(text))) {
      if (match.index > cursor) parts.push({ type: 'text', text: text.slice(cursor, match.index) })
      if (match[1]) parts.push({ type: 'a', text: match[1], href: match[2] })
      else if (match[3]) parts.push({ type: 'strong', text: match[3] })
      else parts.push({ type: 'code', text: match[4] })
      cursor = match.index + match[0].length
    }
    if (cursor < text.length) parts.push({ type: 'text', text: text.slice(cursor) })
    return parts
  }
  function inlineNodes(text, key) {
    return inlineParts(text).map((part, index) => {
      const id = `${key}-${index}`
      if (part.type === 'a') return h('a', { key: id, href: part.href, target: '_blank', rel: 'noopener noreferrer' }, part.text)
      if (part.type === 'strong') return h('strong', { key: id }, part.text)
      if (part.type === 'code') return h('code', { key: id }, part.text)
      return part.text
    })
  }
  function ReleaseNotes({ markdown }) {
    return releaseNoteBlocks(markdown).map((block, index) => {
      if (block.type === 'h') return h(block.level === 1 ? 'h3' : 'h4', { key: index }, inlineNodes(block.text, index))
      if (block.type === 'ul') return h('ul', { key: index }, block.items.map((item, itemIndex) => h('li', { key: itemIndex }, inlineNodes(item, `${index}-${itemIndex}`))))
      if (block.type === 'pre') return h('pre', { key: index }, h('code', null, block.text))
      return h('p', { key: index }, inlineNodes(block.text, index))
    })
  }
  function UpdateUI({ controller, locale }) {
    const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot)
    const t = locale.bind(NS)
    React.useEffect(() => { void controller.load() }, [controller])
    const active = ['checking', 'starting', 'preparing', 'installing'].includes(state.status)
    return h('div', { className: 'dsh-pwa-group dsh-pwa-updates' },
      h('h4', { className: 'dsh-pwa-title' }, t('updates')),
      h('p', { className: 'dsh-pwa-desc' }, `${t('version')}: ${state.runtimeVersion ?? '—'}`),
      state.installedVersion && state.installedVersion !== state.runtimeVersion && h('p', { className: 'dsh-pwa-desc' }, `${t('installed')}: ${state.installedVersion}`),
      // Blocked is a lasting state of this installation (for example a local checkout), not a failure.
      h('p', { className: 'dsh-pwa-state', role: state.status === 'failed' ? 'alert' : 'status' }, t(state.status)),
      state.reason && h('p', { className: 'dsh-pwa-desc' }, t(`reason.${state.reason}`)),
      showUpdateStage(state) && h('p', { className: 'dsh-pwa-state' }, state.result.stage),
      state.candidate && h('div', { className: 'dsh-pwa-notes' },
        h('p', null, `${state.runtimeVersion} → ${state.candidate.version} · DSH ${state.candidate.compatibility}`),
        notesForLocale(state.candidate, locale.getSnapshot().active) && h(ReleaseNotes, { markdown: notesForLocale(state.candidate, locale.getSnapshot().active) })),
      h('div', { className: 'dsh-pwa-actions' },
        h(Button, { size: 'sm', variant: 'outline', disabled: active || ['unknown', 'restart-required'].includes(state.status), onClick: () => { void controller.check() } }, t('check')),
        state.status === 'available' && h(Button, { size: 'sm', variant: 'primary', onClick: () => { void controller.begin() } }, t('install')),
        state.status === 'unknown' && h(Button, { size: 'sm', variant: 'outline', onClick: () => { void controller.load() } }, t('reconcile'))),
      h('a', { className: 'dsh-pwa-link', href: 'https://github.com/Aero123421/dsh-pwa/releases', target: '_blank', rel: 'noopener noreferrer' }, t('manual')),
      h('p', { className: 'dsh-pwa-desc' }, t('hint')))
  }
  function SettingsUI({ controller, mobile, install, locale }) {
    useLocaleRevision(locale)
    // The Settings navigation already names this section, as it does for the built-in sections.
    return h('section', { className: 'dsh-pwa-settings', 'aria-label': locale.bind(NS)('title') },
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
      style.textContent = settingsCss + mobileCss
      document.head.append(style)
      return () => style.remove()
    })
    if (controller) ctx.on('connection/reset', () => { void controller.load() })
    const t = ctx.locale.bind(NS)
    ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-pwa', order: 920, label: () => t('title') }, () => h(SettingsUI, { controller, mobile, install, locale: ctx.locale })))
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'dsh-pwa.mobile' }, () => h(MobileChrome, { ctx, mobile, locale: ctx.locale })))
    // Official seat for global navigation before the Session title; empty in stock DSH. It holds a
    // single entry, so register only while the mobile layout is active and never shadow another
    // plugin's desktop content. Priority 100 yields to ordinary registrations (default 0);
    // equal priorities throw in DSH instead of electing a winner. The fallback toolbar stays.
    ctx.slots.inject('conversation.header.leading', () => {
      let dispose = null
      const sync = () => {
        if (mobile.getSnapshot().active === !!dispose) return
        if (dispose) { dispose(); dispose = null; return }
        dispose = ctx.slots.register({ name: 'conversation.header.leading', id: 'dsh-pwa.menu', priority: 100 }, () => h(MenuButton, { ctx, mobile, locale: ctx.locale, inline: true }))
      }
      const unsubscribe = mobile.subscribe(sync)
      sync()
      return () => { unsubscribe(); dispose?.() }
    })
  }
  return { name: 'dsh-pwa', inject: ['slots', 'locale', 'connection'], apply, UpdateController, UpdateUI, MobileController, MobileChrome, MobileUI, SettingsUI, InstallController, mountPwaHead, copy, drawerShouldClose, drawerDialogKeepsDrawer, notesForLocale, releaseNoteBlocks, inlineParts, ReleaseNotes, openedDialog, showUpdateStage }
} })