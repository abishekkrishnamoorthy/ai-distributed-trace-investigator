const ICONS = {
  activity: 'M4 12h4l3-8 4 16 3-8h2',
  ai: 'M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15z',
  arrowRight: 'M5 12h14M13 5l7 7-7 7',
  barChart: 'M4 19V9M10 19V5M16 19v-7M22 19H2',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  check: 'M20 6 9 17l-5-5',
  chevronDown: 'm6 9 6 6 6-6',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  clock: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  copy: 'M8 8h11v11H8zM5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1',
  cube: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7.4 12 12l8.7-4.6M12 22V12',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  filter: 'M22 3H2l8 9.5V20l4 2v-9.5L22 3z',
  info: 'M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  layers: 'm12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  maximize: 'M8 3H3v5M21 8V3h-5M16 21h5v-5M3 16v5h5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  network: 'M6 6h12v6H6zM12 12v4M5 20h14M5 20v-4h4v4M15 20v-4h4v4',
  refresh: 'M21 12a9 9 0 0 1-15.5 6.2M3 12A9 9 0 0 1 18.5 5.8M18 2v4h-4M6 22v-4h4',
  search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  share: 'M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 4 3 3 0 0 0 0-4zM18 16a3 3 0 1 0 0 4 3 3 0 0 0 0-4zM8.6 13.1l6.8-4.2M8.6 18.9l6.8 4.2',
  sort: 'M8 7l4-4 4 4M8 17l4 4 4-4',
  sun: 'M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z',
  warning: 'M12 8v4M12 16h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  x: 'M18 6 6 18M6 6l12 12',
}

export const Icon = ({ name, size = 20 }) => (
  <svg
    className="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={ICONS[name]} />
  </svg>
)
