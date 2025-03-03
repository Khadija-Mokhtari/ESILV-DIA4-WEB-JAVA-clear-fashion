// FILTRE 'BRAND'
// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/*
Description of the available api
GET https://clear-fashion-api.vercel.app/

Search for specific products

This endpoint accepts the following optional query string parameters:

- `page` - page of products to return
- `size` - number of products to return

GET https://clear-fashion-api.vercel.app/brands

Search for available brands list
*/

// current products on the page
let currentProducts = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sectionProducts = document.querySelector('#products');

const selectBrand = document.querySelector('#brand-select');

const checkboxRecent = document.querySelector('#recent-checkbox');
const checkboxReasonablePrice = document.querySelector('#reasonable-checkbox');

// To sort our products whether they are cheaper, more expensive, recent or not

const selectSort = document.querySelector('#sort-select');

// Display our "span"
const spanNbProducts = document.querySelector('#nbProducts');
//const spanNbBrands = doculent.querySelector('#nbBrands');
const spanNbNewProducts = document.querySelector('#nbNewProducts');
const spanP50PriceValue = document.querySelector('#p50PriceValue');
const spanP90PriceValue = document.querySelector('#p90PriceValue');
const spanP95PriceValue = document.querySelector('#p95PriceValue');
const spanLastReleasedDate = document.querySelector('#lastReleasedDate');



/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentProducts = ({result, meta}) => {
  currentProducts = result;
  currentPagination = meta;
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @param  {String}  [brand] - brand to filter by
 * @param  {Boolean} [recent=false] - whether to filter by recent products or not
 * @param  {Number}  [maxPrice=50]
 * @param  {String}  [sort]
 * @return {Object}
 */
const fetchProducts = async (page = 1, size = 12, brand) => { // Ajouter la marque comme paramètre
  try {
    let url = `https://clear-fashion-api.vercel.app?page=${page}&size=${size}`;
    
    if (brand) {
      url += `&brand=${brand}`;
    }
    
    const response = await fetch(url);
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentProducts, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentProducts, currentPagination};
  }
};



