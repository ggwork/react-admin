import * as React from 'react';
import { ReactNode } from 'react';
import expect from 'expect';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';

import { useList, UseListOptions, UseListValue } from './useList';
import { ListContextProvider } from './ListContextProvider';
import { useListContext } from './useListContext';

const UseList = ({
    children,
    callback,
    ...props
}: UseListOptions & {
    children?: ReactNode;
    callback: (value: UseListValue) => void;
}) => {
    const value = useList(props);
    callback(value);
    return (
        <ListContextProvider value={value}>
            <button onClick={() => value.onSelectAll()} name="Select All">
                Select All
            </button>
            <button onClick={() => value.onSelect([1])} name="Select item 1">
                Select item 1
            </button>
            {children}
        </ListContextProvider>
    );
};

describe('<useList />', () => {
    it('should apply sorting correctly', async () => {
        const callback = jest.fn();
        const data = [
            { id: 1, title: 'hello' },
            { id: 2, title: 'world' },
        ];

        const SortButton = () => {
            const listContext = useListContext();

            return (
                <button
                    onClick={() =>
                        listContext.setSort({ field: 'title', order: 'ASC' })
                    }
                >
                    Sort by title ASC
                </button>
            );
        };

        const { getByText } = render(
            <UseList
                data={data}
                sort={{ field: 'title', order: 'DESC' }}
                callback={callback}
            >
                <SortButton />
            </UseList>
        );

        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    sort: { field: 'title', order: 'DESC' },
                    isFetching: false,
                    isLoading: false,
                    data: [
                        { id: 2, title: 'world' },
                        { id: 1, title: 'hello' },
                    ],
                    error: null,
                    total: 2,
                })
            );
        });

        fireEvent.click(getByText('Sort by title ASC'));
        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    sort: { field: 'title', order: 'ASC' },
                    isFetching: false,
                    isLoading: false,
                    data: [
                        { id: 1, title: 'hello' },
                        { id: 2, title: 'world' },
                    ],
                    error: null,
                    total: 2,
                })
            );
        });
    });

    it('should apply pagination correctly', async () => {
        const callback = jest.fn();
        const data = [
            { id: 1, title: 'hello' },
            { id: 2, title: 'world' },
            { id: 3, title: 'baz' },
            { id: 4, title: 'bar' },
            { id: 5, title: 'foo' },
            { id: 6, title: 'plop' },
            { id: 7, title: 'bazinga' },
        ];

        render(
            <UseList
                data={data}
                sort={{ field: 'id', order: 'ASC' }}
                page={2}
                perPage={5}
                callback={callback}
            />
        );

        await waitFor(() => {
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    sort: { field: 'id', order: 'ASC' },
                    isFetching: false,
                    isLoading: false,
                    data: [
                        { id: 6, title: 'plop' },
                        { id: 7, title: 'bazinga' },
                    ],
                    page: 2,
                    perPage: 5,
                    error: null,
                    total: 7,
                })
            );
        });
    });

    it('should be usable with asynchronously fetched data', () => {
        const callback = jest.fn();
        const data = [
            { id: 1, title: 'hello' },
            { id: 2, title: 'world' },
        ];

        const { rerender } = render(
            <UseList
                filter={{ title: 'world' }}
                sort={{ field: 'id', order: 'ASC' }}
                callback={callback}
            />
        );

        rerender(
            <UseList
                data={data}
                isFetching={true}
                isLoading={false}
                filter={{ title: 'world' }}
                sort={{ field: 'id', order: 'ASC' }}
                callback={callback}
            />
        );

        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
                sort: { field: 'id', order: 'ASC' },
                isFetching: true,
                isLoading: false,
                data: [{ id: 2, title: 'world' }],
                error: null,
                total: 1,
            })
        );
    });

    describe('filter', () => {
        it('should filter string data based on the filter props', () => {
            const callback = jest.fn();
            const data = [
                { id: 1, title: 'hello' },
                { id: 2, title: 'world' },
            ];

            render(
                <UseList
                    data={data}
                    filter={{ title: 'world' }}
                    sort={{ field: 'id', order: 'ASC' }}
                    callback={callback}
                />
            );

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    sort: { field: 'id', order: 'ASC' },
                    isFetching: false,
                    isLoading: false,
                    data: [{ id: 2, title: 'world' }],
                    error: null,
                    total: 1,
                })
            );
        });

        it('should filter array data based on the filter props', async () => {
            const callback = jest.fn();
            const data = [
                { id: 1, items: ['one', 'two'] },
                { id: 2, items: ['three'] },
                { id: 3, items: 'four' },
                { id: 4, items: ['five'] },
            ];

            render(
                <UseList
                    data={data}
                    filter={{ items: ['two', 'four', 'five'] }}
                    sort={{ field: 'id', order: 'ASC' }}
                    callback={callback}
                />
            );

            await waitFor(() => {
                expect(callback).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sort: { field: 'id', order: 'ASC' },
                        isFetching: false,
                        isLoading: false,
                        data: [
                            { id: 1, items: ['one', 'two'] },
                            { id: 3, items: 'four' },
                            { id: 4, items: ['five'] },
                        ],
                        error: null,
                        total: 3,
                    })
                );
            });
        });

        it('should filter array data based on the custom filter', async () => {
            const callback = jest.fn();
            const data = [
                { id: 1, items: ['one', 'two'] },
                { id: 2, items: ['three'] },
                { id: 3, items: 'four' },
                { id: 4, items: ['five'] },
            ];

            render(
                <UseList
                    data={data}
                    sort={{ field: 'id', order: 'ASC' }}
                    filterCallback={record => record.id > 2}
                    callback={callback}
                />
            );

            await waitFor(() => {
                expect(callback).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sort: { field: 'id', order: 'ASC' },
                        isFetching: false,
                        isLoading: false,
                        data: [
                            { id: 3, items: 'four' },
                            { id: 4, items: ['five'] },
                        ],
                        error: null,
                        total: 2,
                    })
                );
            });
        });

        it('should filter data based on a custom filter with nested objects', () => {
            const callback = jest.fn();
            const data = [
                { id: 1, title: { name: 'hello' } },
                { id: 2, title: { name: 'world' } },
            ];

            render(
                <UseList
                    data={data}
                    filter={{ title: { name: 'world' } }}
                    sort={{ field: 'id', order: 'ASC' }}
                    callback={callback}
                />
            );

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    sort: { field: 'id', order: 'ASC' },
                    isFetching: false,
                    isLoading: false,
                    data: [{ id: 2, title: { name: 'world' } }],
                    error: null,
                    total: 1,
                })
            );
        });

        it('should apply the q filter as a full-text filter', () => {
            const callback = jest.fn();
            const data = [
                { id: 1, title: 'Abc', author: 'Def' }, // matches 'ab'
                { id: 2, title: 'Ghi', author: 'Jkl' }, // does not match 'ab'
                { id: 3, title: 'Mno', author: 'Abc' }, // matches 'ab'
            ];

            render(
                <UseList data={data} filter={{ q: 'ab' }} callback={callback} />
            );

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: [
                        { id: 1, title: 'Abc', author: 'Def' },
                        { id: 3, title: 'Mno', author: 'Abc' },
                    ],
                })
            );
        });
    });

    describe('onSelectAll', () => {
        it('should select all records', async () => {
            const callback = jest.fn();
            const data = [{ id: 0 }, { id: 1 }];
            render(<UseList data={data} callback={callback} />);
            fireEvent.click(
                await screen.findByRole('button', { name: 'Select All' })
            );
            await waitFor(() => {
                expect(callback).toHaveBeenCalledWith(
                    expect.objectContaining({
                        selectedIds: [0, 1],
                    })
                );
            });
        });
        it('should select all records even though some records are already selected', async () => {
            const callback = jest.fn();
            const data = [{ id: 0 }, { id: 1 }];
            render(<UseList data={data} callback={callback} />);
            fireEvent.click(
                await screen.findByRole('button', { name: 'Select item 1' })
            );
            await waitFor(() => {
                expect(callback).toHaveBeenCalledWith(
                    expect.objectContaining({
                        selectedIds: [1],
                    })
                );
            });
            fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
            await waitFor(() => {
                expect(callback).toHaveBeenCalledWith(
                    expect.objectContaining({
                        selectedIds: [0, 1],
                    })
                );
            });
        });
    });
});
