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
    it('maps header to box', () => {
      const placement = createPlacement('header', 0, 0, 4, 1);
      const component = mapToComponent(placement);

      expect(component.type).toBe('box');
    });

    it('maps nav to box', () => {
      const placement = createPlacement('nav', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('box');
    });

    it('maps main to box', () => {
      const placement = createPlacement('main', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('box');
    });

    it('maps footer to box', () => {
      const placement = createPlacement('footer', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('box');
    });

    it('maps section to box', () => {
      const placement = createPlacement('section', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('box');
    });

    it('maps form to box', () => {
      const placement = createPlacement('form', 0, 0, 4, 1);
      expect(mapToComponent(placement).type).toBe('box');
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
    it('adds dummy label for input', () => {
      const placement = createPlacement('input', 0, 0, 2, 1, {
        placeholder: 'Enter email',
      });
      const component = mapToComponent(placement);

      expect(component.props.label).toBe('[input]');
    });

    it('adds dummy alt for img', () => {
      const placement = createPlacement('img', 0, 0, 2, 2, {
        src: 'logo.png',
        alt: 'Company Logo',
      });
      const component = mapToComponent(placement);

      expect(component.props.src).toBeUndefined();
      expect(component.props.alt).toBe('[image]');
    });

    it('adds dummy value for txt', () => {
      const placement = createPlacement('h1', 0, 0, 4, 1);
      placement.element.textContent = 'Title';
      const component = mapToComponent(placement);

      expect(component.props.value).toBe('[text]');
    });

    it('adds dummy value for btn', () => {
      const placement = createPlacement('button', 0, 0, 1, 1);
      placement.element.textContent = 'Submit';
      const component = mapToComponent(placement);

      expect(component.props.value).toBe('[button]');
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
    expect(components[0].type).toBe('box');
    expect(components[1].type).toBe('input');
    expect(components[1].props.label).toBe('[input]');
    expect(components[2].type).toBe('btn');
    expect(components[2].props.value).toBe('[button]');
  });

  it('returns empty array for empty input', () => {
    expect(mapAllToComponents([])).toEqual([]);
  });
});
