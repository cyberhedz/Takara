import { useState, useRef, useEffect, useCallback } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardActionArea from '@mui/material/CardActionArea'
import Rating from '@mui/material/Rating'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Slider from '@mui/material/Slider'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Fab from '@mui/material/Fab'
import Divider from '@mui/material/Divider'
import SearchIcon from '@mui/icons-material/Search'
import ReorderIcon from '@mui/icons-material/Reorder'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ShareIcon from '@mui/icons-material/Share'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import AddIcon from '@mui/icons-material/Add'
import ExploreIcon from '@mui/icons-material/Explore'
import EditNoteIcon from '@mui/icons-material/EditNote'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CloseIcon from '@mui/icons-material/Close'
import LiquorIcon from '@mui/icons-material/Liquor'
import PersonIcon from '@mui/icons-material/Person'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined'
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import Drawer from '@mui/material/Drawer'
import ListItemIcon from '@mui/material/ListItemIcon'
import Switch from '@mui/material/Switch'
import { QRCodeSVG } from 'qrcode.react'
import { takaraTheme } from './theme'

// All product photography is bundled locally (src/assets) so it survives a
// production build — the previous version pointed at short-lived, single-use
// Figma MCP asset URLs (`figma.com/api/mcp/asset/...`) which expire, so the
// images silently 404 once the signed link times out.
import cardNend from './assets/card-nend.png'
import cardHizo from './assets/card-hizo.png'
import heroNend from './assets/hero-nend.png'
import botRei from './assets/bottles/rei.png'
import botNama from './assets/bottles/nama.png'
import botClassic from './assets/bottles/classic.png'
import botNigori from './assets/bottles/nigori.png'
import botHana from './assets/bottles/hana.png'
import botSgJd from './assets/bottles/sg_jd.png'
import botScbJd from './assets/bottles/scb_jd.png'
import botTokubetsu from './assets/bottles/tokubetsu.png'
import botSgTok from './assets/bottles/sg_tok.png'
import botSgKimoto from './assets/bottles/sg_kimoto.png'
import botOcean from './assets/bottles/ocean.png'
import botSkyline from './assets/bottles/skyline.png'
import botMuwa from './assets/bottles/muwa.png'
import botNend from './assets/bottles/nend.png'
import botGinjo from './assets/bottles/ginjo.png'
import botMio from './assets/bottles/mio.png'

type View = 'discover' | 'course' | 'detail' | 'journal' | 'notes' | 'cellar' | 'club' | 'profile' | 'account' | 'notifications' | 'notificationsFeed' | 'events' | 'about'
// Full-screen / drill-in views that hide the bottom nav — Notes and Cellar
// are themselves nav destinations, so they keep it.
const NO_NAV_VIEWS = new Set<View>(['detail', 'journal', 'course', 'club', 'account', 'notifications', 'notificationsFeed', 'events', 'about'])

const categories = [
  { label: 'Junmai', color: '#7a8b58' },
  { label: 'Daiginjo & Ginjo', color: '#4d8995' },
  { label: 'Nigori', color: '#9270ad' },
  { label: 'Sparkling', color: '#9270ad' },
  { label: 'Barrel-Aged', color: '#9270ad' },
]

// Mirrors the 8-card "Sake by the glass" scroller on the Figma Discover
// screen (node 73:629 → 73:633). Product-shot cards use `contain` on a
// cream backdrop so the whole bottle shows, matching Hizo Koshu's treatment;
// N-end keeps its lifestyle photo (bottle + glass), which is a scene shot,
// not a packshot.
// Prices for N-end, Hizo Koshu, Sho Chiku Bai Junmai Daiginjo, MU|WA and
// Shirakabegura Junmai Daiginjo come straight from the Figma card copy
// (node 129:9433). Premium Ginjo / Nigori / MIO aren't in that card set, so
// their prices are estimated to fit the same by-the-glass range — flag if
// the tasting-room menu has different numbers for those three.
const sakes = [
  { eyebrow: 'KIMOTO JUNMAI', price: '$20', name: 'N-end 然土', origin: 'Shirakabegura · Nada', rating: 5, image: cardNend, fit: 'cover' as const, detailKey: 'nend' },
  { eyebrow: '15 YEARS AGED SAKE', price: '$15', name: 'Hizo Koshu', origin: 'Takara Sake · Berkeley', rating: 4.3, image: cardHizo, fit: 'contain' as const, detailKey: 'hizo' },
  { eyebrow: 'JUNMAI DAIGINJO', price: '$12', name: 'Sho Chiku Bai Junmai Daiginjo', origin: 'Takara Sake · Berkeley', rating: 4.6, image: botScbJd, fit: 'contain' as const, detailKey: 'scbJd' },
  { eyebrow: 'BOURBON BARREL AGED', price: '$7', name: 'MU|WA Barrel Aged', origin: 'Takara Sake · Berkeley', rating: 4.4, image: botMuwa, fit: 'contain' as const, detailKey: 'muwa' },
  { eyebrow: 'JUNMAI DAIGINJO', price: '$7', name: 'Shirakabegura Junmai Daiginjo', origin: 'Shirakabegura · Nada', rating: 4.7, image: botSgJd, fit: 'contain' as const, detailKey: undefined },
  { eyebrow: 'PREMIUM GINJO', price: '$6', name: 'Sho Chiku Bai Premium Ginjo', origin: 'Takara Sake · Berkeley', rating: 4.2, image: botGinjo, fit: 'contain' as const, detailKey: undefined },
  { eyebrow: 'NIGORI', price: '$5', name: 'Nigori Silky Mild', origin: 'Takara Sake · Berkeley', rating: 4.1, image: botNigori, fit: 'contain' as const, detailKey: undefined },
  { eyebrow: 'SPARKLING SAKE', price: '$8', name: 'Shirakabegura MIO', origin: 'Shirakabegura · Nada', rating: 4.5, image: botMio, fit: 'contain' as const, detailKey: undefined },
]

// Full detail-page content for the four sakes with real specs on hand (three
// sourced from their shop.takarasake.com listings, one — N-end — from
// Takara's internal "Nendo" product sheet). The other four Discover cards
// fall back to a light-weight detail view built from their card data (see
// `resolveSakeDetail`), since we don't have verified specs for them yet.
type SakeDetail = {
  classification: string
  name: string
  origin: string
  rating: number
  reviewLabel: string
  image: string
  imageFit: 'cover' | 'contain'
  essentials?: [string, string][]
  note?: string
  pairings?: { heading: string; caption: string; items: string[] }
  story?: { label: string; title: string; body: string; stats?: [string, string][] }
  cta: { label: string; caption: string }
}

