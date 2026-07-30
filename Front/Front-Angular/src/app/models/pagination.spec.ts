import { describe, expect, it } from 'vitest';
import { pageResultFromHeader, PAGINATION_HEADER } from './pagination';

const header = JSON.stringify({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 2,
  totalPages: 1,
});

describe('pagination model', () => {
  it('builds PageResult from header', () => {
    expect(pageResultFromHeader([{ id: 1 }], header)).toEqual({
      items: [{ id: 1 }],
      page: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
    });
  });

  it('throws when header missing', () => {
    expect(() => pageResultFromHeader([], null)).toThrow(
      'Cabeçalho Pagination ausente',
    );
  });

  it('defaults items to empty array when null', () => {
    expect(pageResultFromHeader(null, header).items).toEqual([]);
  });

  it('exports pagination header constant', () => {
    expect(PAGINATION_HEADER).toBe('Pagination');
  });
});
