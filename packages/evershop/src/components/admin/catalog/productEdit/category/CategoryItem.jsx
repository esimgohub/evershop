import React from 'react';
import { useQuery } from 'urql';
import PropTypes from 'prop-types';
import Spinner from '@components/common/Spinner';
import MinusSmall from '@heroicons/react/outline/MinusSmIcon';
import PlusSmall from '@heroicons/react/outline/PlusSmIcon';
import { CategoryType } from '@evershop/evershop/src/modules/catalog/utils/enums/category-type';

const childrenQuery = `
  query Query ($filters: [FilterInput]) {
    categories (filters: $filters) {
      items {
        categoryId
        categoryType
        uuid
        name
        path {
          name
        }
      }
    }
  }
`;

function CategoryItem({ category, selectedCategory, setSelectedCategory }) {
  const [expanded, setExpanded] = React.useState(false);
  const [result] = useQuery({
    query: childrenQuery,
    variables: {
      filters: [
        {
          key: 'parent',
          operation: 'eq',
          value: category.categoryId.toString()
        }
      ]
    },
    pause: !expanded
  });

  const { data, fetching, error } = result;

  if (error) {
    return (
      <p>
        Oh no...
        {error.message}
      </p>
    );
  }

  const isCountryCategory =
    category && category.categoryType === CategoryType.Country;

  return (
    <li>
      <div className="flex justify-start gap-1 items-center">
        {isCountryCategory ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
          />
        ) : (
          <span
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <MinusSmall width={15} height={15} />
            ) : (
              <PlusSmall width={15} height={15} />
            )}
          </span>
        )}

        {fetching && (
          <span>
            <Spinner width={20} height={20} />
          </span>
        )}
        {isCountryCategory ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setSelectedCategory(category);
            }}
          >
            {/* {category.categoryId === selectedCategory?.categoryId ? (
              <strong>{category.name}</strong>
            ) : (
              category.name
            )} */}
            {category.uuid === selectedCategory?.uuid ? (
              <strong>{category.name}</strong>
            ) : (
              category.name
            )}
          </a>
        ) : (
          <span className="cursor-not-allowed">
            {category.uuid === selectedCategory?.uuid ? (
              <strong>{category.name}</strong>
            ) : (
              category.name
            )}
          </span>
        )}
      </div>
      {data && data.categories.items.length > 0 && expanded && (
        <ul>
          {data.categories.items.map((child) => (
            <CategoryItem
              key={child.value}
              category={child}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

CategoryItem.propTypes = {
  category: PropTypes.shape({
    categoryId: PropTypes.number.isRequired,
    uuid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    path: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    ),
    children: PropTypes.arrayOf(
      PropTypes.shape({
        categoryId: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        path: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired
          })
        )
      })
    )
  }),
  selectedCategory: PropTypes.shape({
    categoryId: PropTypes.number.isRequired,
    uuid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    path: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    )
  }),
  setSelectedCategory: PropTypes.func.isRequired
};

CategoryItem.defaultProps = {
  category: {},
  selectedCategory: {}
};

export default CategoryItem;
