# Evrone Article Posts

Конструктор постов для Instagram Evrone, экспорт в PNG 1080×1440. Figma не нужна. Два режима:
- **Статья** — заголовок шрифтом Roboto Flex и 3D-иллюстрация на чёрном фоне;
- **Кейс** — готовая картинка клиента, скадрированная под 3:4 без пустых краёв (ползунки размера и положения, перетаскивание, масштаб колесом или щипком) и логотип клиента по желанию (SVG/PNG, перекраска в белый/чёрный).

Интерфейс сделан по макету Figma Post-Builder: три колонки в стиле панелей Figma. Кнопка «?» открывает помощь: инструкцию, промпт для иллюстрации в ChatGPT и правила хорошего поста.

## Структура

```
src/page.html        разметка страницы
src/style.css        стили
src/prompt.txt       промпт для иллюстрации (показывается в помощи)
src/js/              скрипт по частям, склеивается в один в порядке из build.py
fonts/rf60.woff2     Roboto Flex, ширина 60 (заголовки по умолчанию)
fonts/widths/        Roboto Flex, ширины 25–59 для ползунка «Ширина букв»
fonts/OFL.txt        лицензия шрифта
assets/sample.webp   иллюстрация-пример (прозрачный фон)
assets/case-sample.jpg  пример картинки для режима «Кейс» (more.tv)
build.py             собирает страницу в один файл
tools/make_fonts.py  пересобирает шрифты из вариативного Roboto Flex
index.html           собранная страница для GitHub Pages
```

## Сборка

Править нужно файлы в `src/`, затем собрать страницу:

```bash
python3 build.py
```

Скрипт склеивает разметку, стили и скрипт и встраивает шрифты и картинки в `index.html` и `dist/artifact.html`, поэтому каждый из них работает одним файлом.

## GitHub Pages

Settings → Pages → Source: *Deploy from a branch*, ветка `main`, папка `/ (root)`. Страница откроется по адресу `https://<user>.github.io/<repo>/`.

## Шрифт

Canvas не умеет задавать оси вариативного шрифта, поэтому каждая ширина заголовка сохранена отдельным статическим шрифтом. Остальные оси взяты из макетов в Figma:

| ось | значение |
|---|---|
| wght | 800 |
| wdth | 60 (или 25–59 в «Настроить») |
| opsz | 144 |
| GRAD / slnt | 0 / 0 |
| XOPQ / YOPQ / XTRA | 96 / 60 / 468 |
| YTUC / YTLC / YTAS / YTDE / YTFI | 712 / 514 / 750 / −203 / 738 |

Остальные параметры: кегль 180, интерльяж 100%, трекинг +1%, капс, цвет `#EEEEEE`, поля 30 px.

Чтобы пересобрать шрифты:

```bash
pip install fonttools brotli
python3 tools/make_fonts.py "RobotoFlex[GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght].ttf"
python3 build.py
```

Roboto Flex распространяется по лицензии SIL Open Font License 1.1 (`fonts/OFL.txt`).
