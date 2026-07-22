# Custom Piece Sets

Place your custom chess piece sets in this folder.

## Structure

```
piezas/
  mi-set/
    wk.svg  (White King)
    wq.svg  (White Queen)
    wr.svg  (White Rook)
    wb.svg  (White Bishop)
    wn.svg  (White Knight)
    wp.svg  (White Pawn)
    bk.svg  (Black King)
    bq.svg  (Black Queen)
    br.svg  (Black Rook)
    bb.svg  (Black Bishop)
    bn.svg  (Black Knight)
    bp.svg  (Black Pawn)
```

## Supported Formats

- **SVG** (recommended) - Vector format, scales perfectly at any size
- **PNG** - Raster format, make sure images are at least 128x128px

## File Naming

Files must be named exactly:
- `wk.svg` or `wk.png` for White King
- `bq.svg` or `bq.png` for Black Queen
- etc.

## Usage

In the Appearance Settings panel:
1. Go to the "Piezas" tab
2. Select "Custom" 
3. Enter the path: `/piezas/mi-set`

## Tips

- Use SVG viewBox="0 0 45 45" for best compatibility
- Pieces should have transparent backgrounds
- Test each piece at multiple sizes
