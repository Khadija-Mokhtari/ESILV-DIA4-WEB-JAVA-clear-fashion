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
//const sortPrice = document.querySelector('#sort-select');

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

    //if (recent) {
    //  const twoWeeksAgo = new Date(Date.now() - 12096e5).toISOString(); // 2 weeks = 12096e5 ms
    //  url += `&created_at_after=${twoWeeksAgo}`;
    //}

    //if (maxPrice) {
    //    url += `&price_lte=${maxPrice}`;
    //}

    //if (sort) {
    //  if (sort === 'price_asc') {
    //    url += '&_sort=price&_order=asc';
    //  } else if (sort === 'price_desc') {
    //    url += '&_sort=price&_order=desc';
    //  }
    //}
    
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
 * A voir si on garde pour le sort by price
 */
//const sortProducts = (products, sortOption) => {
//  return products.sort((a, b) => {
//    if (sortOption === 'price-asc') {
//      return a.price - b.price;
//    } 
//    else {
//      return b.price - a.price;
//    }
//  });
//};

/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {

  //const sortedProducts = sortProducts(products, document.querySelector('#sort-select').value);

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

// Recent products
//const RecentProduct = (product) => {
//  const releasedDate = new Date(product.released);
//  const recent = new Date();
//  recent.setDate(recent.getDate() - 14);
//  return (releasedDate >= recent);
//};

//const filterByRecent = (products) => {
//  return products.filter(RecentProduct);
//};


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

//function sortByPrice(products, ascending = true) {
//  if (ascending) {
//    return products.sort((a, b) => a.price - b.price);
//  } 
//  else {
//    return products.sort((a, b) => b.price - a.price);
//  }
//};

//const sortByDate = (products, ascending = true) => {
//  if (ascending) {
//    return products.sort((a, b) => new Date(a.released) - new Date(b.released));
//  }
//  else {
//    return products.sort((a, b) => new Date(b.released) - new Date(a.released));
//  }
//};

//const applySort = products => {
//  const sortValue = selectSort.value;

//  switch (sortValue) {
//    case 'price-asc':
//      return sortByPrice(products);
//    case 'price-desc':
//      return sortByPrice(products, false);
//    case 'date-asc':
//      return sortByDate(products);
//    case 'date-desc':
//      return sortByDate(products, false);
//    default:
//      return products;
//  }
//};

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
//const getRecentProducts = (products, days = 14) => {
  //const today = new Date();
//  const recentThreshold = new Date(today.setDate(today.getDate() - new Date()));
//  return products.filter((product) => new Date(product.released) > recentThreshold);
//};

//const Percentiles = (products, percentiles) => {
//  const prices = products.map((product) => product.price).sort((a, b) => a - b);
//  const result = {};

//  percentiles.forEach((percentile) => {
//    const index = Math.round((prices.length - 1) * (percentile / 100));
//    result[percentile] = prices[index];
//  });

//  return result;
//};

//const findLastReleasedDate = (products) => {
//  const dates = products.map((product) => new Date(product.released));
//  return new Date(Math.max.apply(null, dates));
//};

//const calculateIndicators = (products) => {
//  return {
    //brandsCount,
//    newProductsCount,
//    p50,
//    p90,
//    p95,
//    lastReleasedDate,
//  };
//};

//const main = async () => {
//  const { result, meta } = await fetchProducts();

//  setCurrentProducts({ result, meta });

//  const filteredProducts = applyFilters(currentProducts);
//  const sortedProducts = applySort(filteredProducts);
//  const indicators = calculateIndicators(sortedProducts);

//  render(sortedProducts, currentPagination);
//  renderIndicators(currentPagination, indicators.recentProductsCount, indicators.p50, indicators.p90, indicators.p95, indicators.lastReleaseDate);
//};

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

// Favorite button 
//const handleFavoriteButtonClick = (event) => {
//  if (event.target.matches('.favorite')) {
//    const uuid = event.target.dataset.uuid;
//    const favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
//    const isFavorite = favoriteProducts.includes(uuid);
    
//    if (isFavorite) {
//      const updatedFavorites = favoriteProducts.filter(favUuid => favUuid !== uuid);
//      localStorage.setItem('favoriteProducts', JSON.stringify(updatedFavorites));
//      event.target.textContent = '☆';
//    } else {
//      favoriteProducts.push(uuid);
//      localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
//      event.target.textContent = '★';
//    }
//  }
//};

// Filter by favorite
//const filterByFavorites = (products) => {
//  const favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
//  return products.filter(product => favoriteProducts.includes(product.uuid));
//};

//const applyFiltersAndSort = () => {

//  if (checkboxFavorites.checked) {
//    filteredProducts = filterByFavorites(filteredProducts);
//  }

//};


const toggleFavorite = (uuid) => {
  const favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
  const isFavorite = favoriteProducts.includes(uuid);
  
  if (isFavorite) {
    const updatedFavorites = favoriteProducts.filter(favUuid => favUuid !== uuid);
    localStorage.setItem('favoriteProducts', JSON.stringify(updatedFavorites));
    return false;
  } else {
    favoriteProducts.push(uuid);
    localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
    return true;
  }
};

const handleFavoriteButtonClick = (event) => {
  const target = event.target.closest('.favorite');
  if (target) {
    const uuid = target.dataset.uuid;
    const isFavorite = toggleFavorite(uuid);
    target.textContent = isFavorite ? '★' : '☆';
  }
};

const filterByFavorites = (products) => {
  const favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts')) || [];
  return products.filter(({ uuid }) => favoriteProducts.includes(uuid));
};

const applyFiltersAndSort = () => {
  let filteredProducts = currentProducts;
  if (checkboxFavorites.checked) {
    filteredProducts = filterByFavorites(filteredProducts);
  }
  // apply other filters and sorting here
  return filteredProducts;
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
checkboxRecent.addEventListener('change', () => { // Add the listener for the recent checkbox
  //const products = await fetchProducts(currentPagination.currentPage, selectShow.value, selectBrand.value, event.target.checked);

  //setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

checkboxReasonablePrice.addEventListener('change', () => { // Add the listener for the recent checkbox
  //const products = await fetchProducts(currentPagination.currentPage, selectShow.value, selectBrand.value, event.target.checked);

  //setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

selectSort.addEventListener('change', () => {
  render(currentProducts, currentPagination);
});

sectionProducts.addEventListener('click', handleFavoriteButtonClick);
checkboxFavorites.addEventListener('change', applyFiltersAndSort);


//selectPrice.addEventListener('change', async (event) => {
//    const products = await fetchProducts(currentPagination.currentPage, selectShow.value, selectBrand.value, event.target.value);
  
//    setCurrentProducts(products);
//    render(currentProducts, currentPagination);
//});



//sortPrice.addEventListener('change', async (event) => {
//  const products = await fetchProducts(currentPagination.currentPage, selectShow.value, selectBrand.value, event.target.value, sortPrice.value); // Mettre à jour la sélection de la marque

//  setCurrentProducts(products);
//  render(currentProducts, currentPagination);
//});


//const applyFilters = async (event) => {
//  const brand = selectBrand.value;
  //const recent = checkboxRecent.checked;
  //const maxPrice = selectPrice.value;
//  const sort = event.target.value; // Read the selected sorting order

//  currentProducts = await fetchProducts(currentPagination.currentPage, selectShow.value, brand, sort);
  
//  render(currentProducts, currentPagination);
//}

//sortPrice.addEventListener('change', applyFilters);



//const updateProducts = async (event) => {
//  const brand = selectBrand.value;
  //const recent = checkboxRecent.checked;
  //const maxPrice = selectPrice.value;
//  const sort = event.target.value; // Get the selected sorting option
//  const products = await fetchProducts(currentPage, pageSize, brand, false, 50, sort);
//  displayProducts(products);
//  displayPagination(products.pagination);
//};



document.addEventListener('DOMContentLoaded', async () => {
  const products = await fetchProducts();

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});


