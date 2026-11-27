import React from 'react'

const paths = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.2 9h17.6M3.2 15h17.6" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6.2 9H2.8v6h3.4L11 19V5Z" />
      <path d="M15.2 8.6a4.8 4.8 0 0 1 0 6.8" />
      <path d="M18.3 5.6a9.1 9.1 0 0 1 0 12.8" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M11 5 6.2 9H2.8v6h3.4L11 19V5Z" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="8.6" cy="8.6" r="1.5" />
      <path d="m21 15.4-4.8-4.8L5.4 21" />
    </>
  ),
  expand: (
    <>
      <path d="M14.5 3.5h6v6M9.5 20.5h-6v-6" />
      <path d="M20.5 3.5 14 10M3.5 20.5 10 14" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  reset: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.2 4.2v5.2h5.2" />
    </>
  ),
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  arrowLeft: <path d="M19.5 12h-15M10.5 18l-6-6 6-6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  flag: (
    <>
      <path d="M5 21V3.8" />
      <path d="M5 4.2h11.2l-1.7 3.4 1.7 3.4H5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z" />
    </>
  ),
  sparkle: (
    <path d="m12 3.2 1.9 5.2 5.2 1.9-5.2 1.9L12 17.4l-1.9-5.2-5.2-1.9 5.2-1.9L12 3.2Z" />
  ),
  star: (
    <path
      d="m12 3.5 2.7 5.4 6 .9-4.3 4.2 1 5.9-5.4-2.8-5.4 2.8 1-5.9-4.3-4.2 6-.9L12 3.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  ),
  pin: (
    <>
      <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
    </>
  ),
  edit: (
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
}

export function Icon({ name, size = 18, strokeWidth = 1.7, className = '', ...rest }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
