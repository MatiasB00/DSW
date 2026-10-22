import React from 'react';
import './Home.css';

export function Home() {
    return (
        <main className="home-container">
            <section className="hero-section">
                <h2 className="hero-title">
                    Soluciones Gráficas e Insumos al por Mayor
                </h2>
                <p className="hero-subtitle">
                    Abastecemos a imprentas, empresas e instituciones con la mejor calidad en impresiones digitales, offset y distribución de resmas e insumos.
                </p>
            </section>

            <section className="services-grid">
                <div className="service-card">
                    <h3 className="service-title">Venta de Insumos</h3>
                    <p className="service-description">
                        Papeles, cartulinas, tintas y tóners por bulto o pallet con precios diferenciales y stock permanente.
                    </p>
                </div>

                <div className="service-card">
                    <h3 className="service-title">Trabajos de Impresión</h3>
                    <p className="service-description">
                        Impresión de folletería, afiches y catálogos en simple y doble faz en gran volumen con acabados de primera.
                    </p>
                </div>

                <div className="service-card">
                    <h3 className="service-title">Gestión de Pedidos</h3>
                    <p className="service-description">
                        Carga tus requerimientos y haz el seguimiento en tiempo real del estado de producción y entrega de tu pedido.
                    </p>
                </div>
            </section>
        </main>
    );
}
