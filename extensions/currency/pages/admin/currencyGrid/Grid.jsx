/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import axios from 'axios';
import Area from '@components/common/Area';
import Pagination from '@components/common/grid/Pagination';
import { useAlertContext } from '@components/common/modal/Alert';
import { Checkbox } from '@components/common/form/fields/Checkbox';
import { Card } from '@components/admin/cms/Card';
import CurrencyNameRow from '@components/admin/catalog/currencyGrid/rows/CurrencyName';
import GroupRow from '@components/admin/catalog/currencyGrid/rows/GroupRow';
import BasicRow from '@components/common/grid/rows/BasicRow';
import YesNoRow from '@components/common/grid/rows/YesNoRow';
import SortableHeader from '@components/common/grid/headers/Sortable';
import TextRow from '@components/common/grid/rows/TextRow';
import { Form } from '@components/common/form/Form';
import { Field } from '@components/common/form/Field';
import { toast } from 'react-toastify';

function Actions({ currencies = [], selectedIds = [] }) {
  const { openAlert, closeAlert } = useAlertContext();
  const [isLoading, setIsLoading] = useState(false);

  const deleteCurrencies = async () => {
    setIsLoading(true);
    try {
      const promises = currencies.filter((currency) =>
        selectedIds.includes(currency.id)
      );
      // .map((currency) =>
      //   axios.delete(currency.deleteApi, {
      //     validateStatus: () => true
      //   })
      // );
      const responses = await Promise.allSettled(promises);
      setIsLoading(false);
      responses.forEach((response) => {
        // Get the axios response status code
        const { status } = response.value;
        if (status !== 200) {
          throw new Error(response.value.data.error.message);
        }
      });
      // Refresh the page
      window.location.reload();
    } catch (e) {
      setIsLoading(false);
      toast.error(e.message);
    }
  };

  const actions = [
    {
      name: 'Delete',
      onAction: () => {
        openAlert({
          heading: `Delete ${selectedIds.length} currencies`,
          content: <div>Can&apos;t be undone</div>,
          primaryAction: {
            title: 'Cancel',
            onAction: closeAlert,
            variant: 'primary'
          },
          secondaryAction: {
            title: 'Delete',
            onAction: async () => {
              await deleteCurrencies();
            },
            variant: 'critical',
            isLoading
          }
        });
      }
    }
  ];

  return (
    <tr>
      {selectedIds.length === 0 && null}
      {selectedIds.length > 0 && (
        <td style={{ borderTop: 0 }} colSpan="100">
          <div className="inline-flex border border-divider rounded justify-items-start">
            <a href="#" className="font-semibold pt-075 pb-075 pl-15 pr-15">
              {selectedIds.length} selected
            </a>
            {actions.map((action) => (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  action.onAction();
                }}
                className="font-semibold pt-075 pb-075 pl-15 pr-15 block border-l border-divider self-center"
              >
                <span>{action.name}</span>
              </a>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}

Actions.propTypes = {
  selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  currencies: PropTypes.arrayOf(
    PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      deleteApi: PropTypes.string.isRequired
    })
  ).isRequired
};

export default function CurrencyGrid(props) {
  const { getCurrencies } = props;
  const { items: currencies, total, currentFilters = [] } = getCurrencies;

  const page = currentFilters.find((filter) => filter.key === 'page')
    ? currentFilters.find((filter) => filter.key === 'page').value
    : 1;
  const limit = currentFilters.find((filter) => filter.key === 'limit')
    ? currentFilters.find((filter) => filter.key === 'limit').value
    : 20;
  const [selectedRows, setSelectedRows] = useState([]);

  return (
    <Card>
      <Card.Session
        title={
          <Form submitBtn={false}>
            <Field
              type="text"
              id="name"
              placeholder="Search"
              value={currentFilters.find((f) => f.key === 'name')?.value}
              onKeyPress={(e) => {
                // If the user press enter, we should submit the form
                if (e.key === 'Enter') {
                  const url = new URL(document.location);
                  const name = document.getElementById('name')?.value;
                  if (name) {
                    url.searchParams.set('name[operation]', 'like');
                    url.searchParams.set('name[value]', name);
                  } else {
                    url.searchParams.delete('name[operation]');
                    url.searchParams.delete('name[value]');
                  }
                  window.location.href = url;
                }
              }}
            />
          </Form>
        }
        actions={[
          {
            variant: 'interactive',
            name: 'Clear filter',
            onAction: () => {
              // Just get the url and remove all query params
              const url = new URL(document.location);
              url.search = '';
              window.location.href = url.href;
            }
          }
        ]}
      />
      <table className="listing sticky">
        <thead>
          <tr>
            <th className="align-bottom">
              <Checkbox
                onChange={(e) => {
                  if (e.target.checked)
                    setSelectedRows(currencies.map((a) => a.id));
                  else setSelectedRows([]);
                }}
              />
            </th>
            <Area
              className=""
              id="currencyGridHeader"
              noOuter
              coreComponents={[
                {
                  component: {
                    default: () => (
                      <SortableHeader
                        name="code"
                        title="Currency Code"
                        currentFilters={currentFilters}
                      />
                    )
                  },
                  sortOrder: 10
                },
                {
                  component: {
                    default: () => (
                      <SortableHeader
                        name="rate"
                        title="Rate (Rely on USD)"
                        currentFilters={currentFilters}
                      />
                    )
                  },
                  sortOrder: 20
                },
                {
                  component: {
                    default: () => (
                      <SortableHeader
                        name="signature"
                        title="Signature"
                        currentFilters={currentFilters}
                      />
                    )
                  },
                  sortOrder: 25
                }
              ]}
            />
          </tr>
        </thead>
        <tbody>
          <Actions
            currencies={currencies}
            selectedIds={selectedRows}
            setSelectedRows={setSelectedRows}
          />
          {currencies
            .filter((c) => c.code !== 'USD')
            .map((a) => (
              <tr key={a.id}>
                <td>
                  <Checkbox
                    isChecked={selectedRows.includes(a.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(selectedRows.concat([a.id]));
                      } else {
                        setSelectedRows(selectedRows.filter((r) => r !== a.id));
                      }
                    }}
                  />
                </td>
                <Area
                  className=""
                  id="currencyGridRow"
                  row={a}
                  noOuter
                  coreComponents={[
                    {
                      component: {
                        default: () => (
                          <CurrencyNameRow
                            id="code"
                            name={a.code}
                            url={a.editUrl}
                          />
                        )
                      },
                      sortOrder: 10
                    },
                    {
                      component: {
                        default: () => <TextRow text={`${a.rate}`} />
                      },
                      sortOrder: 20
                    },
                    {
                      component: {
                        default: () => <TextRow text={`${a.signature}`} />
                      },
                      sortOrder: 25
                    }
                  ]}
                />
              </tr>
            ))}
        </tbody>
      </table>
      {currencies.length === 0 && (
        <div className="flex w-full justify-center">
          There is no attribute to display
        </div>
      )}
      <Pagination total={total} limit={limit} page={page} />
    </Card>
  );
}

CurrencyGrid.propTypes = {
  getCurrencies: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        code: PropTypes.string.isRequired,
        rate: PropTypes.number.isRequired,
        signature: PropTypes.string.isRequired,
        updatedAt: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired
      })
    ).isRequired,
    total: PropTypes.number.isRequired,
    currentFilters: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        operation: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 20
};

export const query = `
  query Query($filters: [FilterInput]) {
    getCurrencies (filters: $filters) {
      items {
        id
        code
        rate
        signature
        createdAt
        updatedAt
        editUrl
        updateApi
      }
      total
      currentFilters {
        key
        operation
        value
      }
    }
  }
`;

export const variables = `
{
  filters: getContextValue('filtersFromUrl')
}`;
