import React from 'react';
import './Nosotros.css';

export function Nosotros() {
  return (
    <main className="nosotros-container">
      <article className="nosotros-card">
        <h2 className="nosotros-title">Sobre Nosotros</h2>
        <p className="nosotros-subtitle">
          Tradición gráfica, tecnología moderna y compromiso mayorista.
        </p>

        <div className="nosotros-content">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat.
          </p>

          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
            proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            Nos especializamos en abastecer imprentas, empresas editoriales y
            organizaciones de todo el país con materias primas certificadas e
            impresión de alto volumen.
          </p>

          <p>
            Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius,
            turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis
            sollicitudin mauris. Integer in mauris eu nibh euismod gravida.
          </p>
        </div>
      </article>
    </main>
  );
}
