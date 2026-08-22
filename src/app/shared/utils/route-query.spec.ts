import { parsePositivePage } from './route-query';

describe('parsePositivePage', () => {
  it('accepts positive safe integers', () => {
    expect(parsePositivePage('3')).toBe(3);
  });

  it.each([null, '', '0', '-2', '1.5', 'Infinity', 'not-a-page'])(
    'normalizes %s to the first page',
    (value) => {
      expect(parsePositivePage(value)).toBe(1);
    },
  );
});
