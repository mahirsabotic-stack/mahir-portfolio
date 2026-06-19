# Mahir Sabotic Portfolio

Award-style, motion-rich one-page portfolio. Dark spotlight design with cinematic scroll storytelling.

## Tech / Motion stack
- **GSAP 3.13 + ScrollTrigger + SplitText** (CDN) - preloader timeline, char/word text reveals, scroll-scrubbed hero, pinned horizontal project showcase, parallax, counters
- **Lenis** (CDN) - smooth scrolling, wired into GSAP's ticker
- **Three.js** (CDN) - WebGL particle depth field behind the whole page
- **OpenRouter** - AI chatbot provider through a Vercel serverless function
- Vanilla CSS/JS for everything else

## Signature moments
- Preloader with 000 to 100 counter and curtain reveal into a staggered hero intro
- Hero name splits into characters, mouse parallax on title and portrait, rotating "Open for projects" badge
- Velocity-reactive marquee strip between hero and skills
- Skills cards stack and fan out on scroll
- Work section pins and scrolls horizontally on desktop, with vertical cards on mobile
- Animated stat counters in About, live Skopje clock in the footer
- Custom cursor with magnetic buttons and a "View" label over projects
- Floating AI chatbot for portfolio questions

## Files
- `index.html` - page structure + CDN scripts
- `styles.css` - layout, hero styling, abstract CSS background elements, all component styles
- `script.js` - the motion system and AI chat frontend
- `api/chat.js` - Vercel serverless endpoint for the AI chatbot
- `api/portfolio-knowledge.json` - portfolio facts used by the chatbot
- `assets/` - hero spotlight, portrait and project preview images

## AI chatbot setup on Vercel
1. Create an OpenRouter API key.
2. In Vercel, open Project Settings -> Environment Variables.
3. Add `OPENROUTER_API_KEY` with your key.
4. Optional: add `OPENROUTER_MODEL=openrouter/free` to use OpenRouter's free model router.
5. Redeploy the site after adding the variable.

Do not put the API key in `script.js` or `index.html`. The browser calls `/api/chat`, and the serverless function talks to OpenRouter.

## Notes
- Needs an internet connection for the CDN libraries and Google Fonts.
- The contact form is front-end only - connect Formspree, Netlify, or another backend before publishing.
- Replace the LinkedIn/Instagram placeholder links and the "Add profile URL" text before going live.
