# Sanzo Pairings

Very quick project created for me to visualise what colors work with my own color palette. The goal is mainly fashion, but it takes advantage of Wada Sanzo's work to see what colors can work together.

## Adjusting the palette

The "in your palette" flag comes from the `fits()` function at the top of `app.js`. It looks at each color's lightness (L), warmth and saturation (from the CIELAB values in `data.js`). Change the thresholds there to match a different season.

## Credits

Color values and combination numbers follow Wada Sanzo's *Dictionary of Color Combinations*, via the open dataset
[mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations).
Check that repository's license and add any attribution it asks for before publishing.
