# Client search behavior (debounce + global `q`)

Shared expectations for Eventos and Palestrantes list screens on Vue, React, and Angular.

## C-01 Global term param

**Given** a list screen with a non-empty search string after trim, **when** the client requests the list, **then** it sends `q=<term>` (not theme/name-only params as the primary filter).

## C-02 Debounce interval

**Given** the search input, **when** the user types without submitting, **then** the list HTTP call runs only after **350 ms** without further input changes (`distinct` term preferred).

## C-03 Immediate submit

**Given** pending debounced input, **when** the user submits the search form (Enter or search button), **then** the client cancels the pending debounce and requests immediately with the current term.

## C-04 Immediate clear

**Given** a non-empty search, **when** the user clears search, **then** the client requests the unfiltered paged list immediately (no full 350 ms wait for empty).

## C-05 Stale response guard

**Given** two overlapping list requests for different terms, **when** the older response arrives after the newer one was started, **then** the UI keeps the newer term’s results.

## C-06 Pagination composition

**Given** an active `q`, **when** the user changes page or page size, **then** requests include the same `q` and pagination metadata reflects the filtered total.

## C-07 Parity

**Given** the same seeded API data, **when** the same term is searched on Vue, React, and Angular, **then** visible result sets match (same API contract).

## C-08 Labels

**Given** the search UI, **when** rendered, **then** copy does not claim “theme only” / “name only” if the backend is global (e.g. generic “Buscar” / “Pesquisar”).