const sakeDetails: Record<string, SakeDetail> = {
  nend: {
    classification: 'KIMOTO JUNMAI',
    name: 'N-end 然土',
    origin: 'Shirakabegura · Nada, Hyogo',
    rating: 4.8,
    reviewLabel: '12 tasting notes',
    image: heroNend,
    imageFit: 'cover',
    essentials: [
      ['+1 · Balanced', 'SMV · 日本酒度'],
      ['1.7', 'Acidity · 酸度'],
      ['Yamada Nishiki 50%', 'Polishing · 精米歩合'],
      ['Nada, Hyogo', 'Region · 産地'],
    ],
    pairings: {
      heading: 'BEST PAIRED WITH',
      caption: "From Takara's internal tasting panel — richly flavored dishes score highest",
      items: ['Salmon roe', 'Medium-fatty tuna', 'Grilled bluefish', 'Glaze-grilled eel', 'Roast beef', 'Salt-grilled sea bream'],
    },
    story: {
      label: 'THE RICE',
      title: 'Yamada Nishiki, grown by hand in Nishiwaki',
      body: 'Grown under contract with Mr. Fujiwara, a full-time farmer in Nishiwaki City, Hyogo Prefecture, who tracks soil and sunlight data in pursuit of better rice. His cultivation practices cut methane emissions from the paddies by 69% over the growing season.',
      stats: [
        ['69%', 'less methane during cropping'],
        ['Nishiwaki', 'Hyogo Prefecture'],
      ],
    },
    cta: { label: 'Add to Tasting Journal', caption: 'Only 72 bottles · Tasting Room exclusive' },
  },
  hizo: {
    classification: '15 YEARS AGED SAKE',
    name: 'Hizo Koshu',
    origin: 'Takara Sake · Berkeley',
    rating: 4.3,
    reviewLabel: '375 ml · aged 15 years',
    image: cardHizo,
    imageFit: 'contain',
    essentials: [
      ['15.0%', 'ABV'],
      ['−23', 'SMV · sweetness'],
      ['Calrose', 'Rice'],
      ['15 years', 'Aged'],
    ],
    note: 'A rare aged koshu — 15 years of aging mellow it into a deep amber pour with a rounded, distinctly sweet character (SMV −23).',
    pairings: {
      heading: 'SUGGESTED PAIRINGS',
      caption: 'General guidance for an aged, dessert-style sake',
      items: ['Blue cheese', 'Dark chocolate', 'Dried fruit'],
    },
    cta: { label: 'Add to Tasting Journal', caption: '375 ml · Sulfite-free · Gluten-free' },
  },
  scbJd: {
    classification: 'JUNMAI DAIGINJO',
    name: 'Sho Chiku Bai Junmai Daiginjo',
    origin: 'Takara Sake · Berkeley',
    rating: 4.6,
    reviewLabel: '720 ml',
    image: botScbJd,
    imageFit: 'contain',
    essentials: [
      ['15.5%', 'ABV'],
      ['−2', 'SMV · 日本酒度'],
      ['Yamadanishiki 45%', 'Polishing · 精米歩合'],
      ['Berkeley, CA', 'Region'],
    ],
    note: 'Smooth and well-balanced with a bright ginjo bouquet — chilled, expect fruity notes of honeydew, pear, and banana with a silky, savory finish.',
    pairings: {
      heading: 'SUGGESTED PAIRINGS',
      caption: "From the product's tasting notes",
      items: ['Shellfish', 'Sushi', 'Soft cheeses (brie, cambozola)'],
    },
    cta: { label: 'Add to Tasting Journal', caption: '720 ml · Kosher · Gluten-free' },
  },
  muwa: {
    classification: 'BOURBON BARREL AGED',
    name: 'MU|WA Bourbon Barrel Aged',
    origin: 'Takara Sake · Berkeley',
    rating: 4.4,
    reviewLabel: '720 ml',
    image: botMuwa,
    imageFit: 'contain',
    essentials: [
      ['18.0%', 'ABV'],
      ['Calrose 70%', 'Polishing · 精米歩合'],
      ['Berkeley, CA', 'Region'],
      ['50–90°F', 'Serving range'],
    ],
    note: 'Aged in bourbon barrels — a core of butter-poached apple and oak wrapped in spiced custard (cinnamon, allspice, cumin), finishing on peach.',
    pairings: {
      heading: 'SUGGESTED PAIRINGS',
      caption: "From the product's tasting notes",
      items: ['Nuts & dried fruit', 'Manchego', 'Wagyu beef', 'Butter-poached lobster'],
    },
    cta: { label: 'Add to Tasting Journal', caption: '720 ml · Kosher · Gluten-free' },
  },
}

// Cards without verified specs yet fall back to a light detail view built
// from their own Discover-card data — hero, title, rating, nothing invented.
function resolveSakeDetail(sake: (typeof sakes)[number]): SakeDetail {
  if (sake.detailKey && sakeDetails[sake.detailKey]) return sakeDetails[sake.detailKey]
  return {
    classification: sake.eyebrow,
    name: sake.name,
    origin: sake.origin,
    rating: sake.rating,
    reviewLabel: sake.price,
    image: sake.image,
    imageFit: sake.fit,
    cta: { label: 'Add to Tasting Journal', caption: 'Full tasting notes coming soon' },
  }
}

// One pour in a tasting flight. `image` / `temp` / `note` are omitted for the
// non-alcoholic course, which isn't a sake flight.
type Pour = { name: string; classification: string; temp?: string; note?: string; image?: string }
type Course = {
  overline: string
  name: string
  // Figma currently shows two different prices for the same course: a short
  // one on the Discover list row, and a fuller one on the course's own detail
  // screen (a leftover from an in-progress edit upstream). Both are kept here
  // rather than silently picked, so the two screens read exactly as Figma does.
  listPrice: string
  listMeta: string
  listSummary: string
  price: string
  duration: string
  pours: string
  blurb: string
  flight: Pour[]
  showVisit: boolean
}

const courses: Course[] = [
  {
    overline: 'TASTING ROOM · BEGINNER FLIGHT',
    name: 'NEW Variety Sake Course',
    listPrice: '$15',
    listMeta: '45 min · 5 pours',
    listSummary: 'REI, Nama, Classic, Nigori, and Flavored or Plum Wine.',
    price: '$25',
    duration: '45 min',
    pours: '5 pours',
    blurb: 'A guided introduction across the whole Takara range — from a polished daiginjo to a creamy nigori and a fruit-forward finish.',
    showVisit: true,
    flight: [
      { name: 'REI Junmai Daiginjo', classification: 'Junmai Daiginjo', temp: 'Chilled', note: 'SMV +3 · light, dry, melon', image: botRei },
      { name: 'Sho Chiku Bai Organic Nama', classification: 'Junmai · unpasteurized', temp: 'Chilled', note: 'SMV +4 · fresh, lively', image: botNama },
      { name: 'Sho Chiku Bai Classic Junmai', classification: 'Junmai', temp: 'Room', note: 'SMV +3 · clean, versatile', image: botClassic },
      { name: 'Nigori Silky Mild', classification: 'Nigori', temp: 'Chilled', note: 'SMV −30 · creamy, sweet', image: botNigori },
      { name: 'HANA Lychee or Plum Wine', classification: 'Flavored — your choice', temp: 'Chilled', note: 'dessert-sweet finish', image: botHana },
    ],
  },
  {
    overline: 'TASTING ROOM · PREMIUM FLIGHT',
    name: 'Daiginjo/Junmai Course',
    listPrice: '$15',
    listMeta: '45 min · 5 pours',
    listSummary: 'REI, Shirakabegura JD, Sho Chiku Bai JD, Tokubetsu Junmai, Shirakabegura Tokubetsu',
    price: '$35',
    duration: '45 min',
    pours: '5 pours',
    blurb: 'Five premium junmai and daiginjo pours side by side — reading polish, aroma and rice character from light to rich.',
    showVisit: true,
    flight: [
      { name: 'REI Junmai Daiginjo', classification: 'Junmai Daiginjo', temp: 'Chilled', note: 'SMV +3 · white flower, benchmark', image: botRei },
      { name: 'Shirakabegura Junmai Daiginjo', classification: 'Junmai Daiginjo', temp: 'Chilled', note: 'SMV +2 · floral, silky', image: botSgJd },
      { name: 'Sho Chiku Bai Junmai Daiginjo', classification: 'Junmai Daiginjo', temp: 'Chilled', note: 'SMV +4 · pear, crisp', image: botScbJd },
      { name: 'Sho Chiku Bai Tokubetsu Junmai', classification: 'Tokubetsu Junmai', temp: 'Room', note: 'SMV +5 · umami, dry', image: botTokubetsu },
      { name: 'Shirakabegura Tokubetsu Junmai', classification: 'Tokubetsu Junmai', temp: 'Warm', note: 'SMV +6 · rice-forward, savoury', image: botSgTok },
    ],
  },
  {
    overline: 'TASTING ROOM · SMALL-BATCH FLIGHT',
    name: 'A One-of-a-Kind Sake Course',
    listPrice: '$20',
    listMeta: '45 min · 5 pours',
    listSummary: 'REI, N-end, Ocean View, Skyline, MU|WA Barrel Aged',
    price: '$45',
    duration: '45 min',
    pours: '5 pours',
    blurb: 'Berkeley experiments and limited pressings you can only taste in the room — anchored by the barrel-aged MU|WA.',
    showVisit: true,
    flight: [
      { name: 'REI Junmai Daiginjo', classification: 'Junmai Daiginjo', temp: 'Chilled', note: 'SMV +3 · benchmark pour', image: botRei },
      { name: 'N-end 然土', classification: 'Kimoto Junmai', temp: 'Room', note: 'SMV +1 · earthy, wild yeast', image: botNend },
      { name: 'Ocean View Junmai', classification: 'Junmai', temp: 'Chilled', note: 'SMV +2 · crisp, saline', image: botOcean },
      { name: 'Skyline Junmai', classification: 'Junmai', temp: 'Chilled', note: 'SMV +1 · soft, rounded', image: botSkyline },
      { name: 'MU|WA Bourbon Barrel Aged', classification: 'Barrel-aged Junmai', temp: 'Room', note: 'SMV −2 · oak, vanilla, warmth', image: botMuwa },
    ],
  },
  {
    overline: 'TASTING ROOM · NON-ALCOHOLIC',
    name: 'Non-Drinkers',
    listPrice: 'Free',
    listMeta: 'with any course',
    listSummary: 'Sparkling Water, Crackers (Regular or Gluten-Free)',
    price: '$15',
    duration: 'with any course',
    pours: '5 items',
    blurb: 'Come to the table without a pour. Included free for anyone joining a guest on a paid flight.',
    showVisit: false,
    flight: [
      { name: 'Sparkling Water', classification: 'Chilled · bottomless' },
      { name: 'Still Water', classification: 'Room or chilled' },
      { name: 'Rice Crackers', classification: 'Regular' },
      { name: 'Rice Crackers', classification: 'Gluten-free' },
      { name: 'Museum & Brewery Walk', classification: 'Self-guided · about 15 min' },
    ],
  },
]

