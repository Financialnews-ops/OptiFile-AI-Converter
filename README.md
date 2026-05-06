<div align="center">
  <img width="1200" alt="OptiFile AI Converter" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<h1 align="center">OptiFile AI Converter</h1>

<p align="center">
  Convert PDFs, images, and Office docs into AI-optimized formats.<br/>
  Cut LLM token costs and skip vision-encoding overhead.
</p>

<p align="center">
  <a href="#english">🇬🇧 English</a> &nbsp;·&nbsp; <a href="#polski">🇵🇱 Polski</a>
</p>

---

## English

### What it does
Drop in a PDF, image, DOCX, XLSX, or PPTX. Get back clean Markdown, TXT, JSON, or HTML — ready to feed to ChatGPT, Claude, or Gemini at a fraction of the original token cost.

### Why it matters
HTML and binary formats are expensive for LLMs. The same 720-character document costs ~269 tokens as Markdown but ~416 as HTML — that's 55% more for the same information. Vision encoding for raw images and scanned PDFs is even worse: a 6-page PDF can run ~6,000 tokens through vision vs. ~840 tokens after local extraction.

OptiFile pre-processes everything down to the leanest format your model actually needs, then shows you exactly how many tokens you saved.

### Quick start
​```bash
npm install
npm run dev
​```
Open `http://localhost:3000`, click **Settings**, paste your Gemini API key, you're done.

### Privacy & keys (BYOK)
This is a **Bring Your Own Key** app. Your Gemini API key is stored only in your own browser (`localStorage` / `sessionStorage`) and travels straight from your browser to Google. It never touches the developer's server. There is no developer key — if you don't add yours, the app simply asks you to.

### License
MIT — see [LICENSE](LICENSE). Free to use, modify, and ship commercially. Just keep the credit line.

### Credits
Built by **HTNY Studios** · [Instagram](https://www.instagram.com/hot_techno_near_you/) · [Facebook](https://www.facebook.com/hottechnonearyou)

---

## Polski

### Co to robi
Wrzucasz PDF, obraz, DOCX, XLSX albo PPTX. Dostajesz z powrotem czysty Markdown, TXT, JSON albo HTML — gotowy do wysłania do ChatGPT, Claude lub Gemini w ułamku pierwotnego kosztu tokenów.

### Dlaczego to ma sens
HTML i formaty binarne są drogie dla LLM-ów. Ten sam dokument o długości 720 znaków kosztuje ~269 tokenów jako Markdown, ale ~416 jako HTML — czyli o 55% więcej za tę samą treść. Vision encoding dla obrazów i skanów PDF jest jeszcze gorszy: 6-stronicowy PDF potrafi pochłonąć ~6 000 tokenów przez vision zamiast ~840 tokenów po lokalnej ekstrakcji.

OptiFile preprocesuje wszystko do najlżejszego formatu, którego naprawdę potrzebuje Twój model, a potem pokazuje, ile tokenów zaoszczędziłeś.

### Szybki start
​```bash
npm install
npm run dev
​```
Otwórz `http://localhost:3000`, kliknij **Settings**, wklej swój klucz Gemini API. Gotowe.

### Prywatność i klucze (BYOK)
Aplikacja działa w modelu **Bring Your Own Key**. Twój klucz Gemini API zostaje wyłącznie w Twojej przeglądarce (`localStorage` / `sessionStorage`) i jedzie bezpośrednio z Twojej przeglądarki do Google. Nigdy nie trafia na serwer autora. Nie ma globalnego klucza — jeśli swojego nie dodasz, aplikacja po prostu o niego poprosi.

### Licencja
MIT — zobacz [LICENSE](LICENSE). Wolno używać, modyfikować i wykorzystywać komercyjnie. Wystarczy zachować informację o autorze.

### Autorzy
Stworzone przez **HTNY Studios** · [Instagram](https://www.instagram.com/hot_techno_near_you/) · [Facebook](https://www.facebook.com/hottechnonearyou)
