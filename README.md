# ByteCart

ByteCart is an e-commerce platform featuring an interactive web application and a companion Android application built with Capacitor.

## Project Structure

```text
ByteCart/
├── ByteCart android application/    # Android / Capacitor mobile application
│   ├── android/                     # Native Android project (Gradle)
│   ├── assets/                      # App assets & SVG branding
│   ├── icons/                       # Multi-density app launcher icons
│   ├── capacitor.config.json        # Capacitor configuration
│   └── package.json                 # Mobile dependencies and scripts
└── ByteCart website/                # Web store frontend
    ├── bytecart_v2.html             # Main storefront HTML
    ├── bytecart_v2.css              # Custom styling
    ├── bytecart_v2.js               # Frontend application logic
    ├── Bytecart_v2.jsx              # React / Component source
    └── serve_v2.py                  # Local Python preview server
```

## Getting Started

### Web Application
To run the local preview server:
```bash
python "ByteCart website/serve_v2.py"
```
Or open `ByteCart website/bytecart_v2.html` directly in any modern browser.

### Android Application
1. Navigate to `ByteCart android application/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```
   Or build via Gradle in `ByteCart android application/android/`.