const palateLeans = [
  { label: 'Sweetness', descriptor: 'Distinctly dry', value: 26 },
  { label: 'Body', descriptor: 'Smooth & creamy', value: 82 },
  { label: 'Aroma', descriptor: 'Moderately aromatic', value: 55 },
  { label: 'Finish', descriptor: 'Crisp & clean', value: 70 },
]
const classificationBreakdown = [
  { label: 'Junmai Daiginjo', percent: 34, color: '#8e6bb0' },
  { label: 'Junmai', percent: 24, color: '#7a8c5a' },
  { label: 'Nigori', percent: 18, color: '#9aa3ad' },
  { label: 'Sparkling', percent: 14, color: '#3e7c8b' },
  { label: 'Barrel-Aged', percent: 10, color: '#b07b3c' },
]
const tastingHistory = [
  { name: 'N-end 然土', origin: 'Shirakabegura · Nada', rating: 5.0, date: 'Sep 8', image: botNend },
  { name: 'Sho Chiku Bai REI', origin: 'Takara Sake · Berkeley', rating: 4.8, date: 'Yesterday', image: botRei },
  { name: 'Ocean View', origin: 'Takara Sake · Berkeley', rating: 4.4, date: 'Sep 6', image: botOcean },
  { name: 'Shirakabegura Kimoto Junmai', origin: 'Takara Shuzo · Kyoto', rating: 4.6, date: 'Sep 1', image: botSgKimoto },
  { name: 'MU|WA Bourbon Barrel Aged', origin: 'Takara Sake · Berkeley', rating: 4.3, date: 'Aug 28', image: botMuwa },
]

// Cellar: bottles saved or wished-for. Reuses the same bottle photography as
// the rest of the app.
const cellarItems = [
  { name: 'N-end 然土', classification: 'Kimoto Junmai', status: 'In Cellar' as const, image: botNend },
  { name: 'Hizo Koshu', classification: '15yr Aged', status: 'In Cellar' as const, image: cardHizo },
  { name: 'Sho Chiku Bai JD', classification: 'Junmai Daiginjo', status: 'Wishlist' as const, image: botScbJd },
  { name: 'MU|WA Barrel Aged', classification: 'Bourbon Barrel', status: 'In Cellar' as const, image: botMuwa },
  { name: 'Shirakabegura JD', classification: 'Junmai Daiginjo', status: 'Wishlist' as const, image: botSgJd },
  { name: 'Skyline Junmai', classification: 'Junmai', status: 'In Cellar' as const, image: botSkyline },
]

