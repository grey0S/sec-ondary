# sec·ondary — app iOS (SwiftUI)

## Requisitos

- macOS con **Xcode 15+**
- Opcional: [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)

## Generar el proyecto Xcode

```bash
cd ios
xcodegen generate
open SecOndary.xcodeproj
```

## Backend (API)

La app habla con el servidor Next.js del repo padre (`sec-ondary/`).

1. En el simulador, `http://127.0.0.1:3000` suele funcionar si el servidor corre en la misma Mac.
2. En **iPhone físico**, poné en `SecOndary/Info.plist` la clave **API_BASE_URL** con:
   - `http://IP-DE-TU-MAC:3000` (misma Wi‑Fi), o
   - la URL HTTPS de tu deploy (Vercel, etc.).

## Autenticación

`POST /api/auth/bootstrap` con cuerpo `{"platform":"ios"}` devuelve `apiToken`. La app lo guarda en **Llavero** y envía `Authorization: Bearer …` en cada request.

## TestFlight / App Store

Subí un archive firmado con tu cuenta de Apple. Luego configurá `NEXT_PUBLIC_IOS_INSTALL_URL` en el hosting del sitio web con el enlace público de TestFlight para que el QR de `/instalar-ios` apunte a tu build real.
