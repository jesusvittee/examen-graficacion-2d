# 🐠 Goldfish — The Deep Run

Videojuego 2D de supervivencia acuática hecho con HTML5 Canvas puro, sin frameworks ni dependencias de juego.

![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Estilos-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)

## 🎮 ¿De qué trata?

Controla a Goldfish mientras cae en las profundidades del océano. Esquiva rocas y troncos, recoge algas y atrapa burbujas para sobrevivir el mayor tiempo posible.

## 🕹️ Controles

| Tecla / Entrada | Acción |
|---|---|
| `← →` | Mover izquierda / derecha |
| `Mouse` | El pez sigue el cursor |
| `Space` | Pausar / abrir instrucciones |

## ⚙️ Mecánicas

- **Obstáculos** — Rocas 🪨 y troncos 🪵 caen desde arriba. Colisionar resta una vida.
- **Algas** 🌿 — Inofensivas. Recógelas para sumar a tu contador personal.
- **Burbujas** 🫧 — Aparecen al perder la 1ª y 2ª vida. Tócalas para recuperar un corazón.
- **Dificultad progresiva** — La velocidad aumenta con el tiempo, con pausas aleatorias de alivio.
- **Récords locales** — Distancia y algas se guardan en `localStorage`.

## 🗂️ Estructura

```
/
├── index.html
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

## 🚀 Uso

Abre `index.html` directamente en el navegador. No requiere servidor ni instalación.

## 🛠️ Tecnologías

- HTML5 Canvas API (sprites pixel-art dibujados en código)
- CSS3 + Bootstrap 5.3
- JavaScript ES6+ (IIFE, sin dependencias de juego externas)