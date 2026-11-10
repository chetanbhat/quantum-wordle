type AnalyticsWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] }
}

export function startAnalytics() {
  if (
    !import.meta.env.PROD ||
    import.meta.env.VITE_ANALYTICS_DISABLED === 'true' ||
    window.location.pathname === '/transfer'
  )
    return
  // Local production previews must not send test traffic to live analytics.
  if (['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname))
    return
  const target = window as AnalyticsWindow
  const addScript = (src: string, domain?: string) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    if (domain) script.dataset.domain = domain
    document.head.appendChild(script)
  }
  const google = import.meta.env.VITE_GOOGLE_MEASUREMENT_ID
  if (google && /^G-[A-Z0-9]+$/.test(google)) {
    target.dataLayer = target.dataLayer || []
    target.gtag = function () {
      target.dataLayer!.push(arguments)
    }
    target.gtag('js', new Date())
    target.gtag('config', google)
    addScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(google)}`,
    )
  }
  const clarity = import.meta.env.VITE_MICROSOFT_CLARITY_TAG_ID
  if (clarity && /^[a-z0-9]+$/i.test(clarity)) {
    target.clarity =
      target.clarity ||
      ((...args: unknown[]) => {
        ;(target.clarity!.q ||= []).push(args)
      })
    addScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarity)}`)
  }
  const plausible = import.meta.env.VITE_PLAUSIBLE_DOMAIN
  if (plausible && /^[a-z0-9.-]+$/i.test(plausible))
    addScript('https://plausible.io/js/plausible.js', plausible)
}