// A horizontally sliding "rail" — the touch/trackpad scroll-snap carousel
// behind Figma's Scroller frame (node 73:633). Beyond a plain `overflowX:
// auto` row, it snaps each card into place, exposes prev/next affordances
// once there's somewhere to go, and lets a mouse drag the rail the same way
// a finger would on touch — a plain overflow row has no drag gesture on
// desktop, which is where the Figma "scroll and see more" affordance would
// otherwise go unnoticed.
function Rail({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false, pointerId: 0 })

  const updateEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateEdges()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateEdges, { passive: true })
    const observer = new ResizeObserver(updateEdges)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      observer.disconnect()
    }
  }, [updateEdges])

  const scrollByStep = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-rail-card]')
    const step = card ? card.getBoundingClientRect().width + 14 : el.clientWidth * 0.8
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  // Mouse/trackpad drag-to-scroll. Touch keeps its native momentum scroll —
  // this only takes over for pointerType 'mouse', where dragging the rail
  // isn't otherwise possible. Capture is acquired lazily, only once real
  // movement is seen — grabbing it unconditionally on every pointerdown
  // interfered with the plain-click hit-test on the cards underneath, so a
  // tap that never dragged stopped reaching CardActionArea's onClick.
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const el = trackRef.current
    if (!el) return
    drag.current = { active: true, startX: event.clientX, startScroll: el.scrollLeft, moved: false, pointerId: event.pointerId }
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current.active) return
    const el = trackRef.current
    if (!el) return
    const delta = event.clientX - drag.current.startX
    if (!drag.current.moved && Math.abs(delta) > 3) {
      drag.current.moved = true
      try { el.setPointerCapture(drag.current.pointerId) } catch { /* pointer already released */ }
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startScroll - delta
  }
  const endDrag = () => { drag.current.active = false }
  // Swallow the click a drag ends on, so dragging a card doesn't also select it.
  const onClickCapture = (event: React.MouseEvent) => {
    if (drag.current.moved) { event.stopPropagation(); event.preventDefault(); drag.current.moved = false }
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack
        ref={trackRef}
        direction="row"
        spacing={1.75}
        onClickCapture={onClickCapture}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        sx={{
          px: 3, pt: 1.75, pb: 1,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollPadding: '0 24px',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          cursor: canScrollLeft || canScrollRight ? 'grab' : 'default',
          '&:active': { cursor: canScrollLeft || canScrollRight ? 'grabbing' : 'default' },
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {children}
      </Stack>
      {canScrollLeft && (
        <IconButton
          aria-label="Scroll left"
          onClick={() => scrollByStep(-1)}
          size="small"
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'absolute', left: 8, top: '38%', transform: 'translateY(-50%)',
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            boxShadow: '0 4px 12px -2px rgba(33,28,18,.18)',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      )}
      {canScrollRight && (
        <IconButton
          aria-label="Scroll right"
          onClick={() => scrollByStep(1)}
          size="small"
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'absolute', right: 8, top: '38%', transform: 'translateY(-50%)',
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            boxShadow: '0 4px 12px -2px rgba(33,28,18,.18)',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  )
}

// Shared top bar for every bottom-nav destination (Discover, Notes, Cellar,
// Your Palate) — account avatar, search, notifications, and the menu drawer,
// so switching tabs doesn't also change how you get to account/menu/alerts.
function AppHeader({
  query, onQueryChange, searchLabel = 'Search sake, brewery, or flavor', searchPlaceholder = 'Search',
  onOpenAccount, onOpenNotifications, onOpenMenu,
}: {
  query: string
  onQueryChange: (value: string) => void
  searchLabel?: string
  searchPlaceholder?: string
  onOpenAccount: () => void
  onOpenNotifications: () => void
  onOpenMenu: () => void
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 3, pt: 7, pb: 1.5 }}>
      <IconButton aria-label="Account" onClick={onOpenAccount} sx={{ p: 0 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>J</Avatar>
      </IconButton>
      <Paper
        component="form"
        elevation={0}
        onSubmit={(event) => event.preventDefault()}
        sx={{ display: 'flex', flex: 1, alignItems: 'center', gap: 1, px: 2, py: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 999 }}
      >
        <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
        <InputBase
          fullWidth
          aria-label={searchLabel}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          sx={{ fontSize: 15 }}
          value={query}
        />
      </Paper>
      <IconButton aria-label="Notifications" onClick={onOpenNotifications}><NotificationsNoneOutlinedIcon /></IconButton>
      <IconButton aria-label="Open menu" onClick={onOpenMenu}><ReorderIcon /></IconButton>
    </Stack>
  )
}

function Discover({
  onSelect, onSelectCourse, onOpenAccount, onOpenMenu, onOpenNotifications,
}: {
  onSelect: (sake: (typeof sakes)[number]) => void
  onSelectCourse: (index: number) => void
  onOpenAccount: () => void
  onOpenMenu: () => void
  onOpenNotifications: () => void
}) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Junmai')
  const visibleCourses = courses
    .map((course, index) => ({ course, index }))
    .filter(({ course }) => `${course.name} ${course.listSummary}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <AppHeader onOpenAccount={onOpenAccount} onOpenMenu={onOpenMenu} onOpenNotifications={onOpenNotifications} onQueryChange={setQuery} query={query} />

      <Box sx={{ px: 3 }}>
        <Typography color="text.secondary" sx={{ fontSize: 13, letterSpacing: '.02em' }}>Welcome John!</Typography>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 32, fontWeight: 600, lineHeight: 1.2 }}>Discover</Typography>
      </Box>

      <Stack direction="row" spacing={1.25} sx={{ px: 3, pt: 3.5, pb: 0.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        {categories.map((category) => (
          <Chip
            key={category.label}
            icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: category.color, ml: '10px !important' }} />}
            label={category.label}
            onClick={() => setSelectedCategory(category.label)}
            sx={{ flexShrink: 0, height: 34, px: 0.5, border: '1px solid', borderColor: 'divider', bgcolor: selectedCategory === category.label ? '#fbf8f0' : 'background.paper' }}
            variant="outlined"
          />
        ))}
      </Stack>

      <Box sx={{ mt: 3.75 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3 }}>
          <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 21 }}>Sake by the glass</Typography>
          <Button color="primary" size="small">See all</Button>
        </Stack>
        <Rail>
          {sakes.map((sake) => (
            <Card
              data-rail-card
              key={sake.name}
              sx={{ flex: '0 0 179px', border: '1px solid', borderColor: 'divider', boxShadow: '0 6px 20px -4px rgba(33,28,18,.1)', scrollSnapAlign: 'start' }}
            >
              <CardActionArea onClick={() => onSelect(sake)}>
                <CardMedia
                  component="img"
                  draggable={false}
                  image={sake.image}
                  sx={{ height: 138, bgcolor: sake.fit === 'contain' ? '#ffffff' : undefined, objectFit: sake.fit, p: sake.fit === 'contain' ? 2 : 0, userSelect: 'none' }}
                />
                <Box sx={{ p: '14px 16px 16px' }}>
                  <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>{sake.eyebrow}  {sake.price}</Typography>
                  <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 19, mt: 0.5 }}>{sake.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>{sake.origin}</Typography>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 0.75 }}>
                    <Rating precision={0.1} readOnly size="small" sx={{ color: '#d6951d' }} value={sake.rating} />
                    <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{sake.rating}</Typography>
                  </Stack>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Rail>
      </Box>

      <Box sx={{ mt: 2.75, pb: 3 }}>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 21, px: 3 }}>Course menu</Typography>
        <List sx={{ px: 3, pt: 1.5, display: 'grid', gap: 1.25 }}>
          {visibleCourses.map(({ course, index }) => (
            <ListItemButton
              key={course.name}
              onClick={() => onSelectCourse(index)}
              sx={{ alignItems: 'center', gap: 1.75, minHeight: 80, border: '1px solid', borderColor: 'divider', borderRadius: '14px !important', px: '14px !important' }}
            >
              <ListItemText
                primary={course.name}
                secondary={`${course.listSummary}  ·  ${course.listPrice} · ${course.listMeta}`}
                slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 600 } }, secondary: { sx: { fontSize: 12, color: 'text.secondary' } } }}
              />
              <ChevronRightIcon sx={{ color: 'text.secondary' }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  )
}

function CourseDetail({ course, onBack, onNote }: { course: Course; onBack: () => void; onNote: () => void }) {
  const isSakeFlight = course.flight.some((pour) => pour.image)
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1, pb: course.showVisit ? '108px' : 4 }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
      </Stack>

      <Box sx={{ px: 3 }}>
        <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>{course.overline}</Typography>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 26, lineHeight: 1.25, mt: 0.5 }}>{course.name}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
          <Typography color="primary.main" sx={{ fontSize: 17, fontWeight: 700 }}>{course.price}</Typography>
          <Typography color="text.disabled">·</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>{course.duration}</Typography>
          <Typography color="text.disabled">·</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>{course.pours}</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.5, mt: 1.25 }}>{course.blurb}</Typography>

        <Typography color="text.disabled" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', mt: 3, mb: 1.5 }}>
          {isSakeFlight ? 'THE FLIGHT' : "WHAT'S INCLUDED"}
        </Typography>
        <Stack sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}>
          {course.flight.map((pour, index) => (
            <Box key={`${pour.name}-${index}`}>
              {index > 0 && <Divider />}
              <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', px: 1.75, py: 1.75 }}>
                {pour.image ? (
                  <Box component="img" src={pour.image} sx={{ width: 44, height: 56, borderRadius: '14px', objectFit: 'cover', bgcolor: '#fff', border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
                ) : (
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {index + 1}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{pour.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12 }}>{pour.classification}</Typography>
                  {pour.note && <Typography color="text.disabled" sx={{ fontSize: 12 }}>{pour.note}</Typography>}
                </Box>
                {pour.image && (
                  <Stack spacing={1} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                    {pour.temp && <Chip label={pour.temp} size="small" sx={{ bgcolor: '#efe9dc', fontSize: 11, height: 22 }} />}
                    <Button color="primary" onClick={onNote} size="small" sx={{ minWidth: 0, px: 1.5, py: 0.25, fontSize: 12 }} variant="outlined">
                      + Note
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>

        {course.showVisit && (
          <Box sx={{ mt: 2.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
            <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>VISIT</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 0.5 }}>Takara Sake USA</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.25 }}>708 Addison St, Berkeley CA 94710</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>Thu & Fri 1–5pm · Sun 11am–5pm</Typography>
            <Typography color="text.disabled" sx={{ fontSize: 13 }}>Reservations required · 21+ to taste</Typography>
          </Box>
        )}
      </Box>

      {course.showVisit && (
        <Stack spacing={0.75} sx={{ alignItems: 'center', position: 'fixed', left: '50%', bottom: 0, width: 'min(100%, 540px)', transform: 'translateX(-50%)', px: 3, pt: 1.25, pb: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button
            component="a"
            href="https://app.anyroad.com/i/plugin/sho-chiku-bai/tours/tasting-course-a?lang=en-US"
            target="_blank"
            rel="noreferrer"
            fullWidth
            size="large"
            variant="contained"
          >
            Reserve this flight · {course.price}
          </Button>
          <Typography color="text.secondary" sx={{ fontSize: 12 }}>Non-Drinker guests join the table free</Typography>
        </Stack>
      )}
    </Box>
  )
}

function Detail({ sake, onBack, onJournal }: { sake: SakeDetail; onBack: () => void; onJournal: () => void }) {
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1, pb: '108px' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
        <Stack direction="row" spacing={1}>
          <IconButton aria-label="Share"><ShareIcon /></IconButton>
          <IconButton aria-label="Save"><FavoriteBorderIcon /></IconButton>
        </Stack>
      </Stack>

      <Box sx={{ px: 3 }}>
        <Box sx={{ height: 360, borderRadius: '14px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
          <img
            alt={`${sake.name} sake`}
            src={sake.image}
            style={{ width: '100%', height: '100%', objectFit: sake.imageFit, padding: sake.imageFit === 'contain' ? 32 : 0, boxSizing: 'border-box' }}
          />
        </Box>
        <Box sx={{ pt: 2.5 }}>
          <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>{sake.classification}</Typography>
          <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 28, mt: 0.5 }}>{sake.name}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>{sake.origin}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
            <Rating precision={0.1} readOnly size="small" sx={{ color: '#d6951d' }} value={sake.rating} />
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{sake.rating}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>· {sake.reviewLabel}</Typography>
          </Stack>
        </Box>

        {sake.essentials && (
          <Box sx={{ mt: 2.75, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px', boxShadow: '0 6px 20px -4px rgba(33,28,18,.08)' }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>THE ESSENTIALS</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mt: 3.5 }}>
              {sake.essentials.map(([stat, label]) => (
                <Box key={label}><Typography sx={{ fontSize: 18, fontWeight: 600 }}>{stat}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{label}</Typography></Box>
              ))}
            </Box>
          </Box>
        )}

        {sake.note && (
          <Box sx={{ mt: 2.75, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>TASTING NOTE</Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: 1 }}>{sake.note}</Typography>
          </Box>
        )}

        {sake.pairings && (
          <Box sx={{ mt: 2.75, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>{sake.pairings.heading}</Typography>
            <Typography color="text.disabled" sx={{ fontSize: 12, mt: 0.5 }}>{sake.pairings.caption}</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1.75, rowGap: 1 }}>
              {sake.pairings.items.map((dish) => (
                <Chip key={dish} label={dish} sx={{ bgcolor: '#efe9dc', fontWeight: 500 }} />
              ))}
            </Stack>
          </Box>
        )}

        {sake.story && (
          <Box sx={{ mt: 2.75, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
            <Typography color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>{sake.story.label}</Typography>
            <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 17, mt: 1 }}>{sake.story.title}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.6, mt: 1 }}>{sake.story.body}</Typography>
            {sake.story.stats && (
              <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
                {sake.story.stats.map(([stat, label]) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: 20, fontWeight: 600 }}>{stat}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 11 }}>{label}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      <Stack spacing={0.75} sx={{ alignItems: 'center', position: 'fixed', left: '50%', bottom: 0, width: 'min(100%, 540px)', transform: 'translateX(-50%)', px: 3, pt: 1.25, pb: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Button fullWidth onClick={onJournal} size="large" startIcon={<AddIcon />} variant="contained">{sake.cta.label}</Button>
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>{sake.cta.caption}</Typography>
      </Stack>
    </Box>
  )
}

function Journal({ sake, onBack }: { sake: SakeDetail; onBack: () => void }) {
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<string[]>(['Silky', 'Umami'])
  const flavourNotes = ['Pear', 'White flower', 'Melon', 'Silky', 'Umami', 'Clean finish', 'Dry', 'Mineral']
  const toggleNote = (note: string) => setSelectedNotes((current) => current.includes(note) ? current.filter((item) => item !== note) : [...current, note])

  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>New Tasting Note</Typography>
        <Button onClick={() => setSaved(true)}>Save</Button>
      </Stack>

      <Box sx={{ px: 3, pb: 4.25 }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', height: 76, px: 2, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
          <Avatar
            src={sake.image}
            sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: '#fff', border: '1px solid', borderColor: 'divider', '& img': { objectFit: sake.imageFit, p: sake.imageFit === 'contain' ? 0.75 : 0 } }}
            variant="rounded"
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 19 }}>{sake.name}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>{sake.origin}</Typography>
          </Box>
          <Button color="primary" onClick={onBack} size="small">Change</Button>
        </Stack>

        <Box sx={{ mt: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
          <Typography align="center" color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>YOUR RATING</Typography>
          <Stack sx={{ alignItems: 'center', mt: 3 }}>
            <Rating onChange={(_, value) => setRating(value ?? 0)} size="large" sx={{ color: '#d6951d' }} value={rating} />
            <Typography sx={{ mt: 1.5, fontSize: 14 }}>{rating}.0 / 5.0 <Typography color="text.disabled" component="span" sx={{ fontSize: 12 }}>· tap to fine-tune</Typography></Typography>
          </Stack>
        </Box>

        <Box sx={{ mt: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
          <Typography color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>SERVING RITUAL</Typography>
          <Box sx={{ mt: 2.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>Temperature</Typography>
            <Slider color="primary" defaultValue={54} sx={{ mt: 1 }} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>Glassware</Typography>
            <Slider color="primary" defaultValue={68} sx={{ mt: 1 }} />
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography color="text.secondary" sx={{ fontSize: 12, letterSpacing: '.08em' }}>FLAVOUR NOTES</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1.75, rowGap: 1 }}>
            {flavourNotes.map((note) => (
              <Chip
                key={note}
                clickable
                color={selectedNotes.includes(note) ? 'primary' : 'default'}
                label={note}
                onClick={() => toggleNote(note)}
                variant={selectedNotes.includes(note) ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>

        <TextField
          fullWidth
          label="PERSONAL NOTES"
          minRows={4}
          multiline
          onChange={(event) => setNotes(event.target.value)}
          placeholder={'Nose, palate, finish, pairing… e.g. "Pear-drop nose, silky attack, clean umami mid-palate, brisk dry finish."'}
          sx={{ mt: 3 }}
          value={notes}
        />

        <Button fullWidth onClick={() => setSaved(true)} size="large" sx={{ mt: 3 }} variant="contained">
          {saved ? 'Tasting Note Saved' : 'Save Tasting Note'}
        </Button>
      </Box>
    </Box>
  )
}

function Profile({
  onSeeAllNotes, onOpenAccount, onOpenMenu, onOpenNotifications,
}: {
  onSeeAllNotes: () => void
  onOpenAccount: () => void
  onOpenMenu: () => void
  onOpenNotifications: () => void
}) {
  const [query, setQuery] = useState('')
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1, pb: 4.5 }}>
      <AppHeader onOpenAccount={onOpenAccount} onOpenMenu={onOpenMenu} onOpenNotifications={onOpenNotifications} onQueryChange={setQuery} query={query} />
      <Box sx={{ px: 3 }}>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 32, mt: 0.5 }}>Your Palate</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>42 tasting notes  ·  refined since March</Typography>
      </Box>
      <Box sx={{ px: 3 }}>

      <Box sx={{ mt: 2.5, p: '24px 22px 22px', borderRadius: '14px', bgcolor: '#1e2a40', boxShadow: '0 12px 32px -8px rgba(33,28,18,.16)' }}>
        <Typography sx={{ color: '#b89e6b', fontSize: 11, fontWeight: 600, letterSpacing: '.08em' }}>YOUR TASTE PERSONA</Typography>
        <Typography sx={{ color: '#fff', fontFamily: "'Shippori Mincho', serif", fontSize: 25, lineHeight: '33px', mt: 2 }}>The Dry, Aromatic<br />Junmai Daiginjo drinker</Typography>
        <Typography sx={{ color: '#c7ccdb', fontSize: 13, lineHeight: '19px', mt: 2 }}>
          You lean into polished, white-flower-and-melon junmai daiginjo with a clean, low-sugar finish — and rate Takara's Berkeley small-batch pours half a star above the rest.
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255,255,255,.12)', mt: 2.75 }} />
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}>
          {[['+3', 'avg SMV'], ['1.3', 'avg acidity'], ['52%', 'avg polish'], ['Berkeley', 'top region']].map(([stat, label]) => (
            <Box key={label}><Typography sx={{ color: '#fff', fontSize: 19, fontWeight: 600 }}>{stat}</Typography><Typography sx={{ color: '#b2bacc', fontSize: 11 }}>{label}</Typography></Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px', boxShadow: '0 6px 20px -4px rgba(33,28,18,.1)' }}>
        <Typography color="text.disabled" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', mb: 2.25 }}>HOW YOUR PALATE LEANS</Typography>
        <Stack spacing={2}>
          {palateLeans.map((lean) => (
            <Box key={lean.label}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{lean.label}</Typography>
                <Typography color="primary.main" sx={{ fontSize: 12 }}>{lean.descriptor}</Typography>
              </Stack>
              <Box sx={{ height: 8, bgcolor: '#efe9dc', borderRadius: 999 }}>
                <Box sx={{ width: `${lean.value}%`, height: 8, bgcolor: 'primary.main', borderRadius: 999 }} />
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 2.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px', boxShadow: '0 6px 20px -4px rgba(33,28,18,.1)' }}>
        <Typography color="text.disabled" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', mb: 2.25 }}>WHAT YOU POUR MOST</Typography>
        <Stack spacing={1.75}>
          {classificationBreakdown.map((entry) => (
            <Box key={entry.label}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.875 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                <Typography sx={{ flex: 1, fontSize: 13 }}>{entry.label}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 600 }}>{entry.percent}%</Typography>
              </Stack>
              <Box sx={{ height: 6, bgcolor: '#efe9dc', borderRadius: 999 }}>
                <Box sx={{ width: `${entry.percent}%`, height: 6, bgcolor: entry.color, borderRadius: 999 }} />
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 21 }}>Tasting History</Typography>
          <Button color="primary" onClick={onSeeAllNotes} size="small">See all 42</Button>
        </Stack>
        <List sx={{ display: 'grid', gap: 1.25 }}>
          {tastingHistory.map((entry) => (
            <ListItemButton
              key={entry.name}
              sx={{ alignItems: 'center', gap: 1.75, minHeight: 80, border: '1px solid', borderColor: 'divider', borderRadius: '14px !important', px: '14px !important' }}
            >
              <Avatar src={entry.image} sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }} variant="rounded" />
              <ListItemText
                primary={entry.name}
                secondary={<>{entry.origin}<br />★ {entry.rating} · {entry.date}</>}
                slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 600 } }, secondary: { sx: { fontSize: 12, color: 'text.secondary' } } }}
              />
              <ChevronRightIcon sx={{ color: 'text.secondary' }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      </Box>
    </Box>
  )
}

function Notes({
  onNewNote, onOpenAccount, onOpenMenu, onOpenNotifications,
}: {
  onNewNote: () => void
  onOpenAccount: () => void
  onOpenMenu: () => void
  onOpenNotifications: () => void
}) {
  const [query, setQuery] = useState('')
  const visibleNotes = tastingHistory.filter((entry) => `${entry.name} ${entry.origin}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <AppHeader
        onOpenAccount={onOpenAccount}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onQueryChange={setQuery}
        query={query}
        searchLabel="Search your tasting notes"
        searchPlaceholder="Search notes"
      />
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', px: 3, pt: 0.5, pb: 1 }}>
        <Box>
          <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 32, fontWeight: 600, lineHeight: 1.2 }}>My Notes</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>42 tasting notes · refined since March</Typography>
        </Box>
        <IconButton aria-label="New tasting note" onClick={onNewNote} sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}>
          <AddIcon />
        </IconButton>
      </Stack>
      <List sx={{ px: 3, pt: 1, pb: 4, display: 'grid', gap: 1.25 }}>
        {visibleNotes.map((entry) => (
          <ListItemButton
            key={entry.name}
            sx={{ alignItems: 'center', gap: 1.75, minHeight: 80, border: '1px solid', borderColor: 'divider', borderRadius: '14px !important', px: '14px !important' }}
          >
            <Avatar src={entry.image} sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }} variant="rounded" />
            <ListItemText
              primary={entry.name}
              secondary={entry.origin}
              slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 600 } }, secondary: { sx: { fontSize: 12, color: 'text.secondary' } } }}
            />
            <Stack sx={{ alignItems: 'flex-end' }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Rating precision={0.1} readOnly size="small" sx={{ color: '#d6951d' }} value={entry.rating} />
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{entry.rating}</Typography>
              </Stack>
              <Typography color="text.disabled" sx={{ fontSize: 11 }}>{entry.date}</Typography>
            </Stack>
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}

