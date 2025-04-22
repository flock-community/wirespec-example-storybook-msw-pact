import { unsafeCSS, LitElement } from 'lit';
// Import the CSS file with the ?inline query parameter to get it as a string
import styles from './styles/main.css?inline';

/**
 * Utility function to apply Tailwind CSS to a LitElement component's shadow DOM
 * @param baseClass The base class to extend (usually LitElement)
 * @returns A class that extends the base class with Tailwind CSS support
 */
export function withTailwind(baseClass: typeof LitElement): typeof LitElement {
  const existingStyles = baseClass.styles || [];
  const arrayStyles = Array.isArray(existingStyles) ? existingStyles : [existingStyles];

  return class extends baseClass {
    static styles = [
      unsafeCSS(styles),
      ...arrayStyles.filter(Boolean)
    ];
  };
}
