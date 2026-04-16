# Design System — KanFlow

## Filosofía
Soft UI: superficies blancas, sombras suaves, bordes redondeados generosos, tipografía expresiva. Sensación ligera, profesional y memorable. Sin glassmorphism ni efectos pesados.

## Paleta de colores

| Token | Hex | Uso |
|---|---|---|
| `accent-yellow` | `#F2E840` | CTA primario, nav activo, highlights |
| `accent-lila` | `#D4B8F0` | Etiquetas, acentos secundarios |
| `accent-rose` | `#F0B8D0` | Etiquetas, acentos terciarios |
| `cream` | `#F5F3EE` | Fondo de la app |
| `surface` | `#FFFFFF` | Cards, modales, sidebar |
| `ink` | `#111111` | Texto base |
| `ink/60` | `#111111 60%` | Texto secundario |
| `ink/10` | `#111111 10%` | Borders, separadores |

## Tipografía

| Familia | Peso | Uso |
|---|---|---|
| Syne | 800 | Títulos de boards, headings h1/h2, números grandes |
| DM Sans | 400 | Texto corriente, descripciones, labels |
| DM Sans | 500 | Botones, labels de énfasis |

**Nunca usar:** Inter, Roboto, SF Pro, system fonts.

## Espaciado y forma

```css
--radius-card: 16px;          /* Cards, modales, columnas */
--radius-button: 12px;        /* Botones */
--radius-badge: 9999px;       /* Badges, avatares */

--shadow-card: 0 2px 12px rgba(0,0,0,0.06);
--shadow-card-hover: 0 4px 20px rgba(0,0,0,0.10);
--shadow-modal: 0 8px 40px rgba(0,0,0,0.12);
```

## Animaciones

| Elemento | Duración | Easing |
|---|---|---|
| Hover states | 100ms | ease-out |
| Card transitions | 200ms | ease-out |
| Modal open/close | 200ms | spring (stiffness 300, damping 30) |
| Drag & drop | spring | stiffness 300, damping 30 |
| Checklist check | 150ms | ease-out |

**Nunca usar:** transiciones > 300ms, bounces exagerados, efectos de blur.

## Componentes

### Button
- Primary: fondo `accent-yellow`, texto `ink`
- Secondary: borde `ink/10`, fondo blanco
- Ghost: sin fondo, texto `ink/60`
- Danger: fondo `red-100`, texto `red-700`
- Sizes: sm (px-3 py-1.5), md (px-4 py-2), lg (px-5 py-2.5)

### Card (Kanban)
- `border-radius: 16px`
- `box-shadow: 0 2px 12px rgba(0,0,0,0.06)`
- Padding: `p-4`
- Hover: `box-shadow: 0 4px 20px rgba(0,0,0,0.10)`

### Avatar
- Circular, sizes: sm (28px), md (36px), lg (44px)
- Fallback: iniciales con fondo de color determinístico
- Overlap group: `ring-2 ring-white`, `-space-x-2`

### Badge / Label
- `border-radius: 9999px`
- Color de fondo al 20% de opacidad, texto al 100%
- Font: DM Sans 500, text-xs
