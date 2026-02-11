import { describe, expect, it } from 'vitest';
import {
  mapAllToComponents,
  mapToComponent,
} from '../../src/fetcher/mapper.js';
import type { DomElement, GridPlacement } from '../../src/fetcher/types.js';

function createPlacement(
  tagName: string,
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  attributes: DomElement['attributes'] = {},
): GridPlacement {
  return {
    element: {
      tagName,
      bounds: { x: 0, y: 0, width: 100, height: 100 },
      hasText: false,
      attributes,
    },
    col,
    row,
    colSpan,
    rowSpan,
  };
}

describe('mapToComponent', () => {
  describe('type mapping', () => {
    it('maps header to txt with semantic label', () => {
      const placement = createPlacement('header', 0, 0, 4, 1);
      const component = mapToComponent(placement);

      expect(component.type).toBe('txt');
      expect(component.props.value).toBe('Header');
      expect(component.props.align).toBe('center');
    });

    it('maps nav to txt with semantic label', () => {
      const placement = createPlacement('nav', 0, 0, 4, 1);
      const component = mapToComponent(placement);
      expect(component.type).toBe('txt');
      expect(component.props.value).toBe('Navigation');
    });

    it('maps main to txt with semantic label', () => {
      const placement = createPlacement('main', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps footer to txt with semantic label', () => {
      const placement = createPlacement('footer', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps section to txt with semantic label', () => {
      const placement = createPlacement('section', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps form to txt with semantic label', () => {
      const placement = createPlacement('form', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps button to btn', () => {
      const placement = createPlacement('button', 0, 0, 1, 1);
      expect(mapToComponent(placement).type).toBe('btn');
    });

    it('maps input to input', () => {
      const placement = createPlacement('input', 0, 0, 2, 1);
      expect(mapToComponent(placement).type).toBe('input');
    });

    it('maps textarea to input', () => {
      const placement = createPlacement('textarea', 0, 0, 2, 2);
      expect(mapToComponent(placement).type).toBe('input');
    });

    it('maps select to input', () => {
      const placement = createPlacement('select', 0, 0, 2, 1);
      expect(mapToComponent(placement).type).toBe('input');
    });

    it('maps img to img', () => {
      const placement = createPlacement('img', 0, 0, 2, 2);
      expect(mapToComponent(placement).type).toBe('img');
    });

    it('maps h1-h6 to txt', () => {
      for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
        const placement = createPlacement(tag, 0, 0, 4, 1);
        expect(mapToComponent(placement).type).toBe('txt');
      }
    });

    it('maps p to txt', () => {
      const placement = createPlacement('p', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps span to txt', () => {
      const placement = createPlacement('span', 0, 0, 1, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps label to txt', () => {
      const placement = createPlacement('label', 0, 0, 1, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps a to txt', () => {
      const placement = createPlacement('a', 0, 0, 1, 1);
      expect(mapToComponent(placement).type).toBe('txt');
    });

    it('maps unknown tags to box', () => {
      const placement = createPlacement('custom-element', 0, 0, 2, 2);
      expect(mapToComponent(placement).type).toBe('box');
    });
  });

  describe('cell range', () => {
    it('sets correct range for single cell', () => {
      const placement = createPlacement('button', 2, 1, 1, 1);
      const component = mapToComponent(placement);

      expect(component.range.start).toEqual({ col: 2, row: 1 });
      expect(component.range.end).toEqual({ col: 2, row: 1 });
    });

    it('sets correct range for multi-cell span', () => {
      const placement = createPlacement('header', 0, 0, 4, 2);
      const component = mapToComponent(placement);

      expect(component.range.start).toEqual({ col: 0, row: 0 });
      expect(component.range.end).toEqual({ col: 3, row: 1 });
    });
  });

  describe('properties', () => {
    it('uses placeholder for input label', () => {
      const placement = createPlacement('input', 0, 0, 2, 1, {
        placeholder: 'Enter email',
      });
      const component = mapToComponent(placement);

      expect(component.props.label).toBe('Enter email');
    });

    it('uses type for input label when no placeholder', () => {
      const placement = createPlacement('input', 0, 0, 2, 1, {
        type: 'email',
      });
      const component = mapToComponent(placement);

      expect(component.props.label).toBe('Email');
    });

    it('falls back to Input for input without attributes', () => {
      const placement = createPlacement('input', 0, 0, 2, 1);
      const component = mapToComponent(placement);

      expect(component.props.label).toBe('Input');
    });

    it('uses alt attribute for img', () => {
      const placement = createPlacement('img', 0, 0, 2, 2, {
        src: 'logo.png',
        alt: 'Company Logo',
      });
      const component = mapToComponent(placement);

      expect(component.props.alt).toBe('Company Logo');
    });

    it('falls back to Image for img without alt', () => {
      const placement = createPlacement('img', 0, 0, 2, 2);
      const component = mapToComponent(placement);

      expect(component.props.alt).toBe('Image');
    });

    it('uses textContent for txt', () => {
      const placement = createPlacement('h1', 0, 0, 4, 1);
      placement.element.textContent = 'Title';
      const component = mapToComponent(placement);

      expect(component.props.value).toBe('Title');
    });

    it('falls back to tag name for txt without text', () => {
      const placement = createPlacement('h1', 0, 0, 4, 1);
      const component = mapToComponent(placement);

      expect(component.props.value).toBe('H1');
    });

    it('uses textContent for btn', () => {
      const placement = createPlacement('button', 0, 0, 1, 1);
      placement.element.textContent = 'Submit';
      const component = mapToComponent(placement);

      expect(component.props.value).toBe('Submit');
    });

    it('falls back to Button for btn without text', () => {
      const placement = createPlacement('button', 0, 0, 1, 1);
      const component = mapToComponent(placement);

      expect(component.props.value).toBe('Button');
    });

    it('applies inline style colors', () => {
      const placement = createPlacement('button', 0, 0, 1, 1);
      placement.element.colors = { bg: '#3B82F6', border: '#1E40AF' };
      const component = mapToComponent(placement);

      expect(component.props.bg).toBe('#3B82F6');
      expect(component.props.border).toBe('#1E40AF');
    });
  });
});

describe('mapAllToComponents', () => {
  it('maps multiple placements', () => {
    const placements = [
      createPlacement('header', 0, 0, 4, 1),
      createPlacement('input', 0, 1, 2, 1, { placeholder: 'Email' }),
      createPlacement('button', 2, 1, 2, 1),
    ];

    const components = mapAllToComponents(placements);

    expect(components).toHaveLength(3);
    expect(components[0].type).toBe('txt'); // header promoted to txt
    expect(components[1].type).toBe('input');
    expect(components[1].props.label).toBe('Email'); // placeholder used
    expect(components[2].type).toBe('btn');
    expect(components[2].props.value).toBe('Button'); // fallback
  });

  it('returns empty array for empty input', () => {
    expect(mapAllToComponents([])).toEqual([]);
  });
});
