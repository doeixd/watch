/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as explicit from '../src/explicit';
import * as fluent from '../src/fluent';

describe('Explicit API', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Text Manipulation', () => {
    it('should set text on element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      explicit.setTextElement(div, 'Hello World');
      expect(div.textContent).toBe('Hello World');
    });

    it('should set text on elements by selector', () => {
      document.body.innerHTML = '<div class="test">Old</div><div class="test">Old</div>';

      explicit.setTextSelector('.test', 'New');
      const elements = document.querySelectorAll('.test');
      expect(elements[0].textContent).toBe('New');
      expect(elements[1].textContent).toBe('New');
    });

    it('should get text from element', () => {
      const div = document.createElement('div');
      div.textContent = 'Test Content';

      const text = explicit.getTextElement(div);
      expect(text).toBe('Test Content');
    });

    it('should append and prepend text', () => {
      const div = document.createElement('div');
      div.textContent = 'Middle';
      document.body.appendChild(div);

      explicit.appendTextElement(div, ' End');
      expect(div.textContent).toBe('Middle End');

      explicit.prependTextElement(div, 'Start ');
      expect(div.textContent).toBe('Start Middle End');
    });
  });

  describe('Class Manipulation', () => {
    it('should add classes to element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      explicit.addClassElement(div, 'foo', 'bar');
      expect(div.classList.contains('foo')).toBe(true);
      expect(div.classList.contains('bar')).toBe(true);
    });

    it('should remove classes from element', () => {
      const div = document.createElement('div');
      div.className = 'foo bar baz';

      explicit.removeClassElement(div, 'bar');
      expect(div.classList.contains('foo')).toBe(true);
      expect(div.classList.contains('bar')).toBe(false);
      expect(div.classList.contains('baz')).toBe(true);
    });

    it('should toggle classes', () => {
      const div = document.createElement('div');

      explicit.toggleClassElement(div, 'active');
      expect(div.classList.contains('active')).toBe(true);

      explicit.toggleClassElement(div, 'active');
      expect(div.classList.contains('active')).toBe(false);

      explicit.toggleClassElement(div, 'active', true);
      expect(div.classList.contains('active')).toBe(true);
    });

    it('should check if element has class', () => {
      const div = document.createElement('div');
      div.className = 'foo bar';

      expect(explicit.hasClassElement(div, 'foo')).toBe(true);
      expect(explicit.hasClassElement(div, 'baz')).toBe(false);
    });
  });

  describe('Attribute Manipulation', () => {
    it('should set attributes', () => {
      const div = document.createElement('div');

      explicit.setAttrElement(div, 'data-id', '123');
      expect(div.getAttribute('data-id')).toBe('123');
    });

    it('should get attributes', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');

      expect(explicit.getAttrElement(div, 'role')).toBe('button');
    });

    it('should remove attributes', () => {
      const div = document.createElement('div');
      div.setAttribute('disabled', '');

      explicit.removeAttrElement(div, 'disabled');
      expect(div.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Style Manipulation', () => {
    it('should set styles on element', () => {
      const div = document.createElement('div');

      explicit.setStyleElement(div, 'color', 'red');
      expect(div.style.color).toBe('red');

      explicit.setStylesElement(div, { backgroundColor: 'blue', fontSize: '16px' });
      expect(div.style.backgroundColor).toBe('blue');
      expect(div.style.fontSize).toBe('16px');
    });

    it('should get styles from element', () => {
      const div = document.createElement('div');
      div.style.color = 'green';

      expect(explicit.getStyleElement(div, 'color')).toBe('green');
    });
  });

  describe('DOM Traversal', () => {
    it('should query elements', () => {
      document.body.innerHTML = `
        <div id="parent">
          <span class="child">Child 1</span>
          <span class="child">Child 2</span>
        </div>
      `;

      const parent = document.getElementById('parent')!;
      const child = explicit.queryElement(parent, '.child');
      expect(child?.textContent).toBe('Child 1');

      const allChildren = explicit.queryAllElement(parent, '.child');
      expect(allChildren.length).toBe(2);
    });

    it('should get parent, children, and siblings', () => {
      document.body.innerHTML = `
        <div id="parent">
          <span id="child1">1</span>
          <span id="child2">2</span>
          <span id="child3">3</span>
        </div>
      `;

      const child2 = document.getElementById('child2')!;
      const parent = explicit.getParentElement(child2);
      expect(parent?.id).toBe('parent');

      const siblings = explicit.getSiblingsElement(child2);
      expect(siblings.length).toBe(2);
      expect(siblings[0].id).toBe('child1');
      expect(siblings[1].id).toBe('child3');
    });
  });

  describe('Form Manipulation', () => {
    it('should set and get form values', () => {
      const input = document.createElement('input');
      input.type = 'text';

      explicit.setValueElement(input, 'test value');
      expect(input.value).toBe('test value');

      const value = explicit.getValueElement(input);
      expect(value).toBe('test value');
    });

    it('should handle checkboxes', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      explicit.setCheckedElement(checkbox, true);
      expect(checkbox.checked).toBe(true);
      expect(explicit.isCheckedElement(checkbox)).toBe(true);

      explicit.setCheckedElement(checkbox, false);
      expect(checkbox.checked).toBe(false);
      expect(explicit.isCheckedElement(checkbox)).toBe(false);
    });
  });

  describe('Visibility', () => {
    it('should show and hide elements', () => {
      const div = document.createElement('div');
      div.style.display = 'none';

      explicit.showElement(div);
      expect(div.style.display).not.toBe('none');

      explicit.hideElement(div);
      expect(div.style.display).toBe('none');

      explicit.toggleElement(div);
      expect(div.style.display).not.toBe('none');

      explicit.toggleElement(div);
      expect(div.style.display).toBe('none');
    });

    it('should check visibility', () => {
      const div = document.createElement('div');
      expect(explicit.isVisibleElement(div)).toBe(true);
      expect(explicit.isHiddenElement(div)).toBe(false);

      div.style.display = 'none';
      expect(explicit.isVisibleElement(div)).toBe(false);
      expect(explicit.isHiddenElement(div)).toBe(true);
    });
  });

  describe('Focus', () => {
    it('should focus and blur elements', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      explicit.focusElement(input);
      expect(document.activeElement).toBe(input);
      expect(explicit.hasFocusElement(input)).toBe(true);

      explicit.blurElement(input);
      expect(document.activeElement).not.toBe(input);
      expect(explicit.hasFocusElement(input)).toBe(false);
    });
  });

  describe('Events', () => {
    it('should attach click handlers', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const handler = vi.fn();
      explicit.clickElement(button, handler);

      button.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should emit custom events', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const handler = vi.fn();
      div.addEventListener('custom-event', handler);

      explicit.emitElement(div, 'custom-event', { value: 42 });
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail).toEqual({ value: 42 });
    });
  });

  describe('Utils', () => {
    it('should check if value is element', () => {
      const div = document.createElement('div');
      expect(explicit.isElement(div)).toBe(true);
      expect(explicit.isElement('not an element')).toBe(false);
      expect(explicit.isElement(null)).toBe(false);
    });

    it('should check if string is selector', () => {
      expect(explicit.isSelector('#id')).toBe(true);
      expect(explicit.isSelector('.class')).toBe(true);
      expect(explicit.isSelector('div')).toBe(true);
      expect(explicit.isSelector('[attr]')).toBe(true);
      expect(explicit.isSelector(':hover')).toBe(true);
      expect(explicit.isSelector('Hello World')).toBe(false);
    });

    it('should convert NodeList to array', () => {
      document.body.innerHTML = '<div></div><div></div><div></div>';
      const nodeList = document.querySelectorAll('div');
      const array = explicit.toArray(nodeList);

      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(3);
    });
  });
});