function Cellar({
  onOpenAccount, onOpenMenu, onOpenNotifications,
}: {
  onOpenAccount: () => void
  onOpenMenu: () => void
  onOpenNotifications: () => void
}) {
  const [query, setQuery] = useState('')
  const visibleItems = cellarItems.filter((item) => `${item.name} ${item.classification}`.toLowerCase().includes(query.toLowerCase()))
  const inCellar = cellarItems.filter((item) => item.status === 'In Cellar').length
  const wishlist = cellarItems.length - inCellar
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <AppHeader
        onOpenAccount={onOpenAccount}
        onOpenMenu={onOpenMenu}
        onOpenNotifications={onOpenNotifications}
        onQueryChange={setQuery}
        query={query}
        searchLabel="Search your cellar"
        searchPlaceholder="Search cellar"
      />
      <Box sx={{ px: 3, pt: 0.5, pb: 1 }}>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 32, fontWeight: 600, lineHeight: 1.2 }}>My Cellar</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
          {cellarItems.length} bottles · {inCellar} in cellar, {wishlist} on your wishlist
        </Typography>
      </Box>
      <Box sx={{ px: 3, pb: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.75 }}>
        {visibleItems.map((item) => (
          <Card key={item.name} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardMedia component="img" image={item.image} sx={{ height: 120, objectFit: 'contain', bgcolor: '#fff', p: 1.5 }} />
            <Box sx={{ p: 1.5, pt: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{item.name}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 11, mt: 0.25 }}>{item.classification}</Typography>
              <Chip
                label={item.status}
                size="small"
                sx={{
                  mt: 0.75, fontSize: 10, height: 20, fontWeight: 600,
                  bgcolor: item.status === 'In Cellar' ? '#f0dfc0' : '#efe9dc',
                  color: item.status === 'In Cellar' ? 'primary.main' : 'text.secondary',
                }}
              />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

function Club({ onClose }: { onClose: () => void }) {
  const memberQrValue = 'https://www.takarasake.com/tasting-room/?member=TK-004821'
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1, pb: 4 }}>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', px: 2, py: 1.5 }}>
        <IconButton aria-label="Close" onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
      <Box sx={{ px: 3 }}>
        <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>SAKE CLUB</Typography>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 26, mt: 0.5 }}>Your membership</Typography>

        <Box sx={{ mt: 3, p: 3, borderRadius: '20px', bgcolor: 'secondary.main', boxShadow: '0 14px 32px -10px rgba(33,28,18,.24)' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '.04em' }}>寶 TAKARA</Typography>
            <Typography sx={{ color: '#eddfc3', fontWeight: 700, fontSize: 11, letterSpacing: '.04em' }}>SAKE CLUB</Typography>
          </Stack>
          <Typography sx={{ color: '#fff', fontFamily: "'Shippori Mincho', serif", fontSize: 24, mt: 3 }}>John</Typography>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 4 }}>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: 9, letterSpacing: '.06em' }}>MEMBER ID</Typography>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>TK-004821</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: 9, letterSpacing: '.06em' }}>TIER</Typography>
              <Typography sx={{ color: '#eddfc3', fontWeight: 700, fontSize: 15 }}>Tasting Room</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mt: 2.5, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '20px', textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
            <QRCodeSVG value={memberQrValue} size={180} fgColor="#211f1b" bgColor="#ffffff" />
          </Box>
          <Typography color="text.secondary" sx={{ fontSize: 12, mt: 1.75 }}>
            Show this code at the Tasting Room to check in and earn points
          </Typography>
        </Box>

        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2.5 }}>
          {[['1,240', 'points'], ['6', 'bottles logged'], ['Gold', 'tier since 2025']].map(([stat, label]) => (
            <Box key={label} sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 20, fontWeight: 600 }}>{stat}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 11 }}>{label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function Account({ onBack, onOpenNotifications }: { onBack: () => void; onOpenNotifications: () => void }) {
  const rows = [
    { icon: <PersonOutlineIcon />, label: 'Name', value: 'John Yamamoto' },
    { icon: <MailOutlineIcon />, label: 'Email', value: 'john.yamamoto@example.com' },
    { icon: <PhoneOutlinedIcon />, label: 'Phone', value: '(415) 555-0132' },
    { icon: <LocationOnOutlinedIcon />, label: 'Address', value: '1200 Addison St, Berkeley, CA 94710' },
  ]
  const prefRows: { icon: React.ReactNode; label: string; onClick?: () => void }[] = [
    { icon: <NotificationsNoneOutlinedIcon />, label: 'Notifications', onClick: onOpenNotifications },
    { icon: <LockOutlinedIcon />, label: 'Privacy Settings' },
    { icon: <CreditCardOutlinedIcon />, label: 'Payment Methods' },
  ]
  const rowSx = { alignItems: 'center', gap: 1.75, minHeight: 64, border: '1px solid', borderColor: 'divider', borderRadius: '14px !important', px: '14px !important' }
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
      </Stack>
      <Box sx={{ px: 3, pb: 4 }}>
        <Stack sx={{ alignItems: 'center', textAlign: 'center', mb: 3 }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28, mb: 1.5 }}>J</Avatar>
          <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 22 }}>John Yamamoto</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>Sake Club member since 2025</Typography>
        </Stack>

        <Typography color="text.disabled" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', mb: 1.25 }}>ACCOUNT</Typography>
        <List sx={{ display: 'grid', gap: 1, mb: 3, p: 0 }}>
          {rows.map((row) => (
            <ListItemButton key={row.label} sx={rowSx}>
              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{row.icon}</ListItemIcon>
              <ListItemText
                primary={row.label}
                secondary={row.value}
                slotProps={{ primary: { sx: { fontSize: 12, color: 'text.secondary' } }, secondary: { sx: { fontSize: 15, fontWeight: 600, color: 'text.primary' } } }}
              />
              <ChevronRightIcon sx={{ color: 'text.disabled' }} />
            </ListItemButton>
          ))}
        </List>

        <Typography color="text.disabled" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', mb: 1.25 }}>PREFERENCES</Typography>
        <List sx={{ display: 'grid', gap: 1, mb: 3, p: 0 }}>
          {prefRows.map((row) => (
            <ListItemButton key={row.label} onClick={row.onClick} sx={rowSx}>
              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{row.icon}</ListItemIcon>
              <ListItemText primary={row.label} slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 600 } } }} />
              <ChevronRightIcon sx={{ color: 'text.disabled' }} />
            </ListItemButton>
          ))}
        </List>

        <Button fullWidth startIcon={<LogoutIcon />} sx={{ color: 'text.secondary', justifyContent: 'flex-start', px: '14px' }}>Sign Out</Button>
      </Box>
    </Box>
  )
}

