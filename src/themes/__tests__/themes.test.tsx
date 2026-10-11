import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import defaultTheme from '../default';
import halloweenTheme from '../halloween';
import christmasTheme from '../christmas';
import currentTheme, { ThemeNavbar, ThemeHero } from '../active-theme';

describe('Sistema Modular de Temas por Temporada (Opción 1)', () => {
  describe('Contrato e Integridad de Módulos de Tema', () => {
    const themes = [
      { name: 'default', module: defaultTheme, expectedId: 'default' },
      { name: 'halloween', module: halloweenTheme, expectedId: 'halloween' },
      { name: 'christmas', module: christmasTheme, expectedId: 'christmas' },
    ];

    themes.forEach(({ name, module, expectedId }) => {
      it(`el tema ${name} cumple con la interfaz IThemeModule requerida`, () => {
        expect(module.config).toBeDefined();
        expect(module.config.id).toBe(expectedId);
        expect(typeof module.config.displayName).toBe('string');
        expect(typeof module.config.description).toBe('string');
        expect(typeof module.ThemeNavbar).toBe('function');
        expect(typeof module.ThemeHero).toBe('function');
        expect(module.themeColors).toBeDefined();
        expect(typeof module.themeColors?.primary).toBe('string');
        expect(typeof module.themeColors?.accent).toBe('string');
      });
    });
  });

  describe('Tema Default (Estándar Institucional)', () => {
    it('renderiza el Navbar institucional con enlaces de navegación estándar', () => {
      const Navbar = defaultTheme.ThemeNavbar;
      render(<Navbar />);

      expect(screen.getByText(/Residencial México/i)).toBeInTheDocument();
      expect(screen.getByText('RM')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /reglamento y estatutos/i })).toBeInTheDocument();
    });

    it('renderiza el Hero institucional con badge de Sistema Electrónico', () => {
      const Hero = defaultTheme.ThemeHero;
      render(<Hero />);

      expect(screen.getByText(/Comunidad y Transparencia/i)).toBeInTheDocument();
      expect(screen.getByText(/Sistema Electronico 2026/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver finanzas/i })).toBeInTheDocument();
    });
  });

  describe('Tema Halloween (Edición Spooky)', () => {
    it('renderiza el Navbar de Halloween con icono de calabaza y enlace de actividades spooky', () => {
      const Navbar = halloweenTheme.ThemeNavbar;
      render(<Navbar />);

      expect(screen.getByText('🎃')).toBeInTheDocument();
      expect(screen.getByText(/Actividades Spooky/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /acceso/i })).toHaveAttribute('href', '/admin');
    });

    it('renderiza el Hero de Halloween con llamados temáticos de concurso', () => {
      const Hero = halloweenTheme.ThemeHero;
      render(<Hero />);

      expect(screen.getByText(/Edición Especial de Halloween 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Noche de Tradición y Alegría/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver eventos y concursos/i })).toBeInTheDocument();
    });

    it('ThemeLayoutWrapper incluye contenedor con efecto visual temático', () => {
      const Wrapper = halloweenTheme.ThemeLayoutWrapper!;
      const { container } = render(
        <Wrapper>
          <div data-testid="spooky-content">Contenido Spooky</div>
        </Wrapper>
      );

      expect(screen.getByTestId('spooky-content')).toBeInTheDocument();
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  describe('Tema Navidad (Edición Invernal y Fiestas Navideñas)', () => {
    it('renderiza el Navbar de Navidad con icono invernal y convivio navideño', () => {
      const Navbar = christmasTheme.ThemeNavbar;
      render(<Navbar />);

      expect(screen.getByText('❄️')).toBeInTheDocument();
      expect(screen.getByText(/Convivio Navideño/i)).toBeInTheDocument();
    });

    it('renderiza el Hero de Navidad con felicitaciones familiares e invernales', () => {
      const Hero = christmasTheme.ThemeHero;
      render(<Hero />);

      expect(screen.getByText(/Edición Invernal y Fin de Año 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Convivencia Vecinal/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver agenda navideña/i })).toBeInTheDocument();
    });
  });

  describe('active-theme Module Resolution', () => {
    it('provee los componentes exportados del tema resuelto', () => {
      expect(currentTheme).toBeDefined();
      expect(ThemeNavbar).toBeDefined();
      expect(ThemeHero).toBeDefined();

      render(<ThemeNavbar />);
      expect(screen.getByText(/Residencial México/i)).toBeInTheDocument();
    });
  });
});
