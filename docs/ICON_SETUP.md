# PWA Icon Setup Guide

This directory should contain the PWA icons for your application. The icons are referenced in the `manifest.json` and are essential for:

- Installing the app on mobile home screens
- Displaying in the app drawer
- Showing in the browser tab
- Apple iOS home screen icons

## Required Icons

You need to create and place the following images in this directory:

1. **icon-192x192.png** - Standard app icon (192x192 pixels)
2. **icon-256x256.png** - Medium app icon (256x256 pixels)
3. **icon-384x384.png** - Large app icon (384x384 pixels)
4. **icon-512x512.png** - Extra large app icon (512x512 pixels)
5. **icon-192x192-maskable.png** - Maskable icon for adaptive displays (192x192 pixels)
6. **icon-512x512-maskable.png** - Maskable icon for adaptive displays (512x512 pixels)
7. **screenshot-1.png** - Mobile screenshot for app store (540x720 pixels)
8. **screenshot-2.png** - Desktop screenshot for app store (1280x720 pixels)

## How to Generate Icons

### Option 1: Using PWA Image Generator Tools (Easiest)
1. Visit: https://www.pwa-image-generator.com/
2. Upload your app logo/image
3. Select "Next.js" or "PWA"
4. Download all generated icons
5. Place them in this directory

### Option 2: Using Figma
1. Create a 512x512 design in Figma
2. Export at different sizes (192, 256, 384, 512)
3. For maskable versions, ensure safe area is at least 40px from edges

### Option 3: Using ImageMagick (Command Line)
```bash
# Requires ImageMagick to be installed
convert input-logo.png -resize 192x192 icon-192x192.png
convert input-logo.png -resize 256x256 icon-256x256.png
convert input-logo.png -resize 384x384 icon-384x384.png
convert input-logo.png -resize 512x512 icon-512x512.png
```

### Option 4: Using Online Tools
1. **BG Remover**: https://www.remove.bg/ - Remove background from your logo
2. **Favicon Generator**: https://realfavicongenerator.net/
3. Upload your logo and it will generate multiple sizes

## Maskable Icons

Maskable icons are used on devices that support adaptive icons (Android 8+). They allow the system to apply custom masks to your icon. 

To create maskable versions:
1. Take your 512x512 icon
2. Add padding (about 40px) around the content
3. Save separately as `*-maskable.png`
4. They should be on a solid background

## Icon Design Tips

- Use solid colors that represent your brand
- Keep design simple and recognizable at small sizes
- Use high contrast background and foreground
- Include your app's visual identity (EST Tétouan colors/logo)
- Avoid text in icons (not readable at small sizes)
- Use transparency in PNG files for better integration

## Testing Your Icons

After placing the icons:

1. **Develop**: Run `npm run dev` 
2. **Build**: Run `npm run build`
3. **Start**: Run `npm start`
4. Open the app in a browser
5. Check the manifest: Visit `https://yourdomain.com/manifest.json`
6. Test on mobile: Open on Android/iOS and try to "Add to Home Screen"

## Key Brand Colors for ESTT

- Primary Blue: #2563eb (used as theme-color in head)
- Consider incorporating EST Tétouan's colors into the icon design

---

Once you have the icons ready, place them in this directory and your PWA will be fully functional!
