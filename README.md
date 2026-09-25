# Evrone Article Posts

Конструктор постов-статей для Instagram Evrone: заголовок шрифтом Roboto Flex и 3D-иллюстрация на чёрном фоне. Экспорт в PNG 1080×1440. Figma не нужна.

На странице:
- конструктор поста;
- промпт для иллюстрации в ChatGPT;
- инструкция;
- правила хорошего поста.

## Структура

```
src/page.html        исходник страницы (разметка, стили, скрипт, промпт)
fonts/rf60.woff2     Roboto Flex, ширина 60 (заголовки по умолчанию)
fonts/widths/        Roboto Flex, ширины 25–59 для ползунка «Узкая»
fonts/OFL.txt        лицензия шрифта
assets/sample.webp   иллюстрация-пример (прозрачный фон)
build.py             собирает страницу в один файл
tools/make_fonts.py  пересобирает шрифты из вариативного Roboto Flex
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
