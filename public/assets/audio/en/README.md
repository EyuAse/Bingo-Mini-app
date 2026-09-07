# 🇪🇹 Addis AI / Custom Human Amharic Audio Sound Pack

Place your generated Addis AI (or studio human recorded) `.mp3` or `.wav` files into this directory.
The game engine automatically detects, preloads into memory, and plays them with **0ms latency**.

---

## 1. File Naming Guide

### Numbers (1 to 75)
Save each number as `{num}.mp3` (or `{col}-{num}.mp3`):
- `1.mp3` or `B-1.mp3`
- `2.mp3` or `B-2.mp3`
...
- `51.mp3` or `G-51.mp3`
...
- `75.mp3` or `O-75.mp3`

### Game Event Shouts
- `start.mp3` $\rightarrow$ *"ጨዋታው በይፋ ተጀምሯል! መልካም እድል!"*
- `solo_win.mp3` $\rightarrow$ *"ቢንጎ! ቢንጎ! እንኳን ደስ አለዎት! ሙሉ ፖቱን አሸንፈዋል!"*
- `split_win.mp3` $\rightarrow$ *"ቢንጎ! የጋራ አሸናፊዎች! ብሩ በእኩል ተከፋፍሏል!"*
- `opp_win.mp3` $\rightarrow$ *"ቢንጎ! አሸናፊ ተገኝቷል! ቀጣዩ ዙር አሁን ይጀምራል!"*
- `one_to_go.mp3` $\rightarrow$ *"አንድ ቁጥር ብቻ ቀርቷል! በርቱ!"*

---

## 2. Text Prompts Cheatsheet
Refer to `src/services/addisAiPrompts.ts` for the exact Amharic text script for all 75 numbers and event phrases.