// Illustrative feed — placeholder notifications, same convention as the rest
// of the app's mock data (ratings, cellar, points, events).
const notificationFeed: { icon: React.ReactNode; title: string; time: string; body: string }[] = [
  { icon: <EventOutlinedIcon />, title: 'Reservation Confirmed', time: '10:26 AM', body: 'Your Daiginjo/Junmai Course reservation for Sat, Sep 20 at 2:00 PM is confirmed.' },
  { icon: <RedeemOutlinedIcon />, title: 'Sake Club Points Earned', time: 'Fri, Sep 12', body: 'You earned 120 points from your Tasting Room visit. New balance: 1,240.' },
  { icon: <NewReleasesOutlinedIcon />, title: 'New Release: Shirakabegura MIO Nigori', time: 'Wed, Sep 10', body: 'A cloudy, lightly sparkling nigori just joined the MIO family — available first to Sake Club members.' },
  { icon: <EditNoteIcon />, title: 'Tasting Note Reminder', time: 'Mon, Sep 8', body: 'You logged N-end 然土 3 days ago — add tasting notes while it’s fresh.' },
  { icon: <LocalShippingOutlinedIcon />, title: 'Order Shipped', time: 'Sat, Sep 6', body: 'Your order of 2 bottles (Sho Chiku Bai Junmai Daiginjo) has shipped.' },
  { icon: <QrCodeScannerIcon />, title: 'Welcome to the Sake Club', time: 'Tue, Sep 2', body: 'Your membership card and QR code are ready — tap the scan button to view.' },
  { icon: <AccessTimeOutlinedIcon />, title: 'Tasting Room Hours Update', time: 'Fri, Aug 29', body: 'Extended hours begin this weekend: Thu & Fri 1–5pm, Sun 11am–5pm.' },
]

