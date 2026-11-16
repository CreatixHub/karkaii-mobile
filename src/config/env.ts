// Expo inlines any EXPO_PUBLIC_* variable at build time — no extra package needed.
// Never put secrets here: this ends up in the app bundle, same as a VITE_* var in the web app.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';