describe('Fluent API', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Basic Chaining', () => {
    it('should chain text and class operations', () => {
      document.body.innerHTML = '<div class="test"></div>';

      const result = fluent.selector('.test')
        .text('Hello')
        .addClass('active', 'primary')
        .removeClass('test');

      const element = document.querySelector('.active');
      expect(element?.textContent).toBe('Hello');
      expect(element?.classList.contains('active')).toBe(true);
      expect(element?.classList.contains('primary')).toBe(true);
      expect(element?.classList.contains('test')).toBe(false);
    });

    it('should work with single element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      fluent.element(div)
        .text('Fluent')
        .addClass('styled')
        .attr('data-id', '123');

      expect(div.textContent).toBe('Fluent');
      expect(div.classList.contains('styled')).toBe(true);
      expect(div.getAttribute('data-id')).toBe('123');
    });

    it('should work with multiple elements', () => {
      const divs = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
      ];
      divs.forEach(d => document.body.appendChild(d));

      fluent.elements(divs)
        .addClass('item')
        .text('Same Text');

      divs.forEach(div => {
        expect(div.classList.contains('item')).toBe(true);
        expect(div.textContent).toBe('Same Text');
      });
    });
  });

  describe('DOM Traversal', () => {
    it('should find child elements', () => {
      document.body.innerHTML = `
        <div class="parent">
          <span class="child">Child 1</span>
          <span class="child">Child 2</span>
        </div>
      `;

      const children = fluent.selector('.parent')
        .find('.child')
        .addClass('found');

      const found = document.querySelectorAll('.found');
      expect(found.length).toBe(2);
    });

    it('should navigate to parent', () => {
      document.body.innerHTML = `
        <div class="parent">
          <span class="child">Text</span>
        </div>
      `;

      fluent.selector('.child')
        .parent()
        .addClass('parent-found');

      const parent = document.querySelector('.parent');
      expect(parent?.classList.contains('parent-found')).toBe(true);
    });

    it('should get siblings', () => {
      document.body.innerHTML = `
        <div>
          <span>1</span>
          <span class="target">2</span>
          <span>3</span>
        </div>
      `;

      fluent.selector('.target')
        .siblings()
        .addClass('sibling');

      const siblings = document.querySelectorAll('.sibling');
      expect(siblings.length).toBe(2);
      expect(siblings[0].textContent).toBe('1');
      expect(siblings[1].textContent).toBe('3');
    });
  });

  describe('Filtering and Selection', () => {
    it('should filter elements', () => {
      document.body.innerHTML = `
        <div class="item active">1</div>
        <div class="item">2</div>
        <div class="item active">3</div>
      `;

      fluent.selector('.item')
        .filter('.active')
        .text('Active!');

      const items = document.querySelectorAll('.item');
      expect(items[0].textContent).toBe('Active!');
      expect(items[1].textContent).toBe('2');
      expect(items[2].textContent).toBe('Active!');
    });

    it('should select first and last', () => {
      document.body.innerHTML = `
        <div class="item">1</div>
        <div class="item">2</div>
        <div class="item">3</div>
      `;

      fluent.selector('.item')
        .first()
        .addClass('first-item');

      fluent.selector('.item')
        .last()
        .addClass('last-item');

      const items = document.querySelectorAll('.item');
      expect(items[0].classList.contains('first-item')).toBe(true);
      expect(items[2].classList.contains('last-item')).toBe(true);
    });

    it('should select by index', () => {
      document.body.innerHTML = `
        <div class="item">1</div>
        <div class="item">2</div>
        <div class="item">3</div>
      `;

      fluent.selector('.item')
        .eq(1)
        .addClass('middle');

      const items = document.querySelectorAll('.item');
      expect(items[1].classList.contains('middle')).toBe(true);
    });
  });

  describe('Forms', () => {
    it('should set and get values', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      fluent.element(input).val('test value');
      expect(input.value).toBe('test value');

      const value = fluent.element(input).getVal();
      expect(value).toBe('test value');
    });

    it('should handle checkboxes', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);

      fluent.element(checkbox).checked(true);
      expect(checkbox.checked).toBe(true);

      const isChecked = fluent.element(checkbox).isChecked();
      expect(isChecked).toBe(true);
    });
  });

  describe('Events', () => {
    it('should attach event handlers', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const handler = vi.fn();
      fluent.element(button).click(handler);

      button.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should emit events', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const handler = vi.fn();
      div.addEventListener('test-event', handler);

      fluent.element(div).emit('test-event', { data: 'test' });
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should iterate with each', () => {
      document.body.innerHTML = `
        <div class="item">1</div>
        <div class="item">2</div>
        <div class="item">3</div>
      `;

      const values: string[] = [];
      fluent.selector('.item').each((el, index) => {
        values.push(`${index}:${el.textContent}`);
      });

      expect(values).toEqual(['0:1', '1:2', '2:3']);
    });

    it('should map elements', () => {
      document.body.innerHTML = `
        <div class="item">1</div>
        <div class="item">2</div>
        <div class="item">3</div>
      `;

      const texts = fluent.selector('.item').map(el => el.textContent);
      expect(texts).toEqual(['1', '2', '3']);
    });

    it('should check existence', () => {
      document.body.innerHTML = '<div class="exists"></div>';

      expect(fluent.selector('.exists').exists()).toBe(true);
      expect(fluent.selector('.not-exists').exists()).toBe(false);

      expect(fluent.selector('.exists').length()).toBe(1);
      expect(fluent.selector('.not-exists').length()).toBe(0);
    });

    it('should check selector match', () => {
      document.body.innerHTML = '<div class="foo bar"></div>';

      expect(fluent.selector('.foo').is('.bar')).toBe(true);
      expect(fluent.selector('.foo').is('.baz')).toBe(false);
    });

    it('should add more elements', () => {
      document.body.innerHTML = `
        <div class="first">1</div>
        <div class="second">2</div>
      `;

      fluent.selector('.first')
        .add('.second')
        .addClass('selected');

      expect(document.querySelectorAll('.selected').length).toBe(2);
    });
  });

  describe('jQuery-like $ alias', () => {
    it('should work with $fluent alias', () => {
      document.body.innerHTML = '<div id="test"></div>';

      fluent.$fluent('#test')
        .text('jQuery-like!')
        .addClass('styled');

      const element = document.getElementById('test');
      expect(element?.textContent).toBe('jQuery-like!');
      expect(element?.classList.contains('styled')).toBe(true);
    });
  });
});
