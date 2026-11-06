import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps): IconProps {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export function IconToday(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3.5h9l3 3V20.5H6z" />
      <path d="M15 3.5v3h3" />
      <path d="M9 11h6M9 14.5h6M9 18h4" />
    </svg>
  )
}

export function IconHistory(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
      <circle cx="7" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="11" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconMap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3.5 6 5-2.5 7 3 5-2.5v14l-5 2.5-7-3-5 2.5z" />
      <path d="M8.5 3.5v14M15.5 6.5v14" />
      <circle cx="12" cy="11.5" r="2" />
    </svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h6M14 7h6M4 12h11M19 12h1M4 17h3M11 17h9" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4 21 20H3z" />
      <path d="M12 9v5M12 17.2v.1" />
    </svg>
  )
}

export function IconWalk(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="14.5" cy="4.8" r="1.8" />
      <path d="m12.8 8.5-2.4 5 3 2.2 1.2 4.3M10.4 13.5 7 16M13.4 15.7 16.5 18" />
      <path d="m12.8 8.5 3.2 2.2 2.4-.7" />
    </svg>
  )
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  )
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 15.5v-11M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 11a8 8 0 1 0-2.2 6" />
      <path d="M20 5v6h-6" />
    </svg>
  )
}