function NotificationsFeed({ onBack }: { onBack: () => void }) {
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Notifications</Typography>
      </Stack>
      <List sx={{ px: 3, pb: 4, display: 'grid', gap: 0 }}>
        {notificationFeed.map((note, index) => (
          <Stack direction="row" key={note.title} spacing={1.75} sx={{ alignItems: 'flex-start', py: 1.75, borderTop: index === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#efe9dc', color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0, mt: 0.25 }}>
              {note.icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{note.title}</Typography>
                <Typography color="text.disabled" sx={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>{note.time}</Typography>
              </Stack>
              <Typography
                color="text.secondary"
                sx={{ fontSize: 13, lineHeight: 1.5, mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {note.body}
              </Typography>
            </Box>
          </Stack>
        ))}
      </List>
    </Box>
  )
}

function NotificationSettings({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState({ push: true, email: true, events: true, orders: false })
  const items: [keyof typeof prefs, string, string][] = [
    ['push', 'Push Notifications', 'Tasting reminders and journal prompts'],
    ['email', 'Email Updates', 'New releases and tasting room news'],
    ['events', 'Tasting Room Events', 'Invitations to courses and pop-ups'],
    ['orders', 'Order Updates', 'Shipping and order status'],
  ]
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Notifications</Typography>
      </Stack>
      <Box sx={{ px: 3, pb: 4, display: 'grid', gap: 1.25 }}>
        {items.map(([key, label, desc]) => (
          <Stack direction="row" key={key} sx={{ alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider', borderRadius: '14px', px: 2, py: 1.5 }}>
            <Box sx={{ pr: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{label}</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>{desc}</Typography>
            </Box>
            <Switch checked={prefs[key]} onChange={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} />
          </Stack>
        ))}
      </Box>
    </Box>
  )
}

// Placeholder announcements — illustrative only, not real Takara news.
const eventsData = [
  { date: 'Oct 4 – Oct 26', title: "Autumn Junmai Tasting Series", body: "A guided flight through this season's junmai releases, hosted every Saturday afternoon in the Tasting Room." },
  { date: 'Sep 30', title: 'New Release: Shirakabegura MIO Nigori', body: 'A cloudy, lightly sparkling nigori joins the MIO family — available first to Sake Club members.' },
  { date: 'Nov 8', title: 'Sake & Sushi Pairing Night', body: 'A ticketed evening pairing five Takara pours with a seasonal sushi tasting menu.' },
  { date: 'Dec 1 – Dec 31', title: 'Extended Holiday Hours', body: 'The museum and Tasting Room walk-through run extended hours through the holiday season.' },
]

function EventsNews({ onBack }: { onBack: () => void }) {
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Events &amp; News</Typography>
      </Stack>
      <Box sx={{ px: 3, pb: 4, display: 'grid', gap: 1.5 }}>
        {eventsData.map((event) => (
          <Box key={event.title} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '14px', p: 2 }}>
            <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>{event.date}</Typography>
            <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 18, mt: 0.5 }}>{event.title}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.6, mt: 0.75 }}>{event.body}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function AboutUs({ onBack }: { onBack: () => void }) {
  return (
    <Box component="main" sx={{ bgcolor: 'background.paper', minHeight: 1 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, height: 52 }}>
        <IconButton aria-label="Back" onClick={onBack}><ArrowBackIcon /></IconButton>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>About Us</Typography>
      </Stack>
      <Box sx={{ px: 3, pb: 4 }}>
        <Typography sx={{ fontFamily: "'Shippori Mincho', serif", fontSize: 24 }}>Takara Sake USA</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.8, mt: 1.5 }}>
          Takara brews Sho Chiku Bai and Shirakabegura sake at its Berkeley, California brewery,
          and pours small-batch and limited releases exclusively in its own Tasting Room.
        </Typography>
        <Box sx={{ mt: 3, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '14px' }}>
          <Typography color="primary.main" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>VISIT</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 0.5 }}>Takara Sake USA</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.25 }}>708 Addison St, Berkeley CA 94710</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>Thu &amp; Fri 1–5pm · Sun 11am–5pm</Typography>
          <Typography color="text.disabled" sx={{ fontSize: 13 }}>Reservations required · 21+ to taste</Typography>
        </Box>
      </Box>
    </Box>
  )
}

function MenuDrawer({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (view: 'events' | 'about') => void }) {
  // Notifications moved to its own icon in the header, next to the menu button.
  const items: { view: 'events' | 'about'; icon: React.ReactNode; label: string }[] = [
    { view: 'events', icon: <EventOutlinedIcon />, label: 'Events & News' },
    { view: 'about', icon: <InfoOutlinedIcon />, label: 'About Us' },
  ]
  return (
    <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: 280 } } }}>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', p: 1.5 }}>
        <IconButton aria-label="Close menu" onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
      <List sx={{ px: 1.5, pt: 1 }}>
        {items.map((item) => (
          <ListItemButton key={item.view} onClick={() => onNavigate(item.view)} sx={{ borderRadius: '12px', mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 600 } } }} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  )
}

