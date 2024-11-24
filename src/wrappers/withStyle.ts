import { BasicArgs } from '../watch2';
import { createWrapper } from './createWrapper';

type CSSProperties = Partial<CSSStyleDeclaration>;

interface StyleManager {
  apply: () => void;
  revert: () => void;
}

interface ScopedStyleFunction {
  (selector: string, styles: Record<string, CSSProperties> | string): StyleManager;
}

interface StyleFunction {
  (styles: CSSProperties): StyleManager;
  scoped: ScopedStyleFunction;
}

interface ArgsWithStyle {
  style: StyleFunction;
}
/**
 * Creates a wrapper that adds styling capabilities to the provided element.
 * This wrapper provides methods for both inline and scoped styling.
 * 
 * @example
 * // Basic usage
 * const setupFn = withStyle((args) => {
 *   const { el, style } = args;
 * 
 *   // Inline styling
 *   const headerStyle = style({ color: 'blue', fontSize: '20px' });
 *   headerStyle.apply();
 * 
 *   // Scoped styling
 *   const scopedStyle = style.scoped('#myComponent', {
 *     '.header': { color: 'red', fontSize: '24px' },
 *     '.content': { backgroundColor: 'lightgray', padding: '10px' }
 *   });
 *   scopedStyle.apply();
 * 
 *   return () => {
 *     headerStyle.revert();
 *     scopedStyle.revert();
 *   };
 * });
 * 
 * watch('#myComponent', setupFn);
 */
export const withStyle = createWrapper(<T extends { el: HTMLElement } & BasicArgs<HTMLElement>>(args: T): T & ArgsWithStyle => {
  const { el } = args;
  if (!(el instanceof HTMLElement)) throw new Error(`el must be an HTMLElement, passed` + JSON.stringify(el))
  
  // Store original styles
  const originalStyles: CSSProperties = {};
    /**
   * Applies inline styles to the element and provides methods to apply and revert the styles.
   * 
   * @param {CSSProperties} styles - An object of CSS properties to apply.
   * @returns {StyleManager} An object with apply and revert methods.
   * 
   * @example
   * const buttonStyle = style({
   *   backgroundColor: 'blue',
   *   color: 'white',
   *   padding: '10px 20px'
   * });
   * 
   * buttonStyle.apply(); // Apply the styles
   * // ... later ...
   * buttonStyle.revert(); // Revert to original styles
   */
  const styleFunction: StyleFunction = (styles: CSSProperties): StyleManager => {
    // Store original styles and prepare new styles
    Object.keys(styles).forEach(key => {

      originalStyles[key] = el?.style?.[key];
    });
    
    return {
      apply: () => {
        Object.assign(el.style, styles);
      },
      revert: () => {
        Object.keys(styles).forEach(key => {
          el.style[key] = originalStyles[key] || '';
        });
      }
    };
  };

  styleFunction.scoped = (selector: string, styles: Record<string, CSSProperties> | string): StyleManager => {
    const styleSheet = new CSSStyleSheet();
    const scopeSelector = selector || `#${el.id}` || createScopeSelector(el);
    
    let styleContent: string;
    if (typeof styles === 'string') {
      styleContent = styles;
    } else {
      styleContent = Object.entries(styles)
        .map(([selector, properties]) => {
          const cssText = Object.entries(properties)
            .map(([prop, value]) => `${kebabCase(prop)}: ${value};`)
            .join(' ');
          return `${selector} { ${cssText} }`;
        })
        .join('\n');
    }
    
    styleSheet.replaceSync(`@scope (${scopeSelector}) { ${styleContent} }`);
    
    return {
      apply: () => {
        if (!document.adoptedStyleSheets.includes(styleSheet)) {
          document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];
        }
      },
      revert: () => {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(sheet => sheet !== styleSheet);
      }
    };
  };
  
  return { ...args, style: styleFunction };
});

// Helper functions
function kebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function createScopeSelector(el: Element): string {
  const classes = Array.from(el.classList).map(c => `.${c}`).join('');
  return el.tagName.toLowerCase() + classes;
}
