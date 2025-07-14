import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runOn, watch } from '../src/watch';
import {
  text,
  html,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
  removeAttr,
  hasAttr,
  prop,
  data,
  value,
  checked,
  focus,
  blur,
  show,
  hide,
  query,
  queryAll,
  parent,
  children,
  siblings,
  batchAll,
  createChildWatcher,
  child
} from '../src/api/dom';

// Test utilities
function createTestElement(tag: string = 'div', attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.body.appendChild(element);
  return element;
}

function waitForMutation(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('DOM Manipulation Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Text Content Manipulation', () => {
    describe('text() - Direct API', () => {
      it('should set text content directly', () => {
        const element = createTestElement('div');
        text(element, 'Hello World');
        expect(element.textContent).toBe('Hello World');
      });

      it('should get text content when value not provided', () => {
        const element = createTestElement('div');
        element.textContent = 'Existing text';
        expect(text(element)).toBe('Existing text');
      });

      it('should handle special characters', () => {
        const element = createTestElement('div');
        const specialText = 'Hello <script>alert("xss")</script> & "quotes"';
        text(element, specialText);
        expect(element.textContent).toBe(specialText);
        expect(element.innerHTML).not.toContain('<script>');
      });
    });

    describe('text() - Generator API', () => {
      it('should set text content via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield text('Generator text');
        });

        expect(element.textContent).toBe('Generator text');
      });

      it('should update text content multiple times', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield text('First');
          yield text('Second');
          yield text('Third');
        });

        expect(element.textContent).toBe('Third');
      });
    });
  });

  describe('HTML Content Manipulation', () => {
    describe('html() - Direct API', () => {
      it('should set innerHTML directly', () => {
        const element = createTestElement('div');
        html(element, '<span>Hello</span>');
        expect(element.innerHTML).toBe('<span>Hello</span>');
        expect(element.querySelector('span')?.textContent).toBe('Hello');
      });

      it('should get innerHTML when value not provided', () => {
        const element = createTestElement('div');
        element.innerHTML = '<p>Test</p>';
        expect(html(element)).toBe('<p>Test</p>');
      });
    });

    describe('html() - Generator API', () => {
      it('should set innerHTML via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield html('<strong>Bold text</strong>');
        });

        expect(element.innerHTML).toBe('<strong>Bold text</strong>');
        expect(element.querySelector('strong')?.textContent).toBe('Bold text');
      });

      it('should handle complex HTML structures', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield html(`
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          `);
        });

        const listItems = element.querySelectorAll('li');
        expect(listItems).toHaveLength(3);
        expect(listItems[0].textContent).toBe('Item 1');
        expect(listItems[2].textContent).toBe('Item 3');
      });
    });
  });

  describe('Class Manipulation', () => {
    describe('addClass() - Direct and Generator API', () => {
      it('should add single class directly', () => {
        const element = createTestElement('div');
        addClass(element, 'test-class');
        expect(element.classList.contains('test-class')).toBe(true);
      });

      it('should add multiple classes directly', () => {
        const element = createTestElement('div');
        addClass(element, 'class1 class2 class3');
        expect(element.classList.contains('class1')).toBe(true);
        expect(element.classList.contains('class2')).toBe(true);
        expect(element.classList.contains('class3')).toBe(true);
      });

      it('should add classes via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield addClass('generator-class');
          yield addClass('another-class');
        });

        expect(element.classList.contains('generator-class')).toBe(true);
        expect(element.classList.contains('another-class')).toBe(true);
      });
    });

    describe('removeClass() - Direct and Generator API', () => {
      it('should remove single class directly', () => {
        const element = createTestElement('div', { class: 'test-class other-class' });
        removeClass(element, 'test-class');
        expect(element.classList.contains('test-class')).toBe(false);
        expect(element.classList.contains('other-class')).toBe(true);
      });

      it('should remove multiple classes directly', () => {
        const element = createTestElement('div', { class: 'class1 class2 class3 keep' });
        removeClass(element, 'class1 class2');
        expect(element.classList.contains('class1')).toBe(false);
        expect(element.classList.contains('class2')).toBe(false);
        expect(element.classList.contains('class3')).toBe(true);
        expect(element.classList.contains('keep')).toBe(true);
      });

      it('should remove classes via generator', async () => {
        const element = createTestElement('div', { class: 'remove-me keep-me' });
        
        await runOn(element, function* () {
          yield removeClass('remove-me');
        });

        expect(element.classList.contains('remove-me')).toBe(false);
        expect(element.classList.contains('keep-me')).toBe(true);
      });
    });

    describe('toggleClass() - Direct and Generator API', () => {
      it('should toggle class directly', () => {
        const element = createTestElement('div');
        
        toggleClass(element, 'toggle-me');
        expect(element.classList.contains('toggle-me')).toBe(true);
        
        toggleClass(element, 'toggle-me');
        expect(element.classList.contains('toggle-me')).toBe(false);
      });

      it('should force toggle with boolean', () => {
        const element = createTestElement('div');
        
        toggleClass(element, 'force-on', true);
        expect(element.classList.contains('force-on')).toBe(true);
        
        toggleClass(element, 'force-on', true);
        expect(element.classList.contains('force-on')).toBe(true);
        
        toggleClass(element, 'force-on', false);
        expect(element.classList.contains('force-on')).toBe(false);
      });

      it('should toggle class via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield toggleClass('generator-toggle');
          yield toggleClass('generator-toggle');
          yield toggleClass('force-class', true);
        });

        expect(element.classList.contains('generator-toggle')).toBe(false);
        expect(element.classList.contains('force-class')).toBe(true);
      });
    });

    describe('hasClass() - Query function', () => {
      it('should check if class exists', () => {
        const element = createTestElement('div', { class: 'existing-class' });
        
        expect(hasClass(element, 'existing-class')).toBe(true);
        expect(hasClass(element, 'non-existing')).toBe(false);
      });
    });
  });

  describe('Style Manipulation', () => {
    describe('style() - Direct and Generator API', () => {
      it('should set single style property directly', () => {
        const element = createTestElement('div');
        style(element, 'color', 'red');
        expect(element.style.color).toBe('red');
      });

      it('should set multiple style properties with object', () => {
        const element = createTestElement('div');
        style(element, {
          color: 'blue',
          fontSize: '16px',
          backgroundColor: 'yellow'
        });
        
        expect(element.style.color).toBe('blue');
        expect(element.style.fontSize).toBe('16px');
        expect(element.style.backgroundColor).toBe('yellow');
      });

      it('should get style property when value not provided', () => {
        const element = createTestElement('div');
        element.style.width = '100px';
        expect(style(element, 'width')).toBe('100px');
      });

      it('should set styles via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield style('height', '200px');
          yield style({
            margin: '10px',
            padding: '5px'
          });
        });

        expect(element.style.height).toBe('200px');
        expect(element.style.margin).toBe('10px');
        expect(element.style.padding).toBe('5px');
      });

      it('should handle CSS custom properties', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield style('--custom-color', '#ff0000');
          yield style({
            '--custom-size': '20px',
            color: 'var(--custom-color)'
          });
        });

        expect(element.style.getPropertyValue('--custom-color')).toBe('#ff0000');
        expect(element.style.getPropertyValue('--custom-size')).toBe('20px');
      });
    });
  });

  describe('Attribute Manipulation', () => {
    describe('attr() - Direct and Generator API', () => {
      it('should set attribute directly', () => {
        const element = createTestElement('div');
        attr(element, 'data-test', 'value');
        expect(element.getAttribute('data-test')).toBe('value');
      });

      it('should set multiple attributes with object', () => {
        const element = createTestElement('div');
        attr(element, {
          'data-one': 'first',
          'data-two': 'second',
          id: 'test-id'
        });
        
        expect(element.getAttribute('data-one')).toBe('first');
        expect(element.getAttribute('data-two')).toBe('second');
        expect(element.id).toBe('test-id');
      });

      it('should get attribute when value not provided', () => {
        const element = createTestElement('div', { 'data-existing': 'value' });
        expect(attr(element, 'data-existing')).toBe('value');
      });

      it('should set attributes via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield attr('title', 'Tooltip text');
          yield attr({
            'aria-label': 'Button',
            role: 'button'
          });
        });

        expect(element.getAttribute('title')).toBe('Tooltip text');
        expect(element.getAttribute('aria-label')).toBe('Button');
        expect(element.getAttribute('role')).toBe('button');
      });
    });

    describe('removeAttr() - Direct and Generator API', () => {
      it('should remove attribute directly', () => {
        const element = createTestElement('div', { 'data-remove': 'value', 'data-keep': 'value' });
        removeAttr(element, 'data-remove');
        
        expect(element.hasAttribute('data-remove')).toBe(false);
        expect(element.hasAttribute('data-keep')).toBe(true);
      });

      it('should remove multiple attributes', () => {
        const element = createTestElement('div', { 
          'data-one': 'value',
          'data-two': 'value',
          'data-keep': 'value'
        });
        removeAttr(element, ['data-one', 'data-two']);
        
        expect(element.hasAttribute('data-one')).toBe(false);
        expect(element.hasAttribute('data-two')).toBe(false);
        expect(element.hasAttribute('data-keep')).toBe(true);
      });

      it('should remove attributes via generator', async () => {
        const element = createTestElement('div', { 'data-temp': 'value' });
        
        await runOn(element, function* () {
          yield removeAttr('data-temp');
        });

        expect(element.hasAttribute('data-temp')).toBe(false);
      });
    });

    describe('hasAttr() - Query function', () => {
      it('should check if attribute exists', () => {
        const element = createTestElement('div', { 'data-exists': 'value' });
        
        expect(hasAttr(element, 'data-exists')).toBe(true);
        expect(hasAttr(element, 'data-missing')).toBe(false);
      });
    });
  });

  describe('Property Manipulation', () => {
    describe('prop() - Direct and Generator API', () => {
      it('should set property directly', () => {
        const input = createTestElement('input') as HTMLInputElement;
        prop(input, 'disabled', true);
        expect(input.disabled).toBe(true);
      });

      it('should set multiple properties with object', () => {
        const input = createTestElement('input') as HTMLInputElement;
        prop(input, {
          disabled: true,
          readOnly: true,
          placeholder: 'Enter text'
        });
        
        expect(input.disabled).toBe(true);
        expect(input.readOnly).toBe(true);
        expect(input.placeholder).toBe('Enter text');
      });

      it('should get property when value not provided', () => {
        const input = createTestElement('input') as HTMLInputElement;
        input.type = 'email';
        expect(prop(input, 'type')).toBe('email');
      });

      it('should set properties via generator', async () => {
        const input = createTestElement('input') as HTMLInputElement;
        
        await runOn(input, function* () {
          yield prop('required', true);
          yield prop({
            type: 'password',
            maxLength: 20
          });
        });

        expect(input.required).toBe(true);
        expect(input.type).toBe('password');
        expect(input.maxLength).toBe(20);
      });
    });
  });

  describe('Data Attribute Helpers', () => {
    describe('data() - Direct and Generator API', () => {
      it('should set data attribute directly', () => {
        const element = createTestElement('div');
        data(element, 'test', 'value');
        expect(element.dataset.test).toBe('value');
        expect(element.getAttribute('data-test')).toBe('value');
      });

      it('should set multiple data attributes with object', () => {
        const element = createTestElement('div');
        data(element, {
          userId: '123',
          userName: 'john',
          active: 'true'
        });
        
        expect(element.dataset.userId).toBe('123');
        expect(element.dataset.userName).toBe('john');
        expect(element.dataset.active).toBe('true');
      });

      it('should get data attribute when value not provided', () => {
        const element = createTestElement('div', { 'data-existing': 'value' });
        expect(data(element, 'existing')).toBe('value');
      });

      it('should set data attributes via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield data('status', 'loading');
          yield data({
            progress: '50',
            total: '100'
          });
        });

        expect(element.dataset.status).toBe('loading');
        expect(element.dataset.progress).toBe('50');
        expect(element.dataset.total).toBe('100');
      });
    });
  });

  describe('Form Value Helpers', () => {
    describe('value() - Direct and Generator API', () => {
      it('should set input value directly', () => {
        const input = createTestElement('input') as HTMLInputElement;
        value(input, 'test value');
        expect(input.value).toBe('test value');
      });

      it('should get input value when value not provided', () => {
        const input = createTestElement('input') as HTMLInputElement;
        input.value = 'existing value';
        expect(value(input)).toBe('existing value');
      });

      it('should set input value via generator', async () => {
        const input = createTestElement('input') as HTMLInputElement;
        
        await runOn(input, function* () {
          yield value('generator value');
        });

        expect(input.value).toBe('generator value');
      });

      it('should work with textarea', async () => {
        const textarea = createTestElement('textarea') as HTMLTextAreaElement;
        
        await runOn(textarea, function* () {
          yield value('Multi-line\ntext\ncontent');
        });

        expect(textarea.value).toBe('Multi-line\ntext\ncontent');
      });

      it('should work with select', () => {
        const select = document.createElement('select') as HTMLSelectElement;
        select.innerHTML = `
          <option value="1">One</option>
          <option value="2">Two</option>
          <option value="3">Three</option>
        `;
        document.body.appendChild(select);
        
        value(select, '2');
        expect(select.value).toBe('2');
        expect(select.selectedIndex).toBe(1);
      });
    });

    describe('checked() - Direct and Generator API', () => {
      it('should set checkbox checked state directly', () => {
        const checkbox = createTestElement('input') as HTMLInputElement;
        checkbox.type = 'checkbox';
        
        checked(checkbox, true);
        expect(checkbox.checked).toBe(true);
        
        checked(checkbox, false);
        expect(checkbox.checked).toBe(false);
      });

      it('should get checkbox checked state when value not provided', () => {
        const checkbox = createTestElement('input') as HTMLInputElement;
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        
        expect(checked(checkbox)).toBe(true);
      });

      it('should set checkbox via generator', async () => {
        const checkbox = createTestElement('input') as HTMLInputElement;
        checkbox.type = 'checkbox';
        
        await runOn(checkbox, function* () {
          yield checked(true);
        });

        expect(checkbox.checked).toBe(true);
      });

      it('should work with radio buttons', () => {
        const radio1 = createTestElement('input') as HTMLInputElement;
        const radio2 = createTestElement('input') as HTMLInputElement;
        radio1.type = 'radio';
        radio1.name = 'test';
        radio2.type = 'radio';
        radio2.name = 'test';
        
        checked(radio1, true);
        expect(radio1.checked).toBe(true);
        
        checked(radio2, true);
        expect(radio1.checked).toBe(false);
        expect(radio2.checked).toBe(true);
      });
    });
  });

  describe('Focus Management', () => {
    describe('focus() and blur() - Direct and Generator API', () => {
      it('should focus element directly', () => {
        const input = createTestElement('input') as HTMLInputElement;
        const focusSpy = vi.spyOn(input, 'focus');
        
        focus(input);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('should blur element directly', () => {
        const input = createTestElement('input') as HTMLInputElement;
        const blurSpy = vi.spyOn(input, 'blur');
        
        blur(input);
        expect(blurSpy).toHaveBeenCalled();
      });

      it('should focus/blur via generator', async () => {
        const input = createTestElement('input') as HTMLInputElement;
        const focusSpy = vi.spyOn(input, 'focus');
        const blurSpy = vi.spyOn(input, 'blur');
        
        await runOn(input, function* () {
          yield focus();
          yield blur();
        });

        expect(focusSpy).toHaveBeenCalled();
        expect(blurSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Visibility Management', () => {
    describe('show() and hide() - Direct and Generator API', () => {
      it('should show hidden element directly', () => {
        const element = createTestElement('div');
        element.style.display = 'none';
        
        show(element);
        expect(element.style.display).toBe('');
      });

      it('should hide visible element directly', () => {
        const element = createTestElement('div');
        
        hide(element);
        expect(element.style.display).toBe('none');
      });

      it('should show/hide via generator', async () => {
        const element = createTestElement('div');
        
        await runOn(element, function* () {
          yield hide();
          yield show();
        });

        expect(element.style.display).toBe('');
      });

      it('should preserve original display value', () => {
        const element = createTestElement('div');
        element.style.display = 'flex';
        
        hide(element);
        expect(element.style.display).toBe('none');
        
        show(element);
        expect(element.style.display).toBe('flex');
      });
    });
  });

  describe('DOM Traversal', () => {
    describe('query() - Element querying', () => {
      it('should query child elements directly', () => {
        const parent = createTestElement('div');
        parent.innerHTML = '<span class="target">Found</span><div>Other</div>';
        
        const result = query(parent, '.target');
        expect(result?.textContent).toBe('Found');
        expect(result?.tagName).toBe('SPAN');
      });

      it('should return null for non-existent elements', () => {
        const parent = createTestElement('div');
        parent.innerHTML = '<span>Content</span>';
        
        const result = query(parent, '.missing');
        expect(result).toBe(null);
      });

      it('should query via generator context', async () => {
        const parent = createTestElement('div');
        parent.innerHTML = '<button class="action">Click me</button>';
        let foundElement: HTMLElement | null = null;
        
        await runOn(parent, function* () {
          foundElement = query('.action');
        });

        expect(foundElement?.textContent).toBe('Click me');
        expect(foundElement?.tagName).toBe('BUTTON');
      });
    });

    describe('queryAll() - Multiple element querying', () => {
      it('should query all matching elements directly', () => {
        const parent = createTestElement('div');
        parent.innerHTML = `
          <span class="item">Item 1</span>
          <span class="item">Item 2</span>
          <div class="item">Item 3</div>
        `;
        
        const results = queryAll(parent, '.item');
        expect(results).toHaveLength(3);
        expect(results[0].textContent).toBe('Item 1');
        expect(results[2].textContent).toBe('Item 3');
      });

      it('should return empty array for no matches', () => {
        const parent = createTestElement('div');
        parent.innerHTML = '<span>Content</span>';
        
        const results = queryAll(parent, '.missing');
        expect(results).toHaveLength(0);
        expect(Array.isArray(results)).toBe(true);
      });

      it('should query all via generator context', async () => {
        const parent = createTestElement('div');
        parent.innerHTML = '<li>A</li><li>B</li><li>C</li>';
        let foundElements: HTMLElement[] = [];
        
        await runOn(parent, function* () {
          foundElements = queryAll('li');
        });

        expect(foundElements).toHaveLength(3);
        expect(foundElements[1].textContent).toBe('B');
      });
    });

    describe('parent() - Parent element access', () => {
      it('should get parent element directly', () => {
        const grandparent = createTestElement('div', { class: 'grandparent' });
        const parent = createTestElement('div', { class: 'parent' });
        const child = createTestElement('span', { class: 'child' });
        
        grandparent.appendChild(parent);
        parent.appendChild(child);
        
        const result = parent(child);
        expect(result?.classList.contains('parent')).toBe(true);
      });

      it('should get parent via generator context', async () => {
        const parent = createTestElement('div', { class: 'parent' });
        const child = createTestElement('span', { class: 'child' });
        parent.appendChild(child);
        
        let parentElement: HTMLElement | null = null;
        
        await runOn(child, function* () {
          parentElement = parent();
        });

        expect(parentElement?.classList.contains('parent')).toBe(true);
      });
    });

    describe('children() - Child elements access', () => {
      it('should get child elements directly', () => {
        const parent = createTestElement('div');
        parent.innerHTML = `
          <span>Child 1</span>
          <div>Child 2</div>
          <p>Child 3</p>
        `;
        
        const results = children(parent);
        expect(results).toHaveLength(3);
        expect(results[0].tagName).toBe('SPAN');
        expect(results[1].tagName).toBe('DIV');
        expect(results[2].tagName).toBe('P');
      });

      it('should get children via generator context', async () => {
        const parent = createTestElement('div');
        parent.innerHTML = '<span>A</span><span>B</span>';
        
        let childElements: HTMLElement[] = [];
        
        await runOn(parent, function* () {
          childElements = children();
        });

        expect(childElements).toHaveLength(2);
        expect(childElements[0].textContent).toBe('A');
        expect(childElements[1].textContent).toBe('B');
      });
    });

    describe('siblings() - Sibling elements access', () => {
      it('should get sibling elements directly', () => {
        const parent = createTestElement('div');
        parent.innerHTML = `
          <span>Sibling 1</span>
          <div id="target">Target</div>
          <p>Sibling 2</p>
        `;
        
        const target = parent.querySelector('#target') as HTMLElement;
        const results = siblings(target);
        
        expect(results).toHaveLength(2);
        expect(results[0].textContent).toBe('Sibling 1');
        expect(results[1].textContent).toBe('Sibling 2');
      });

      it('should get siblings via generator context', async () => {
        const parent = createTestElement('div');
        parent.innerHTML = `
          <span>Before</span>
          <div class="target">Target</div>
          <span>After</span>
        `;
        
        const target = parent.querySelector('.target') as HTMLElement;
        let siblingElements: HTMLElement[] = [];
        
        await runOn(target, function* () {
          siblingElements = siblings();
        });

        expect(siblingElements).toHaveLength(2);
        expect(siblingElements[0].textContent).toBe('Before');
        expect(siblingElements[1].textContent).toBe('After');
      });
    });
  });

  describe('Batch Operations', () => {
    describe('batchAll() - Batch DOM operations', () => {
      it('should batch multiple operations efficiently', async () => {
        const elements = [
          createTestElement('div'),
          createTestElement('div'),
          createTestElement('div')
        ];
        
        const operations = [
          addClass('batched'),
          style({ color: 'red' }),
          attr('data-batch', 'true'),
          text('Batched element')
        ];
        
        batchAll(elements, operations);
        
        elements.forEach(element => {
          expect(element.classList.contains('batched')).toBe(true);
          expect(element.style.color).toBe('red');
          expect(element.getAttribute('data-batch')).toBe('true');
          expect(element.textContent).toBe('Batched element');
        });
      });

      it('should batch operations via generator', async () => {
        const container = createTestElement('div');
        container.innerHTML = '<div></div><div></div><div></div>';
        
        await runOn(container, function* () {
          const divs = queryAll('div');
          yield batchAll(divs, [
            addClass('batch-test'),
            data('processed', 'true')
          ]);
        });

        const divs = container.querySelectorAll('div');
        divs.forEach(div => {
          expect(div.classList.contains('batch-test')).toBe(true);
          expect(div.dataset.processed).toBe('true');
        });
      });
    });
  });

  describe('Child Component Management', () => {
    describe('createChildWatcher() and child()', () => {
      it('should create child watcher that tracks child elements', async () => {
        const container = createTestElement('div');
        
        function* childBehavior() {
          yield addClass('child-managed');
          return {
            getId: () => self().id,
            setText: (text: string) => text(text)
          };
        }
        
        let childApis: Map<HTMLElement, any>;
        
        await runOn(container, function* () {
          childApis = createChildWatcher('.child', childBehavior);
        });

        // Add child elements
        const child1 = createTestElement('div', { class: 'child', id: 'child1' });
        const child2 = createTestElement('div', { class: 'child', id: 'child2' });
        container.appendChild(child1);
        container.appendChild(child2);
        
        await waitForMutation();

        expect(childApis!.size).toBe(2);
        expect(child1.classList.contains('child-managed')).toBe(true);
        expect(child2.classList.contains('child-managed')).toBe(true);
        
        const child1Api = childApis!.get(child1);
        expect(child1Api?.getId()).toBe('child1');
      });

      it('should use child() helper for simpler syntax', async () => {
        const container = createTestElement('div');
        
        function* buttonBehavior() {
          yield addClass('button-enhanced');
          return {
            click: () => click(() => {})
          };
        }
        
        let buttonApis: Map<HTMLElement, any>;
        
        await runOn(container, function* () {
          buttonApis = child('button', buttonBehavior);
        });

        const button = createTestElement('button');
        container.appendChild(button);
        
        await waitForMutation();

        expect(buttonApis!.size).toBe(1);
        expect(button.classList.contains('button-enhanced')).toBe(true);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle operations on detached elements', () => {
      const element = document.createElement('div');
      
      // Should not throw errors
      expect(() => {
        text(element, 'test');
        addClass(element, 'test');
        style(element, 'color', 'red');
        attr(element, 'data-test', 'value');
      }).not.toThrow();
      
      expect(element.textContent).toBe('test');
      expect(element.classList.contains('test')).toBe(true);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        text(null as any, 'test');
        addClass(undefined as any, 'test');
        style(null as any, 'color', 'red');
      }).not.toThrow();
    });

    it('should handle large batch operations efficiently', () => {
      const elements = [];
      for (let i = 0; i < 1000; i++) {
        elements.push(createTestElement('div'));
      }
      
      const startTime = performance.now();
      
      batchAll(elements, [
        addClass('performance-test'),
        style({ width: '10px', height: '10px' }),
        attr('data-index', 'test')
      ]);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Verify all elements were processed
      elements.forEach(element => {
        expect(element.classList.contains('performance-test')).toBe(true);
      });
    });

    it('should handle rapid successive operations', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        for (let i = 0; i < 100; i++) {
          yield addClass(`class-${i}`);
          yield style(`--prop-${i}`, `${i}px`);
          yield attr(`data-${i}`, `value-${i}`);
        }
      });

      expect(element.classList.contains('class-99')).toBe(true);
      expect(element.style.getPropertyValue('--prop-99')).toBe('99px');
      expect(element.getAttribute('data-99')).toBe('value-99');
    });
  });

  describe('Type Safety and Element Resolution', () => {
    it('should work with different element types', async () => {
      const input = createTestElement('input') as HTMLInputElement;
      const button = createTestElement('button') as HTMLButtonElement;
      const select = createTestElement('select') as HTMLSelectElement;
      
      // Input-specific operations
      value(input, 'test');
      prop(input, 'disabled', true);
      
      // Button-specific operations
      text(button, 'Click me');
      prop(button, 'type', 'submit');
      
      // Select-specific operations
      select.innerHTML = '<option value="1">One</option>';
      value(select, '1');
      
      expect(input.value).toBe('test');
      expect(input.disabled).toBe(true);
      expect(button.textContent).toBe('Click me');
      expect(button.type).toBe('submit');
      expect(select.value).toBe('1');
    });

    it('should preserve element types in generator context', async () => {
      const input = createTestElement('input') as HTMLInputElement;
      input.type = 'email';
      
      await runOn(input, function* () {
        // Should have access to HTMLInputElement properties
        yield value('test@example.com');
        yield prop('required', true);
        yield attr('placeholder', 'Enter email');
      });

      expect(input.value).toBe('test@example.com');
      expect(input.required).toBe(true);
      expect(input.placeholder).toBe('Enter email');
    });
  });
});
