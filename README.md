# Contrast Checker for Miro by Nexfield

A Miro app that checks colour contrast on your board. Select a sticky note, shape or text and see its **WCAG 2.2 contrast ratio** with **AA / AAA** results for normal text, large text and UI components. You can also compare any two colours by hand.

Made by [Nexfield Academy](https://nexfield.academy/), an online school of UX/UI, graphic and web design. For a full-page tool with a colour picker, use the free [online contrast checker](https://nexfield.academy/resources/services/contrast-checker/).

## How it works

- **Selection:** sticky notes are checked against their colour, shapes and text items against their fill (a transparent fill counts as the white board; fill opacity is applied).
- **Manual check:** type or pick a text colour and a background colour.
- **Maths:** contrast ratio = (L1 + 0.05) / (L2 + 0.05), WCAG relative luminance; the ratio is rounded down to two decimals before it is compared, so 4.49:1 never passes as 4.5:1.

## Privacy

The app reads the colours of the items you select. It does not store, send or collect any board content or personal data. Website privacy policy: https://nexfield.academy/privacy-policy/

## Development

Plain HTML and ES modules, no build step. `index.html` is the headless entry Miro loads, `app.html` the panel. `contrast.js` is compiled from [nexfield-vscode](https://github.com/stepan-wemake/nexfield-vscode)'s `src/contrast.ts`.

```bash
npm test
```

## License

MIT
