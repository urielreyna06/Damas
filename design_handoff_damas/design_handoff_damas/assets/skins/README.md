# Skin Assets — Estructura de archivos

Coloca los PNG recortados en las carpetas correspondientes. El sistema CSS los carga automáticamente cuando la skin está activa.

## Estructura esperada (49 archivos)

```
skins/
├── templo/
│   ├── hero.png          ← pieza humana (normal)
│   ├── hero-king.png     ← pieza humana (dama/rey)
│   ├── foe.png           ← pieza IA (normal)
│   ├── foe-king.png      ← pieza IA (dama/rey)
│   ├── tile-light.png    ← casilla clara (tileable, 512×512 recomendado)
│   ├── tile-dark.png     ← casilla oscura (tileable, 512×512 recomendado)
│   └── frame.png         ← marco exterior (1024×1024, centro transparente)
├── desierto/
│   └── (mismos 7 archivos)
├── bosque/
│   └── (mismos 7 archivos)
├── hada/
│   └── (mismos 7 archivos)
├── fuego/
│   └── (mismos 7 archivos)
├── agua/
│   └── (mismos 7 archivos)
└── sombra/
    └── (mismos 7 archivos)
```

## Notas de integración

- **Piezas** (`hero.png`, `foe.png`, etc.): fondo transparente, la imagen se escala con `contain` dentro del disco circular de la pieza. Recomendado: 256×256 px o más.
- **Casillas** (`tile-light.png`, `tile-dark.png`): se escalan con `cover` para llenar cada casilla.
- **Marco** (`frame.png`): overlay sobre el tablero con `background-size: 100% 100%`. El centro debe ser transparente para que las casillas sean visibles a través de él.
- **Fallback**: si un PNG no existe o falla la carga, se muestran los colores CSS de `shared.js`. El juego nunca se rompe por un asset faltante.
- **Emoji ♔**: se oculta automáticamente para todas las skins PNG; la coronación la indica la imagen `*-king.png`.
