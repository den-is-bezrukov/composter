# Evrone Article Posts

Конструктор постов для Instagram Evrone, экспорт в PNG 1080×1440. Figma не нужна. Два режима:
- **Статья** — заголовок шрифтом Roboto Flex и 3D-иллюстрация на чёрном фоне;
- **Кейс** — готовая картинка клиента, скадрированная под 3:4 (перетаскивание, масштаб колесом или щипком, «Заполнить» / «Вписать»), фон под пустыми краями (цвет или размытие) и логотип клиента по желанию (SVG/PNG, перекраска в белый/чёрный).

На странице:
- конструктор поста;
- промпт для иллюстрации в ChatGPT;
- инструкция;
- правила хорошего поста.

## Дизайн в Figma

Внешний вид конструктора и геометрия постов лежат в Figma: [Evrone Post Builder](https://www.figma.com/design/b98SroxNlvHXWPNKJLfUZ6). Как устроена связка и синхронизация — [docs/figma-sync.md](docs/figma-sync.md).

## Структура

```
src/page.html        исходник страницы (разметка, стили, скрипт, промпт)
fonts/rf60.woff2     Roboto Flex, ширина 60 (заголовки по умолчанию)
fonts/widths/        Roboto Flex, ширины 25–59 для ползунка «Узкая»
fonts/OFL.txt        лицензия шрифта
assets/sample.webp   иллюстрация-пример (прозрачный фон)
assets/case-sample.jpg  пример картинки для режима «Кейс» (more.tv)
build.py             собирает страницу в один файл
tools/make_fonts.py  пересобирает шрифты из вариативного Roboto Flex
tools/figma-read.js  читает дизайн из Figma для синхронизации
design/figma-baseline.json  снимок Figma на момент последней синхронизации
docs/figma-sync.md   как устроена связка с Figma
index.html           собранная страница для GitHub Pages
```

## Сборка

Править нужно `src/page.html`, затем собрать страницу:

```bash
python3 build.py
```

Скрипт встраивает шрифты и картинку в `index.html` и `dist/artifact.html`, поэтому каждый из них работает одним файлом.

## GitHub Pages

Settings → Pages → Source: *Deploy from a branch*, ветка `main`, папка `/ (root)`. Страница откроется по адресу `https://<user>.github.io/<repo>/`.

## Шрифт

Canvas не умеет задавать оси вариативного шрифта, поэтому каждая ширина заголовка сохранена отдельным статическим шрифтом. Остальные оси взяты из макетов в Figma:

| ось | значение |
|---|---|
| wght | 800 |
| wdth | 60 (или 25–59 для узкой) |
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
