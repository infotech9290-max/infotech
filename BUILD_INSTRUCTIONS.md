# App & Desktop Build Instructions (Phase 6)

Is project ko ek Website ki tarah poori tarah code kar diya gaya hai. Jab aapko iska **.exe (Desktop)** aur **.apk (Android)** chahiye ho, toh ye steps follow karein:

## 1. Desktop App (.exe) - Using Tauri
Tauri is project (Next.js) ko seedha ek fast aur secure desktop app mein convert kar dega.
1. Install Rust (`rustup-init.exe`) from rust-lang.org.
2. Run this command inside the `admin-portal` folder:
   ```bash
   npm run build
   npx tauri init
   ```
3. Update `tauri.conf.json` to point to the Next.js build folder (`out`).
4. Build the `.exe` file:
   ```bash
   npx tauri build
   ```
Aapki secure admin `.exe` file `src-tauri/target/release` folder mein ban jayegi.

## 2. Android App (.apk) - Using Capacitor / React Native
Website ko Android app mein convert karne ke liye Capacitor sabse best hai (kyunki code pehle se React mein hai):
1. Install Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   ```
2. Android platform add karein:
   ```bash
   npm install @capacitor/android
   npx cap add android
   ```
3. Apna code build karein aur Android Studio mein open karein:
   ```bash
   npm run build
   npx cap sync
   npx cap open android
   ```
Android studio se aap apni `.apk` generate kar sakte hain.