/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = products
    .map(product => {
      return `
      <div class="product" id=${product.uuid}>
        <span>${product.brand}</span>
        <a href="${product.link}"target="_blank">${product.name}</a>
        <button class="favorite" data uuid="${product.uuid}">☆</button>
        <span>${product.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionProducts.innerHTML = '<h2>Products</h2>';
  sectionProducts.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = (pagination, newProductsCount, p50, p90, p95, lastReleasedDate)   => {
  const {count} = pagination;

  spanNbProducts.innerHTML = count;
  //spanNbBrands.innerHTML = brandsCount;
  spanNbNewProducts.innerHTML = newProductsCount;
  spanP50PriceValue.innerHTML = p50;
  spanP90PriceValue.innerHTML = p90;
  spanP95PriceValue.innerHTML = p95;
  spanLastReleasedDate.innerHTML = lastReleasedDate;
};

const render = (products, pagination) => {
  const filteredProducts = applyFilters(products);
  const sortedProducts = applySort(filteredProducts);
  renderProducts(filteredProducts);
  renderProducts(sortedProducts);
  renderPagination(pagination);
  renderIndicators(pagination);
};

/**
 * Filters
 */

const filterByRecent = (products, twoWeeks = 14) => {
  const recent = new Date();
  recent.setDate(recent.getDate() - twoWeeks);
  return products.filter(product => new Date(product.released) >= recent);
};


// Reasonable price
const filterByReasonablePrice = (products, maxPrice = 50) => {
  return products.filter(product => product.price <= maxPrice);
};

// Apply our filters
const applyFilters = products => {
  let filteredProducts = products;

  if (checkboxRecent.checked) {
    filteredProducts = filterByRecent(filteredProducts);
  }

  if (checkboxReasonablePrice.checked) {
    filteredProducts = filterByReasonablePrice(filteredProducts);
  }

  return filteredProducts;
};

/**
 * Sort functions
 */

const applySort = (products) => {
  const sortFunctions = {
    'price-asc': (arr) => arr.sort((a, b) => a.price - b.price),
    'price-desc': (arr) => arr.sort((a, b) => b.price - a.price),
    'date-asc': (arr) => arr.sort((a, b) => new Date(a.released) - new Date(b.released)),
    'date-desc': (arr) => arr.sort((a, b) => new Date(b.released) - new Date(a.released)),
  };
  
  const sortFunction = sortFunctions[selectSort.value];
  return sortFunction ? sortFunction([...products]) : products;
};


/** 
 * Indicators
 */
const getRecentProducts = (products, days = 14) => {
  const recentThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return products.filter(({ released }) => new Date(released) > recentThreshold);
};

const Percentiles = (products, percentiles) => {
  const prices = products.map(({ price }) => price).sort((a, b) => a - b);
  return percentiles.reduce((result, percentile) => {
    const index = Math.round((prices.length - 1) * (percentile / 100));
    result[percentile] = prices[index];
    return result;
  }, {});
};

const findLastReleasedDate = (products) => {
  const dates = products.map(({ released }) => new Date(released));
  return new Date(Math.max(...dates));
};

const calculateIndicators = (products) => {
  const newProductsCount = getRecentProducts(products).length;
  const { p50, p90, p95 } = Percentiles(products, [50, 90, 95]);
  const lastReleasedDate = findLastReleasedDate(products);
  return { newProductsCount, p50, p90, p95, lastReleasedDate };
};

const main = async () => {
  const { result, meta } = await fetchProducts();

  setCurrentProducts({ result, meta });

  const filteredProducts = applyFilters(currentProducts);
  const sortedProducts = applySort(filteredProducts);
  const indicators = calculateIndicators(sortedProducts);

  render(sortedProducts, currentPagination);
  renderIndicators(currentPagination, indicators.newProductsCount, indicators.p50, indicators.p90, indicators.p95, indicators.lastReleasedDate);
};

/**
  * Favorite button
  */
const handleFavoriteButtonClick = (event) => {
  if (event.target.matches('.favorite')) {
    const uuid = event.target.dataset.uuid;
    const favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
    const isFavorite = favoriteProducts.includes(uuid);
    
    if (isFavorite) {
      const updatedFavorites = favoriteProducts.filter(favUuid => favUuid !== uuid);
      localStorage.setItem('favoriteProducts', JSON.stringify(updatedFavorites));
      event.target.textContent = '☆';
    } else {
      favoriteProducts.push(uuid);
      localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
      event.target.textContent = '★';
    }
  }
};
 /**
  * Filter by favorite
  */

const filterByFavorites = (products) => {
  const favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
  return products.filter(product => favoriteProducts.includes(product.uuid));
};

const applyFiltersAndSort = () => {

  if (checkboxFavorites.checked) {
    filteredProducts = filterByFavorites(filteredProducts);
  }

};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of products to display
 */
selectShow.addEventListener('change', async (event) => {
  const products = await fetchProducts(currentPagination.currentPage, parseInt(event.target.value)); // Ajouter la marque

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

/**
 * Select the page to display
 */
selectPage.addEventListener('change', async (event) => {
  const page = parseInt(event.target.value)
  const products = await fetchProducts(page, parseInt(selectShow.value)); // Ajouter la marque

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

/**
 * Select the brand to display
 */
selectBrand.addEventListener('change', async (event) => { // Ajouter la sélection de la marque
  const products = await fetchProducts(currentPagination.currentPage, selectShow.value, event.target.value); // Mettre à jour la sélection de la marque

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

/**
 * Select the recent products
 */
checkboxRecent.addEventListener('change', () => { 
  render(currentProducts, currentPagination);
});

checkboxReasonablePrice.addEventListener('change', () => {
  render(currentProducts, currentPagination);
});

selectSort.addEventListener('change', () => {
  render(currentProducts, currentPagination);
});

sectionProducts.addEventListener('click', handleFavoriteButtonClick);
checkboxFavorites.addEventListener('change', applyFiltersAndSort);

document.addEventListener('DOMContentLoaded', async () => {
  const products = await fetchProducts();

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});


