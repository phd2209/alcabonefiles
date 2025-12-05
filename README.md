# FBI Cabone Files

An FBI-style classified evidence board web experience for the Al Cabone NFT collection. Built with React, Vite, TailwindCSS, and Framer Motion.

## 🎯 Project Overview

The FBI Cabone Files presents the Al Cabone NFT collection as an interactive detective board with manila folder case files, polaroid evidence photos, and FBI stamps. No wallet connection required - all data is fetched via Alchemy API.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
fbi-cabone-files/
├── src/
│   ├── components/
│   │   ├── atomic/          # Polaroid, Stamp
│   │   └── feature/         # FolderCard, TopSuspectCard
│   ├── pages/               # LandingPage (more coming)
│   ├── config/              # Alchemy API configuration
│   ├── types/               # Type definitions (JSDoc)
│   ├── utils/               # Helper functions
│   └── data/                # Static data files
├── .env                     # Environment variables
└── tailwind.config.js       # TailwindCSS configuration
```

## 🎨 Design System

### Color Palette
- **FBI Beige (Manila):** `#D7C49E`
- **Aged Paper Brown:** `#B79C72`
- **Burnt Edge Shadow:** `#6E5A3E`
- **Rust Red Stamp:** `#9B2F2F`
- **Smoky Noir Black:** `#1B1B1B`
- **Off-white Paper:** `#F4EEDB`
- **Evidence Yellow:** `#E7D47C`

### Typography
- **Headings:** Bebas Neue (FBI/Case titles)
- **Typewriter:** Special Elite (Dossier text)
- **Body:** Inter (General text)

## 🔧 Key Features

### ✅ Implemented
- [x] Landing page with evidence desk layout
- [x] Top Suspects section (top 3 collectors)
- [x] Folder cards for tier classifications (Godfather, Underboss, etc.)
- [x] Manila folder textures and paper effects
- [x] Polaroid component for NFT images
- [x] FBI stamps (MOST WANTED, HIGH PRIORITY, etc.)
- [x] Framer Motion animations (hover, tilt, scale)
- [x] Alchemy API integration with caching
- [x] Tier classification system
- [x] Responsive design (mobile, tablet, desktop)

### 🚧 Coming Soon
- [ ] Case File detail page
- [ ] FBI org chart view for individual collectors
- [ ] Family-based folder categories
- [ ] Actual NFT image integration
- [ ] Search and filter functionality
- [ ] Coffee stain overlays and paperclip SVGs

## 🔐 Environment Variables

Create a `.env` file with:

```env
VITE_ALCHEMY_API_KEY=your_api_key_here
VITE_ALCHEMY_NETWORK=eth-mainnet
VITE_CONTRACT_ADDRESS=0x8Ca5209d8CCe34b0de91C2C4b4B14F20AFf8BA23
```

## 📦 Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **TailwindCSS 4** - Styling
- **Framer Motion** - Animations
- **Alchemy SDK** - NFT data fetching
- **React Router DOM** - Navigation (ready to use)

## 🎭 Classification System

### Tiers (by NFT count)
- **Godfather:** 25+ NFTs
- **Underboss:** 20-24 NFTs
- **Consigliere:** 15-19 NFTs
- **Caporegime:** 10-14 NFTs
- **Soldier:** 5-9 NFTs

### Badges
- **MOST WANTED:** Top 3 collectors
- **HIGH PRIORITY:** Top 10 collectors
- **UNDER SURVEILLANCE:** Top 50 collectors

### Families (coming soon)
1. Contract Killers (special)
2. Rambones
3. Corlebones
4. Gambones
5. Napolebones
6. Colombones
7. Boneannos

## 🎪 Development Notes

### Caching
- NFT ownership data is cached in localStorage for 5 minutes
- Cache automatically refreshes on expiry
- Falls back to cached data if API fails

### Animations
- Folder cards tilt and lift on hover
- Stamps pop in with rotation jitter
- Smooth transitions throughout
- All powered by Framer Motion

### Styling
- Custom utility classes: `.manila-folder`, `.paper-texture`, `.stamp-effect`
- FBI theme colors via CSS variables
- Responsive breakpoints at 600px and 768px

## 📝 License

This project is inspired by the [Al Cabone Collection](https://opensea.io/collection/thealcabones) on OpenSea.

## 🤝 Contributing

This is a proof-of-concept project. Future enhancements welcome!

---

**Built with ❤️ and 🔎 by the FBI Evidence Division**
