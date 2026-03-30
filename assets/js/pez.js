function drawGoldfishSprite(c, w, h, flip = false, rotation = 0) {
  c.save();

  // Mover al centro para rotar correctamente
  c.translate(w / 2, h / 2);
  c.rotate(rotation);
  c.translate(-w / 2, -h / 2);

  // Flip opcional
  if (flip) {
    c.scale(-1, 1);
    c.translate(-w, 0);
  }

  c.imageSmoothingEnabled = false;

  const pw = w / 16, ph = h / 10;

  function px(col, row, color, cols=1, rows=1) {
    c.fillStyle = color;
    c.fillRect(
      Math.round(col * pw),
      Math.round(row * ph),
      Math.ceil(cols * pw),
      Math.ceil(rows * ph)
    );
  }

  // Cola
  px(0,2,'#ff4400'); px(0,3,'#ff6600'); px(0,4,'#ff4400');
  px(1,1,'#ff5500'); px(1,2,'#ff8800'); px(1,3,'#ffaa00'); px(1,4,'#ff8800'); px(1,5,'#ff5500');

  const bodyColor = '#ff8c00';
  const bodyHi = '#ffcc44';
  const bodyShad = '#cc4400';

  // Cuerpo
  px(2,2,bodyHi); px(3,2,bodyHi); px(4,2,bodyHi); px(5,2,bodyColor); px(6,2,bodyColor);
  px(2,3,bodyHi); px(3,3,bodyHi); px(4,3,bodyColor); px(5,3,bodyColor); px(6,3,bodyColor); px(7,3,bodyColor);
  px(2,4,bodyColor); px(3,4,bodyColor); px(4,4,bodyColor); px(5,4,bodyColor); px(6,4,bodyColor); px(7,4,bodyColor); px(8,4,bodyShad);
  px(2,5,bodyShad); px(3,5,bodyColor); px(4,5,bodyColor); px(5,5,bodyColor); px(6,5,bodyColor); px(7,5,bodyShad);
  px(3,6,bodyShad); px(4,6,bodyShad); px(5,6,bodyShad);

  // Aleta superior
  px(5,1,'#ffaa00'); px(6,1,'#ffcc00'); px(7,1,'#ffaa00');

  // Ojo
  c.fillStyle = '#fff';
  c.fillRect(Math.round(9.0*pw), Math.round(3.0*ph), Math.ceil(0.6*pw), Math.ceil(0.6*ph));
  c.fillStyle = '#222';
  c.fillRect(Math.round(9.2*pw), Math.round(3.2*ph), Math.ceil(0.5*pw), Math.ceil(0.5*ph));
  c.fillStyle = '#fff';
  c.fillRect(Math.round(9.1*pw), Math.round(3.1*ph), Math.ceil(0.2*pw), Math.ceil(0.2*ph));

  // Boca
  px(10,3,'#ffaa44'); px(10,4,'#ffaa44'); px(10,5,'#ff8844');
  px(11,4,'#ff9933');

  c.fillStyle = '#cc3300';
  c.fillRect(Math.round(11.5*pw), Math.round(4.5*ph), Math.ceil(0.8*pw), Math.ceil(0.3*ph));

  // Detalles (escamas)
  c.strokeStyle = 'rgba(180,60,0,0.35)';
  c.lineWidth = Math.max(1, pw*0.5);
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc((4+i*1.5)*pw, 4.5*ph, 1.5*pw, Math.PI, 0);
    c.stroke();
  }

  c.restore();
}