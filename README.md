# Audio Button Grid 🎵

Aplikacja do przetwarzania plików MP4 na MP3 i tworzenia interaktywnych przycisków dźwiękowych z responsywnym designem dla telefonów.

## ✨ Funkcje

- **Konwersja MP4 → MP3** używając FFmpeg.js
- **Przycinanie audio** z precyzyjnymi kontrolkami
- **Responsywny grid** 2x10 na telefonach, skalowalny na większe ekrany
- **Wyszukiwanie i filtrowanie** dźwięków
- **Przeglądarka plików** z drag & drop
- **Persystencja danych** w localStorage
- **PWA support** dla lepszej obsługi telefonów

## 📱 Responsywny Design

### Mobile-First Approach
- **Grid 2x10** na telefonach (portrait)
- **Grid 3x7** na tabletach
- **Grid 4x5** na laptopach  
- **Grid 5x4** na desktopach
- **Grid 6x4** na dużych ekranach

### Touch-Friendly Interface
- Minimalne wymiary przycisków: 44x44px
- Lepsze spacing na małych ekranach
- Zoptymalizowane kontrolki dotykowe
- Mobile menu z hamburger button
- Responsywne modale i formularze

### Breakpoints
```css
/* Mobile: 2 kolumny */
grid-cols-2

/* Tablet: 3 kolumny */  
sm:grid-cols-3

/* Laptop: 4 kolumny */
md:grid-cols-4

/* Desktop: 5 kolumn */
lg:grid-cols-5

/* Large: 6 kolumn */
xl:grid-cols-6
```

## 🚀 Technologie

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Audio Processing**: FFmpeg.js
- **State Management**: React Context + Hooks
- **PWA**: Service Worker + Manifest
- **Mobile**: Touch optimizations + Responsive design

## 📦 Instalacja

```bash
# Klonuj repozytorium
git clone <repo-url>
cd ButtonKrisu

# Zainstaluj zależności
npm install

# Uruchom w trybie deweloperskim
npm run dev

# Zbuduj dla produkcji
npm run build
```

## 🎯 Użycie

### Dodawanie dźwięków
1. Kliknij "Add Sound" 
2. Przeciągnij plik MP4 lub wybierz z przeglądarki
3. Ustaw tytuł i przycięcie audio
4. Utwórz podgląd i zapisz

### Odtwarzanie
- Kliknij na przycisk dźwięku aby odtworzyć/zatrzymać
- Użyj kontroli głośności (lewy górny róg)
- Dostęp do menu edycji (prawy górny róg)

### Wyszukiwanie
- Użyj pola wyszukiwania w górnej części
- Sortuj według tytułu, czasu trwania lub daty
- Przełącz między widokiem grid i list

## 📱 Mobile Optimizations

### Touch Targets
- Wszystkie przyciski minimum 44x44px
- Lepsze spacing między elementami
- Touch-friendly sliders i kontrolki

### Responsive Layout
- Mobile menu z hamburger button
- Stacked controls na małych ekranach
- Adaptive typography i spacing
- Mobile-first CSS classes

### PWA Features
- Installable jako aplikacja
- Offline support (w przygotowaniu)
- Touch gestures
- Mobile-optimized UI

## 🔧 Konfiguracja

### Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
}
```

### Mobile Breakpoints
```css
/* Mobile: < 640px */
/* Tablet: >= 640px */
/* Laptop: >= 768px */
/* Desktop: >= 1024px */
/* Large: >= 1280px */
```

## 🧪 Testy

```bash
# Uruchom testy
npm test

# Testy w trybie watch
npm run test:watch

# Pokrycie kodu
npm run test:coverage
```

## 📊 Performance

### Mobile Optimizations
- Lazy loading komponentów
- Debounced search
- Memoized calculations
- Touch event optimizations
- Reduced animations na mobile

### Bundle Size
- Tree shaking
- Code splitting
- Optimized imports
- Compressed assets

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS 14+, Android 8+

## 📝 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

## 🤝 Contributing

1. Fork projekt
2. Stwórz feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do branch (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/username/ButtonKrisu/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/ButtonKrisu/discussions)
- **Wiki**: [GitHub Wiki](https://github.com/username/ButtonKrisu/wiki)

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