function App() {
  const [view, setView] = useState<View>('discover')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(0)
  const [selectedSake, setSelectedSake] = useState<SakeDetail>(sakeDetails.nend)
  const headerHandlers = {
    onOpenAccount: () => setView('account'),
    onOpenMenu: () => setMenuOpen(true),
    // Bell icon opens the notification feed (a list of what's happened);
    // the toggle-based preferences live only under Account, per below.
    onOpenNotifications: () => setView('notificationsFeed'),
  }
  const page = view === 'discover' ? (
      <Discover
        {...headerHandlers}
        onSelect={(sake) => { setSelectedSake(resolveSakeDetail(sake)); setView('detail') }}
        onSelectCourse={(index) => { setSelectedCourse(index); setView('course') }}
      />
    )
    : view === 'course' ? <CourseDetail course={courses[selectedCourse]} onBack={() => setView('discover')} onNote={() => setView('journal')} />
    : view === 'detail' ? <Detail sake={selectedSake} onBack={() => setView('discover')} onJournal={() => setView('journal')} />
    : view === 'journal' ? <Journal sake={selectedSake} onBack={() => setView('discover')} />
    : view === 'notes' ? <Notes {...headerHandlers} onNewNote={() => setView('journal')} />
    : view === 'cellar' ? <Cellar {...headerHandlers} />
    : view === 'club' ? <Club onClose={() => setView('discover')} />
    : view === 'account' ? <Account onBack={() => setView('discover')} onOpenNotifications={() => setView('notifications')} />
    : view === 'notifications' ? <NotificationSettings onBack={() => setView('account')} />
    : view === 'notificationsFeed' ? <NotificationsFeed onBack={() => setView('discover')} />
    : view === 'events' ? <EventsNews onBack={() => setView('discover')} />
    : view === 'about' ? <AboutUs onBack={() => setView('discover')} />
    : <Profile {...headerHandlers} onSeeAllNotes={() => setView('notes')} />

  return (
    <ThemeProvider theme={takaraTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.paper', pb: NO_NAV_VIEWS.has(view) ? 0 : '88px' }}>
        <Box sx={{ width: 'min(100%, 540px)', mx: 'auto', minHeight: '100vh', bgcolor: 'background.paper' }}>
          {page}
        </Box>
        {!NO_NAV_VIEWS.has(view) && (
          <Box sx={{ position: 'fixed', left: '50%', bottom: 0, width: 'min(100%, 540px)', transform: 'translateX(-50%)', borderTop: '1px solid', borderColor: 'divider' }}>
            <BottomNavigation
              onChange={(_, value) => setView(value)}
              showLabels
              sx={{ height: 88, bgcolor: 'rgba(255,255,255,.96)', position: 'relative' }}
              value={view}
            >
              <BottomNavigationAction icon={<ExploreIcon />} label="Discover" value="discover" />
              <BottomNavigationAction icon={<EditNoteIcon />} label="Note" value="notes" />
              <BottomNavigationAction disabled label="" sx={{ pointerEvents: 'none' }} value="scan" />
              <BottomNavigationAction icon={<LiquorIcon />} label="Cellar" value="cellar" />
              <BottomNavigationAction icon={<PersonIcon />} label="Your Palate" value="profile" />
            </BottomNavigation>
            <Fab
              aria-label="Sake Club membership"
              color="secondary"
              onClick={() => setView('club')}
              size="medium"
              sx={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)' }}
            >
              <QrCodeScannerIcon />
            </Fab>
          </Box>
        )}

        <MenuDrawer
          onClose={() => setMenuOpen(false)}
          onNavigate={(target) => { setMenuOpen(false); setView(target) }}
          open={menuOpen}
        />
      </Box>
    </ThemeProvider>
  )
}

export default App
